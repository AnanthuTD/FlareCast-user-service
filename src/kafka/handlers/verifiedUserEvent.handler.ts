import eventEmitter from "../../eventEmitter";
import EventName from "../../eventEmitter/eventNames";
import { logger } from "../../logger/logger";
import { markAsVerified } from "../../repositories/userRepository";
import { sendUserVerifiedEvent } from "../producer";

interface UserCreateMessage {
	userId: string;
	email: string;
}

export async function handleVerifiedUserEvent({
	userId,
	email,
}: UserCreateMessage) {
	try {
		logger.debug("✔️ Received a verified user event", JSON.stringify(userId));

		const user = await markAsVerified(userId, email);
		if (user && user.isVerified) {
			const data = {
				userId,
				firstName: user.firstName,
				lastName: user.lastName ?? "",
				email: user.email,
				image: user.image ?? "",
			};
			sendUserVerifiedEvent(data);
			eventEmitter.emit(EventName.NEW_USER_SIGNUP, data);
		}
	} catch (error) {
		logger.error("Failed to send message!", error);
	}
}
