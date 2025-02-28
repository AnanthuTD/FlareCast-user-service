import { Service } from "typedi";
import { Admin } from "@prisma/client";
import prisma from "../prismaClient";

@Service()
export class AdminRepository {
  async getByEmail(email: string): Promise<Admin | null> {
    return prisma.admin.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName?: string;
    image?: string;
  }): Promise<Admin> {
    return prisma.admin.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        image: data.image,
      },
    });
  }
}