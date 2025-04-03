export interface HandleSubscriptionWebhookDTO {
  event: any; // The webhook event payload
  razorpaySignature: string; // The x-razorpay-signature header
}