import { NextRequest } from 'next/server';
import { checkoutSchema } from '@/lib/validation/order';
import { createOrder } from '@/lib/services/order-service';
import { toErrorResponse } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Refine: delivery requires address
    if (result.data.fulfillmentType === 'DELIVERY' && !result.data.address) {
      return Response.json(
        { message: 'Address is required for delivery orders' },
        { status: 400 }
      );
    }

    const order = await createOrder(result.data);

    return Response.json({ order }, { status: 201 });
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}
