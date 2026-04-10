import { amountToPaise } from '@parknear/shared';
import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';

type OrderResponse = {
  order_id: string;
  amount: number;
  key_id: string;
};

type VerifyResult = {
  success: boolean;
  booking: Record<string, unknown>;
};

export function useRazorpay() {
  const payBooking = useCallback(async (bookingId: string, totalRupees: number): Promise<VerifyResult> => {
    const paise = amountToPaise(totalRupees);

    const { data: orderData, error: orderErr } = await supabase.functions.invoke<OrderResponse>(
      'create-razorpay-order',
      { body: { booking_id: bookingId, amount_paise: paise } }
    );

    if (orderErr) {
      throw new Error(orderErr.message);
    }
    if (!orderData?.order_id || !orderData.key_id) {
      throw new Error('Could not create payment order');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RazorpayCheckout = require('react-native-razorpay').default as (opts: Record<string, unknown>) => Promise<{
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }>;

    const payment = await RazorpayCheckout({
      key: orderData.key_id,
      amount: String(paise),
      currency: 'INR',
      name: 'ParkNear',
      description: `Parking booking`,
      order_id: orderData.order_id,
      theme: { color: '#0EA5E9' },
    });

    const { data: verifyData, error: verifyErr } = await supabase.functions.invoke<VerifyResult>(
      'verify-payment',
      {
        body: {
          booking_id: bookingId,
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        },
      }
    );

    if (verifyErr) {
      throw new Error(verifyErr.message);
    }
    if (!verifyData?.success) {
      throw new Error('Verification failed');
    }

    return verifyData;
  }, []);

  return { payBooking };
}
