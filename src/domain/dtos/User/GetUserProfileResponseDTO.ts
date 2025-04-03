export interface UserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string | null;
  plan: {
    planId: string;
    // Add other fields as needed based on the subscription data
  } | null;
}

export interface GetUserProfileResponseDTO {
  user: UserProfileDTO;
}