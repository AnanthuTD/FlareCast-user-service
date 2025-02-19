import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({
	query: {
		user: {
			async create({ args, query }) {
				const result = await query(args);

				return result;
			},
		},
	},
});

export default prisma;
