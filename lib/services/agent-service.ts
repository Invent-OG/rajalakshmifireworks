import { db } from '@/db';
import { salesAgents, orders, type SalesAgent, type NewSalesAgent } from '@/db/schema';
import { eq, and, sql, desc, asc, isNotNull, inArray, gte, lte } from 'drizzle-orm';
import { ValidationError } from '@/lib/utils/errors';
import type { CreateAgentInput, UpdateAgentInput } from '@/lib/validation/agent';
import * as XLSX from 'xlsx';

/**
 * Generates the next sequential unique Agent ID (e.g. AGT-001, AGT-002)
 */
export async function generateUniqueAgentCode(): Promise<string> {
  const allAgents = await db
    .select({ agentCode: salesAgents.agentCode })
    .from(salesAgents);

  let highestNum = 0;
  for (const a of allAgents) {
    const match = a.agentCode.match(/^AGT-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highestNum) highestNum = num;
    }
  }

  const nextNum = highestNum + 1;
  const candidate = `AGT-${String(nextNum).padStart(3, '0')}`;
  return candidate;
}

/**
 * Generates a clean, unique uppercase referral code based on agent's name (e.g. GUNA01, RAJ01)
 */
export async function generateUniqueReferralCode(agentName: string): Promise<string> {
  const cleanName = agentName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  const prefix = (cleanName.slice(0, 4) || 'REF').padEnd(3, 'X');

  const existing = await db
    .select({ referralCode: salesAgents.referralCode })
    .from(salesAgents);
  const existingSet = new Set(existing.map((e) => e.referralCode.toUpperCase()));

  for (let i = 1; i <= 99; i++) {
    const candidate = `${prefix}${String(i).padStart(2, '0')}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback random digits if 1-99 are taken
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}${randomSuffix}`;
}

/**
 * Validate an agent referral code and ensure agent is currently active
 */
export async function validateAgentReferralCode(code: string | null | undefined): Promise<{
  valid: boolean;
  agent?: SalesAgent;
  message?: string;
}> {
  if (!code || !code.trim()) {
    return { valid: false, message: 'Referral code is required' };
  }

  const normalized = code.trim().toUpperCase();
  const [agent] = await db
    .select()
    .from(salesAgents)
    .where(sql`UPPER(${salesAgents.referralCode}) = ${normalized}`)
    .limit(1);

  if (!agent) {
    return { valid: false, message: 'Invalid referral code' };
  }

  if (!agent.isActive) {
    return {
      valid: false,
      message: 'This sales agent is currently inactive and cannot receive new referrals',
    };
  }

  return { valid: true, agent };
}

/**
 * Fetch paginated agents with performance metrics
 */
export async function getAgents(options: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(5, options.limit || 25));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (options.status === 'ACTIVE') {
    conditions.push(eq(salesAgents.isActive, true));
  } else if (options.status === 'INACTIVE') {
    conditions.push(eq(salesAgents.isActive, false));
  }

  if (options.search && options.search.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      sql`(${salesAgents.name} ILIKE ${q} OR ${salesAgents.agentCode} ILIKE ${q} OR ${salesAgents.referralCode} ILIKE ${q} OR ${salesAgents.mobile} ILIKE ${q} OR ${salesAgents.location} ILIKE ${q} OR ${salesAgents.email} ILIKE ${q})`
    );
  }

  if (options.dateFrom) {
    conditions.push(gte(salesAgents.joiningDate, new Date(options.dateFrom)));
  }
  if (options.dateTo) {
    const end = new Date(options.dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(salesAgents.joiningDate, end));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute base list
  const [agentsList, totalCountResult] = await Promise.all([
    db
      .select()
      .from(salesAgents)
      .where(whereClause)
      .orderBy(desc(salesAgents.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(salesAgents)
      .where(whereClause),
  ]);

  const total = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  if (agentsList.length === 0) {
    return {
      agents: [],
      pagination: { total, totalPages, page, limit },
    };
  }

  // Aggregate order stats for these agents
  const agentIds = agentsList.map((a) => a.id);
  const orderStats = await db
    .select({
      agentId: orders.agentId,
      totalOrders: sql<number>`count(*)::int`,
      newOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'NEW')::int`,
      processingOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} IN ('CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY'))::int`,
      dispatchedOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'OUT_FOR_DELIVERY')::int`,
      deliveredOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED')::int`,
      cancelledOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'CANCELLED')::int`,
      totalOrderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
      deliveredOrderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0)::float`,
    })
    .from(orders)
    .where(inArray(orders.agentId, agentIds))
    .groupBy(orders.agentId);

  const statsMap = new Map(orderStats.map((s) => [s.agentId, s]));

  const enrichedAgents = agentsList.map((a) => {
    const s = statsMap.get(a.id);
    return {
      ...a,
      totalOrders: s?.totalOrders || 0,
      newOrders: s?.newOrders || 0,
      processingOrders: s?.processingOrders || 0,
      dispatchedOrders: s?.dispatchedOrders || 0,
      deliveredOrders: s?.deliveredOrders || 0,
      cancelledOrders: s?.cancelledOrders || 0,
      totalOrderValue: s?.totalOrderValue || 0,
      deliveredOrderValue: s?.deliveredOrderValue || 0,
    };
  });

  return {
    agents: enrichedAgents,
    pagination: { total, totalPages, page, limit },
  };
}

