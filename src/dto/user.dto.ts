import { User } from "@prisma/client";

export function authResponseUserObject(user: User | Partial<User>){
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
  }
}