import { wrapHandler } from '@/src/lib/astro-api';
import { validateAgentReferralCode } from '@/lib/services/agent-service';

async function _GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');

    const result = await validateAgentReferralCode(code);
    if (!result.valid || !result.agent) {
      return Response.json(
        { valid: false, message: result.message || 'Invalid referral code' },
        { status: 400 }
      );
    }

    return Response.json({
      valid: true,
      agentName: result.agent.name,
      agentCode: result.agent.agentCode,
      referralCode: result.agent.referralCode,
    });
  } catch (error: any) {
    return Response.json(
      { valid: false, message: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body?.code;

    const result = await validateAgentReferralCode(code);
    if (!result.valid || !result.agent) {
      return Response.json(
        { valid: false, message: result.message || 'Invalid referral code' },
        { status: 400 }
      );
    }

    return Response.json({
      valid: true,
      agentName: result.agent.name,
      agentCode: result.agent.agentCode,
      referralCode: result.agent.referralCode,
    });
  } catch (error: any) {
    return Response.json(
      { valid: false, message: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}

export const GET = wrapHandler(_GET);
export const POST = wrapHandler(_POST);