/**
 * Fetch a single agent by ID with complete aggregated metrics
 */
export async function getAgentById(id: number) {
  const [agent] = await db
    .select()
    .from(salesAgents)
    .where(eq(salesAgents.id, id))
    .limit(1);

  if (!agent) return null;

  const [stats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      newOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'NEW')::int`,
      processingOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} IN ('CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY'))::int`,
      deliveredOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED')::int`,
      cancelledOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'CANCELLED')::int`,
      totalOrderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
      deliveredOrderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0)::float`,
    })
    .from(orders)
    .where(eq(orders.agentId, id));

  const totalOrders = stats?.totalOrders || 0;
  const deliveredOrders = stats?.deliveredOrders || 0;
  const deliveredOrderValue = stats?.deliveredOrderValue || 0;
  const totalOrderValue = stats?.totalOrderValue || 0;
  const averageOrderValue =
    totalOrders > 0 ? Math.round((totalOrderValue / totalOrders) * 100) / 100 : 0;

  return {
    ...agent,
    totalOrders,
    newOrders: stats?.newOrders || 0,
    processingOrders: stats?.processingOrders || 0,
    deliveredOrders,
    cancelledOrders: stats?.cancelledOrders || 0,
    totalOrderValue,
    deliveredOrderValue,
    averageOrderValue,
  };
}

/**
 * Fetch attributed orders for a specific agent with filtering & pagination
 */
export async function getAgentOrders(
  agentId: number,
  options: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(5, options.limit || 25));
  const offset = (page - 1) * limit;

  const conditions = [eq(orders.agentId, agentId)];

  if (options.status && options.status !== 'ALL') {
    conditions.push(eq(orders.orderStatus, options.status));
  }

  if (options.search && options.search.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      sql`(${orders.invoiceNumber} ILIKE ${q} OR ${orders.customerNameSnapshot} ILIKE ${q} OR ${orders.customerMobileSnapshot} ILIKE ${q})`
    );
  }

  if (options.dateFrom) {
    conditions.push(gte(orders.placedAt, new Date(options.dateFrom)));
  }
  if (options.dateTo) {
    const end = new Date(options.dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.placedAt, end));
  }

  const whereClause = and(...conditions);

  let orderByClause = [desc(orders.placedAt)];
  if (options.sortBy === 'total_desc') {
    orderByClause = [sql`CAST(${orders.totalAmount} AS NUMERIC) DESC`];
  } else if (options.sortBy === 'total_asc') {
    orderByClause = [sql`CAST(${orders.totalAmount} AS NUMERIC) ASC`];
  } else if (options.sortBy === 'placedAt_asc') {
    orderByClause = [asc(orders.placedAt)];
  }

  const [orderList, totalCountResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        customerName: orders.customerNameSnapshot,
        customerMobile: orders.customerMobileSnapshot,
        placedAt: orders.placedAt,
        totalAmount: orders.totalAmount,
        subtotal: orders.subtotal,
        deliveryCharge: orders.deliveryCharge,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        fulfillmentType: orders.fulfillmentType,
        referralCode: orders.referralCode,
        attributionSource: orders.attributionSource,
      })
      .from(orders)
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause),
  ]);

  const total = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    orders: orderList,
    pagination: { total, totalPages, page, limit },
  };
}

/**
 * Create a new agent record with unique agent code and referral code
 */
