import { wrapHandler } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import {
  getAgents,
  getAgentById,
  getAgentOrders,
  getAgentLeaderboard,
  exportAgentsToExcel,
  exportAgentOrdersToExcel,
} from '@/lib/services/agent-service';
import * as XLSX from 'xlsx';

async function _GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'agents';
    const timestamp = new Date().toISOString().slice(0, 10);

    if (type === 'agents') {
      const { agents } = await getAgents({ limit: 1000 });
      const buffer = exportAgentsToExcel(agents);

      return new Response(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Rajalakshmi_Sales_Agents_${timestamp}.xlsx"`,
        },
      });
    }

    if (type === 'agent-orders') {
      const agentId = parseInt(searchParams.get('agentId') || '', 10);
      if (isNaN(agentId)) {
        return Response.json({ message: 'Valid agentId required' }, { status: 400 });
      }

      const agent = await getAgentById(agentId);
      if (!agent) {
        return Response.json({ message: 'Agent not found' }, { status: 404 });
      }

      const { orders: agentOrders } = await getAgentOrders(agentId, { limit: 1000 });
      const buffer = exportAgentOrdersToExcel(agent, agentOrders);

      return new Response(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Orders_${agent.agentCode}_${timestamp}.xlsx"`,
        },
      });
    }

    if (type === 'reports') {
      const datePreset = searchParams.get('datePreset') || 'all';
      const leaderboard = await getAgentLeaderboard({ datePreset });

      const data = leaderboard.map((l) => ({
        Rank: l.rank,
        'Agent ID': l.agentCode,
        'Agent Name': l.name,
        'Referral Code': l.referralCode,
        'Status': l.isActive ? 'Active' : 'Inactive',
        'Territory': l.location || '-',
        'Total Attributed Orders': l.totalOrders,
        'Delivered Orders': l.deliveredOrders,
        'Cancelled Orders': l.cancelledOrders,
        'Total Order Value (INR)': Number(l.totalAttributedValue.toFixed(2)),
        'Delivered Sales Value (INR)': Number(l.deliveredSalesValue.toFixed(2)),
        'Average Order Value (INR)': Number(l.averageOrderValue.toFixed(2)),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Performance Leaderboard');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Rajalakshmi_Agent_Performance_${timestamp}.xlsx"`,
        },
      });
    }

    return Response.json({ message: 'Invalid export type' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ message: error.message || 'Export failed' }, { status: 500 });
  }
}

export const GET = wrapHandler(_GET);
