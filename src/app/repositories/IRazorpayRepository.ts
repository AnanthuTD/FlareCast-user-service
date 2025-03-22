export interface IRazorpayRepository {
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
}