export async function createAgent(input: CreateAgentInput): Promise<SalesAgent> {
  const agentCode = input.agentCode?.trim()
    ? input.agentCode.trim().toUpperCase()
    : await generateUniqueAgentCode();

  const referralCode = input.referralCode?.trim()
    ? input.referralCode.trim().toUpperCase()
    : await generateUniqueReferralCode(input.name);

  // Check unique constraints before insert
  const [existingCode] = await db
    .select({ id: salesAgents.id })
    .from(salesAgents)
    .where(sql`UPPER(${salesAgents.agentCode}) = ${agentCode}`)
    .limit(1);

  if (existingCode) {
    throw new ValidationError(`Agent ID "${agentCode}" is already in use. Please specify a different ID.`);
  }

  const [existingRef] = await db
    .select({ id: salesAgents.id })
    .from(salesAgents)
    .where(sql`UPPER(${salesAgents.referralCode}) = ${referralCode}`)
    .limit(1);

  if (existingRef) {
    throw new ValidationError(`Referral code "${referralCode}" is already in use. Please specify a different code.`);
  }

  const joiningDate = input.joiningDate ? new Date(input.joiningDate) : new Date();

  const [newAgent] = await db
    .insert(salesAgents)
    .values({
      agentCode,
      name: input.name.trim(),
      referralCode,
      mobile: input.mobile.trim(),
      email: input.email?.trim() || null,
      location: input.location?.trim() || null,
      joiningDate,
      isActive: input.isActive ?? true,
    })
    .returning();

  return newAgent;
}

/**
 * Update an existing agent's details
 */
export async function updateAgent(id: number, input: UpdateAgentInput): Promise<SalesAgent> {
  const [agent] = await db
    .select()
    .from(salesAgents)
    .where(eq(salesAgents.id, id))
    .limit(1);

  if (!agent) {
    throw new ValidationError('Agent not found');
  }

  const updates: Partial<NewSalesAgent> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.mobile !== undefined) updates.mobile = input.mobile.trim();
  if (input.email !== undefined) updates.email = input.email?.trim() || null;
  if (input.location !== undefined) updates.location = input.location?.trim() || null;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.joiningDate !== undefined) {
    updates.joiningDate = input.joiningDate ? new Date(input.joiningDate) : agent.joiningDate;
  }

  if (input.agentCode && input.agentCode.trim().toUpperCase() !== agent.agentCode.toUpperCase()) {
    const newCode = input.agentCode.trim().toUpperCase();
    const [existing] = await db
      .select({ id: salesAgents.id })
      .from(salesAgents)
      .where(and(sql`UPPER(${salesAgents.agentCode}) = ${newCode}`, sql`${salesAgents.id} != ${id}`))
      .limit(1);
    if (existing) throw new ValidationError(`Agent ID "${newCode}" is already in use.`);
    updates.agentCode = newCode;
  }

  if (input.referralCode && input.referralCode.trim().toUpperCase() !== agent.referralCode.toUpperCase()) {
    const newRef = input.referralCode.trim().toUpperCase();
    const [existing] = await db
      .select({ id: salesAgents.id })
      .from(salesAgents)
      .where(and(sql`UPPER(${salesAgents.referralCode}) = ${newRef}`, sql`${salesAgents.id} != ${id}`))
      .limit(1);
    if (existing) throw new ValidationError(`Referral code "${newRef}" is already in use.`);
    updates.referralCode = newRef;
  }

  const [updated] = await db
    .update(salesAgents)
    .set(updates)
    .where(eq(salesAgents.id, id))
    .returning();

  return updated;
}

/**
 * Get Agent Tracking Dashboard Metrics and Charts based on selected date filter
 */
