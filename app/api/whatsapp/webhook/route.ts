import { NextRequest } from 'next/server';
import { db } from '@/db';
import { whatsappMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';
import { verifyWebhookSignature, parseWebhookPayload } from '@/lib/whatsapp/validation';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/whatsapp/webhook
 * Verification endpoint required by Meta Graph API Webhooks.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const config = getWhatsAppConfig();

  // If verify token is not set, reject safely
  if (!config.verifyToken) {
    logger.warn('whatsapp.webhook', 'Webhook verification attempted but WHATSAPP_VERIFY_TOKEN is not configured');
    return new Response('Webhook verify token not configured', { status: 500 });
  }

  if (mode === 'subscribe' && token === config.verifyToken) {
    logger.info('whatsapp.webhook', 'Meta Webhook verified successfully');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  logger.warn('whatsapp.webhook', 'Meta Webhook verification failed: token or mode mismatch', {
    receivedMode: mode,
  });

  return new Response('Verification failed', { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Incoming status and message event handler.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const config = getWhatsAppConfig();

    // Verify HMAC SHA-256 signature if app secret is provided
    if (config.appSecret) {
      const signatureHeader = request.headers.get('x-hub-signature-256');
      const isValid = verifyWebhookSignature(rawBody, signatureHeader, config.appSecret);

      if (!isValid) {
        logger.warn('whatsapp.webhook', 'Invalid webhook signature detected');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch {
      logger.error('whatsapp.webhook', 'Malformed JSON in webhook request body');
      return Response.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const payload = parseWebhookPayload(jsonBody);
    if (!payload) {
      // Return 200 OK so Meta doesn't retry events we don't recognize
      logger.info('whatsapp.webhook', 'Ignoring unhandled or unrecognized webhook event structure');
      return Response.json({ status: 'ignored' }, { status: 200 });
    }

    // Process all entries and change items
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Process message delivery and read status updates
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusItem of value.statuses) {
            const providerMessageId = statusItem.id;
            const status = statusItem.status;
            const eventTimestamp = statusItem.timestamp
              ? new Date(parseInt(statusItem.timestamp, 10) * 1000)
              : new Date();

            const existing = await db.query.whatsappMessages.findFirst({
              where: eq(whatsappMessages.providerMessageId, providerMessageId),
            });

            if (!existing) {
              logger.info('whatsapp.webhook', 'Status update received for untracked message ID', {
                providerMessageId,
                status,
              });
              continue;
            }

            const updateData: Record<string, unknown> = {
              updatedAt: new Date(),
            };

            switch (status) {
              case 'sent':
                updateData.status = 'SENT';
                if (!existing.sentAt) updateData.sentAt = eventTimestamp;
                break;
              case 'delivered':
                updateData.status = 'DELIVERED';
                updateData.deliveredAt = eventTimestamp;
                break;
              case 'read':
                updateData.status = 'READ';
                updateData.readAt = eventTimestamp;
                break;
              case 'failed': {
                updateData.status = 'FAILED';
                updateData.failedAt = eventTimestamp;
                const error = statusItem.errors?.[0];
                if (error) {
                  updateData.errorCode = String(error.code);
                  updateData.errorMessage = error.title || error.message || 'Delivery failed';
                }
                break;
              }
            }

            await db
              .update(whatsappMessages)
              .set(updateData)
              .where(eq(whatsappMessages.id, existing.id));

            logger.info('whatsapp.webhook', 'WhatsApp message status updated', {
              messageId: existing.id,
              orderId: existing.orderId,
              providerMessageId,
              newStatus: updateData.status,
            });
          }
        }

        // Process incoming customer messages (e.g. replies)
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            logger.info('whatsapp.webhook', 'Incoming customer WhatsApp message received', {
              from: message.from ? `${message.from.slice(0, 4)}****` : 'unknown',
              messageId: message.id,
              type: message.type,
            });
          }
        }
      }
    }

    return Response.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    logger.error('whatsapp.webhook', 'Unexpected error processing webhook', {
      error: (error as Error).message,
    });
    // Return 200 to prevent Meta webhook retries on unexpected application errors
    return Response.json({ status: 'error_handled' }, { status: 200 });
  }
}
