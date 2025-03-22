/**
 * Data Transfer Object (DTO) representing the request to create a new user.
 *
 * @interface
 */
export interface ICreateUserRequestDTO {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  image?: string;
}
