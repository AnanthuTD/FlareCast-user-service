import { UserRepository } from "../../repositories/userRepository";

export function handleVideoUploadEvent(data: {
	userId: string;
	videoId: string;
}) {
	const userRepo = new UserRepository();
	userRepo.incrementVideoCount(data.userId);
}

export function handleVideoRemoveEvent(data: {
	userId: string;
	videoId: string;
}) {
	const userRepo = new UserRepository();
	userRepo.decrementVideoCount(data.userId);
}
