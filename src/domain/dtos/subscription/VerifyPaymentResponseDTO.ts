export interface VerifyPaymentResponseDTO {
  message: string;
  subscription?: {
    id: string;
    status: string;
  };
}