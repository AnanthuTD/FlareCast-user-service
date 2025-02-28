import { Request, RequestHandler, Response } from "express";
import prisma from "../../prismaClient";

const adminProfileController: RequestHandler = async (
	req: Request,
	res: Response
) => {
	const user = req.user;

	try {
		if (user.type !== "admin") {
			res.status(401).json({ message: "Admin access required" });
			return;
		}

		const admin = await prisma.admin.findUnique({ where: { id: user.id } });
		if (!admin) {
			res.status(401).json({ message: "Admin not found" });
			return;
		}
		res.json({
			admin: {
				id: admin.id,
				email: admin.email,
				firstName: admin.firstName,
				lastName: admin.lastName,
				role: "admin",
			},
		});
	} catch (error) {
		res.status(401).json({ message: "Invalid or expired token" });
	}
};

export default adminProfileController;
