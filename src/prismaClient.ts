import { PrismaClient } from "@prisma/client";
import { notifyCollaborationService } from "./services/kafka";

const prisma = new PrismaClient().$extends({
	query: {
		user: {
			async create({ args, query }) {
				// Execute the original query
				const result = await query(args);

				// Call the fun function with the newly created user
				notifyCollaborationService(result.id!);

				// Return the result
				return result;
			},
		},
	},
});

export default prisma;
