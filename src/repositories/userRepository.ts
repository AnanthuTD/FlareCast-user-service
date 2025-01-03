import { User } from "@prisma/client";
import prisma from "../prismaClient";

export async function userExists(email: string) {
	const user = await prisma.user.findFirst({
		where: { email },
		select: { id: true, hashedPassword: true },
	});
	console.log(user);
	if (user?.hashedPassword) {
		return { method: "credential" };
	} else if (user) {
		return { method: "google" };
	}

	return null;
}

export async function createUser({
	email,
	hashedPassword,
	firstName,
	lastName,
	image,
}: {
	email: string;
	hashedPassword?: string;
	firstName: string;
	lastName: string;
	image?: string;
}) {
	const user = await prisma.user.create({
		data: {
			email,
			hashedPassword,
			firstName,
			lastName,
			image,
		},
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			image: true,
		},
	});

	return user;
}

export async function getUserByEmail(email: string) {
	const user = await prisma.user.findFirst({
		where: {
			email,
		},
	});
	return user;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({
    where: {
      id,
    },
  });
  return user;
}
