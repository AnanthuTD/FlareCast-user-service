export interface IPaymentGateway {
  createOrder(props: { amount: number }): Promise<any>;
  verifyPayment(props: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean;
  subscribe(props: {
    notify_email: string;
    planId: string;
    totalCount: number;
  }): Promise<any>;
  fetchPaymentInfo(paymentId: string): Promise<any>;
  cancelSubscription(subscriptionId: string): Promise<any>;
  fetchSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    start_at?: number;
    end_at?: number;
    charge_at?: number;
    paid_count?: number;
    current_start?: number;
    current_end?: number;
  } | null>;
  createPlan(params: {
    period: string;
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }): Promise<{
    id: string;
  }>;
}