export async function getAgentTrackingDashboard(options: {
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (options.datePreset === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (options.datePreset === 'yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
  } else if (options.datePreset === 'last7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (options.datePreset === 'last30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (options.datePreset === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (options.datePreset === 'lastMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (options.dateFrom) {
    startDate = new Date(options.dateFrom);
    if (options.dateTo) {
      endDate = new Date(options.dateTo);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  const orderConditions = [isNotNull(orders.agentId)];
  if (startDate) orderConditions.push(gte(orders.placedAt, startDate));
  if (endDate) orderConditions.push(lte(orders.placedAt, endDate));
  const orderWhereClause = and(...orderConditions);

  // 1. Total Agents & Active Agents
  const [agentCounts] = await db
    .select({
      totalAgents: sql<number>`count(*)::int`,
      activeAgents: sql<number>`count(*) FILTER (WHERE ${salesAgents.isActive} = true)::int`,
    })
    .from(salesAgents);

  // 2. Attributed Orders Summary
  const [orderMetrics] = await db
    .select({
      totalAttributedOrders: sql<number>`count(*)::int`,
      totalAttributedOrderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
      totalDeliveredOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED')::int`,
      totalDeliveredOrderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0)::float`,
      cancelledOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'CANCELLED')::int`,
      newOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'NEW')::int`,
      processingOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} IN ('CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY'))::int`,
    })
    .from(orders)
    .where(orderWhereClause);

  // 3. Top-Performing Agent
  const topAgentList = await db
    .select({
      agentId: orders.agentId,
      agentName: salesAgents.name,
      agentCode: salesAgents.agentCode,
      referralCode: salesAgents.referralCode,
      totalOrders: sql<number>`count(*)::int`,
      deliveredOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED')::int`,
      totalValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
      deliveredValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0)::float`,
    })
    .from(orders)
    .innerJoin(salesAgents, eq(orders.agentId, salesAgents.id))
    .where(orderWhereClause)
    .groupBy(orders.agentId, salesAgents.name, salesAgents.agentCode, salesAgents.referralCode)
    .orderBy(sql`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), sum(CAST(${orders.totalAmount} AS NUMERIC))) DESC`)
    .limit(1);

  const topAgent = topAgentList[0] || null;

  // 4. Chart: Orders Over Time (Grouped by date)
  const ordersOverTimeRaw = await db
    .select({
      date: sql<string>`to_char(${orders.placedAt}, 'YYYY-MM-DD')`,
      orderCount: sql<number>`count(*)::int`,
      orderValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
    })
    .from(orders)
    .where(orderWhereClause)
    .groupBy(sql`to_char(${orders.placedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.placedAt}, 'YYYY-MM-DD') ASC`);

  // 5. Chart: Value by Agent (Top 8 agents)
  const valueByAgent = await db
    .select({
      agentName: salesAgents.name,
      agentCode: salesAgents.agentCode,
      referralCode: salesAgents.referralCode,
      totalValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
      deliveredValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0)::float`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(orders)
    .innerJoin(salesAgents, eq(orders.agentId, salesAgents.id))
    .where(orderWhereClause)
    .groupBy(salesAgents.name, salesAgents.agentCode, salesAgents.referralCode)
    .orderBy(sql`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0) DESC`)
    .limit(8);

  // 6. Chart: Agent Performance Comparison
  const agentPerformanceComparison = await db
    .select({
      agentName: salesAgents.name,
      agentCode: salesAgents.agentCode,
      delivered: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED')::int`,
      processing: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} IN ('NEW', 'CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY'))::int`,
      cancelled: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'CANCELLED')::int`,
    })
    .from(orders)
    .innerJoin(salesAgents, eq(orders.agentId, salesAgents.id))
    .where(orderWhereClause)
    .groupBy(salesAgents.name, salesAgents.agentCode)
    .orderBy(sql`count(*) DESC`)
    .limit(8);

  // 7. Chart: Order Status Distribution
  const orderStatusDistribution = await db
    .select({
      status: orders.orderStatus,
      count: sql<number>`count(*)::int`,
      value: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
    })
    .from(orders)
    .where(orderWhereClause)
    .groupBy(orders.orderStatus);

  return {
    metrics: {
      totalAgents: agentCounts?.totalAgents || 0,
      activeAgents: agentCounts?.activeAgents || 0,
      totalAttributedOrders: orderMetrics?.totalAttributedOrders || 0,
      totalAttributedOrderValue: orderMetrics?.totalAttributedOrderValue || 0,
      totalDeliveredOrders: orderMetrics?.totalDeliveredOrders || 0,
      totalDeliveredOrderValue: orderMetrics?.totalDeliveredOrderValue || 0,
      cancelledOrders: orderMetrics?.cancelledOrders || 0,
      newOrders: orderMetrics?.newOrders || 0,
      processingOrders: orderMetrics?.processingOrders || 0,
      topAgent,
    },
    charts: {
      ordersOverTime: ordersOverTimeRaw,
      valueByAgent,
      agentPerformanceComparison,
      orderStatusDistribution,
    },
  };
}

/**
 * Fetch Leaderboard & Performance Reports
 */
export async function getAgentLeaderboard(options: {
  rankBy?: 'delivered_value' | 'total_value' | 'delivered_orders' | 'total_orders';
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (options.datePreset === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (options.datePreset === 'last7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (options.datePreset === 'last30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (options.datePreset === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (options.dateFrom) {
    startDate = new Date(options.dateFrom);
    if (options.dateTo) {
      endDate = new Date(options.dateTo);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  const orderConditions = [isNotNull(orders.agentId)];
  if (startDate) orderConditions.push(gte(orders.placedAt, startDate));
  if (endDate) orderConditions.push(lte(orders.placedAt, endDate));
  const orderWhereClause = and(...orderConditions);

  let sortSql = sql`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0) DESC`;
  if (options.rankBy === 'total_value') {
    sortSql = sql`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0) DESC`;
  } else if (options.rankBy === 'delivered_orders') {
    sortSql = sql`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED') DESC`;
  } else if (options.rankBy === 'total_orders') {
    sortSql = sql`count(*) DESC`;
  }

  const leaderboard = await db
    .select({
      agentId: salesAgents.id,
      agentCode: salesAgents.agentCode,
      name: salesAgents.name,
      referralCode: salesAgents.referralCode,
      mobile: salesAgents.mobile,
      location: salesAgents.location,
      isActive: salesAgents.isActive,
      joiningDate: salesAgents.joiningDate,
      totalOrders: sql<number>`count(*)::int`,
      deliveredOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED')::int`,
      cancelledOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'CANCELLED')::int`,
      totalAttributedValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)), 0)::float`,
      deliveredSalesValue: sql<number>`coalesce(sum(CAST(${orders.totalAmount} AS NUMERIC)) FILTER (WHERE ${orders.orderStatus} = 'DELIVERED'), 0)::float`,
    })
    .from(salesAgents)
    .leftJoin(orders, and(eq(orders.agentId, salesAgents.id), orderWhereClause))
    .groupBy(salesAgents.id)
    .orderBy(sortSql, desc(salesAgents.createdAt));

  return leaderboard.map((row, index) => ({
    rank: index + 1,
    ...row,
    averageOrderValue:
      row.totalOrders > 0
        ? Math.round((row.totalAttributedValue / row.totalOrders) * 100) / 100
        : 0,
  }));
}

/**
 * Excel export generators using project's existing xlsx library
 */
export function exportAgentsToExcel(agents: any[]): Uint8Array {
  const data = agents.map((a) => ({
    'Agent ID': a.agentCode,
    'Agent Name': a.name,
    'Referral Code': a.referralCode,
    'Mobile Number': a.mobile,
    'Email Address': a.email || '-',
    'Location / Territory': a.location || '-',
    'Joining Date': a.joiningDate ? new Date(a.joiningDate).toLocaleDateString('en-IN') : '-',
    'Status': a.isActive ? 'Active' : 'Inactive',
    'Total Attributed Orders': a.totalOrders || 0,
    'Delivered Orders': a.deliveredOrders || 0,
    'Cancelled Orders': a.cancelledOrders || 0,
    'Total Attributed Value (INR)': Number((a.totalOrderValue || a.totalAttributedValue || 0).toFixed(2)),
    'Delivered Sales Value (INR)': Number((a.deliveredOrderValue || a.deliveredSalesValue || 0).toFixed(2)),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Agents');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function exportAgentOrdersToExcel(agent: SalesAgent, orderList: any[]): Uint8Array {
  const data = orderList.map((o) => ({
    'Invoice Number': o.invoiceNumber,
    'Order Date': new Date(o.placedAt).toLocaleString('en-IN'),
    'Customer Name': o.customerName || o.customerNameSnapshot,
    'Customer Mobile': o.customerMobile || o.customerMobileSnapshot,
    'Fulfillment': o.fulfillmentType,
    'Order Status': o.orderStatus,
    'Payment Status': o.paymentStatus || 'PENDING',
    'Subtotal (INR)': Number(parseFloat(String(o.subtotal || 0)).toFixed(2)),
    'Delivery Charge (INR)': Number(parseFloat(String(o.deliveryCharge || 0)).toFixed(2)),
    'Total Amount (INR)': Number(parseFloat(String(o.totalAmount || 0)).toFixed(2)),
    'Referral Code Used': o.referralCode || agent.referralCode,
    'Attribution Source': o.attributionSource === 'LINK' ? 'Referral Link' : 'Entered Code',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, `Orders - ${agent.agentCode}`);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
