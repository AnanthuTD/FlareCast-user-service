import { Container } from "typedi";
import { TOKENS } from "@/app/tokens";
import { PrismaClient } from "@prisma/client";
import redis from "./redis";
import { KafkaEventPublisher } from "./providers/KafkaEventPublisher";
import { KafkaEventConsumer } from "./providers/KafkaEventConsumer";
import { LocalEventEmitter } from "./providers/LocalEventEmitter";
import { PromotionalVideoRepository } from "./repositories/prisma/PromotionalVideoRepository";
import { UserRepository } from "./repositories/prisma/UserRepository";
import { RefreshTokenRepository } from "./repositories/redis/RefreshToken";
import { SubscriptionRepository } from "./repositories/prisma/SubscriptionRepository";
import { UserSubscriptionRepository } from "./repositories/prisma/UserSubscriptionRepository";
import { RazorpayRepository } from "./repositories/razorpay/RazorpayRepository";
import { BlacklistRefreshTokenUseCase } from "@/app/use-cases/auth/implementation/BlacklistRefreshToken.usecase";
import { PasswordHasher } from "./providers/PasswordHasher";
import { GenerateAccessTokenProvider } from "./providers/GenerateAccessToken";
import { GenerateRefreshTokenProvider } from "./providers/GenerateRefreshToken";
import { RazorpayManager } from "./providers/RazorpayManager";
import { TokenManagerProvider } from "./providers/TokenManager";
import { HttpErrors } from "@/presentation/http/helpers/implementations/HttpErrors";
import { HttpSuccess } from "@/presentation/http/helpers/implementations/HttpSuccess";
import { AuthenticateUserController } from "@/presentation/http/controllers/authenticate/Authenticate";
import { GoogleSignInController } from "@/presentation/http/controllers/authenticate/GoogleSignin";
import { RefreshTokenController } from "@/presentation/http/controllers/authenticate/RefreshToken";
import { SignUpController } from "@/presentation/http/controllers/authenticate/SignUp";
import { UserLoginController } from "@/presentation/http/controllers/authenticate/SignIn";
import { UserExistController } from "@/presentation/http/controllers/authenticate/Exists";
import { UserLogoutController } from "@/presentation/http/controllers/authenticate/Logout";
import { UserUploadVideoPermissionController } from "@/presentation/http/controllers/user/VideoUploadPermission";
import { CancelSubscriptionController } from "@/presentation/http/controllers/subscription/Cancel";
import { CreateSubscribeController } from "@/presentation/http/controllers/subscription/Create";
import { CanSubscribeController } from "@/presentation/http/controllers/subscription/CanSubscribe";
import { GetSubscriptionsController } from "@/presentation/http/controllers/subscription/History";
import { GetPlansController } from "@/presentation/http/controllers/subscription/Plans";
import { GetMemberLimitController } from "@/presentation/http/controllers/subscription/MembersLimit";
import { HandleSubscriptionWebhookController } from "@/presentation/http/controllers/subscription/Webhook";
import { GetWorkspaceLimitController } from "@/presentation/http/controllers/subscription/WorkspaceLimit";
import { GetUserProfileController } from "@/presentation/http/controllers/user/GetProfile";
import { UpdateProfileController } from "@/presentation/http/controllers/user/UpdateProfile";
import { ElectronPostLoginController } from "@/presentation/http/controllers/electron/PostLogin";
import { TitleAndSummaryHandler } from "@/app/handlers/TitleAndSummaryHandler";
import { VerifiedUserHandler } from "@/app/handlers/VerifiedUserHandler";
import { VideoRemoveHandler } from "@/app/handlers/VideoRemoveHandler";
import { VideoUploadHandler } from "@/app/handlers/VideoUploadHandler";
import { EventService } from "@/app/services/EventService";
import { KafkaConsumerService } from "./kafka/ConsumerService";

export function setupDIContainer() {
	// Use Cases
	Container.set(
		TOKENS.BlacklistRefreshTokenUseCase,
		BlacklistRefreshTokenUseCase
	);

	// Repositories
	Container.set(TOKENS.PromotionalVideoRepository, PromotionalVideoRepository);
	Container.set(TOKENS.UserRepository, UserRepository);
	Container.set(TOKENS.RefreshTokenRepository, RefreshTokenRepository);
	Container.set(TOKENS.SubscriptionRepository, SubscriptionRepository);
	Container.set(TOKENS.UserSubscriptionRepository, UserSubscriptionRepository);
	Container.set(TOKENS.RazorpayRepository, RazorpayRepository);

	// Infrastructure/Providers
	Container.set(TOKENS.PrismaClient, new PrismaClient());
	Container.set(TOKENS.RedisClient, redis);
	Container.set(TOKENS.EventPublisher, new KafkaEventPublisher());
	Container.set(TOKENS.EventConsumer, new KafkaEventConsumer());
	Container.set(TOKENS.EventEmitter, new LocalEventEmitter());
	Container.set(TOKENS.KafkaEventPublisher, new KafkaEventPublisher());
	Container.set(TOKENS.KafkaEventConsumer, new KafkaEventConsumer());
	Container.set(TOKENS.LocalEventEmitter, new LocalEventEmitter());
	Container.set(TOKENS.PasswordHasher, PasswordHasher);
	Container.set(
		TOKENS.GenerateAccessTokenProvider,
		GenerateAccessTokenProvider
	);
	Container.set(
		TOKENS.GenerateRefreshTokenProvider,
		GenerateRefreshTokenProvider
	);
	Container.set(TOKENS.RazorpayManager, RazorpayManager);
	Container.set(TOKENS.TokenManagerProvider, TokenManagerProvider);
	Container.set(TOKENS.HttpErrors, HttpErrors);
	Container.set(TOKENS.HttpSuccess, HttpSuccess);
	Container.set(TOKENS.EventService, EventService);
	Container.set(TOKENS.KafkaConsumerService, KafkaConsumerService);
	Container.set(TOKENS.TitleAndSummaryHandler, TitleAndSummaryHandler);
	Container.set(TOKENS.VerifiedUserHandler, VerifiedUserHandler);
	Container.set(TOKENS.VideoRemoveHandler, VideoRemoveHandler);
	Container.set(TOKENS.VideoUploadHandler, VideoUploadHandler);

	// Controllers - Authentication
	Container.set(TOKENS.AuthenticateUserController, AuthenticateUserController);
	Container.set(TOKENS.GoogleSigninController, GoogleSignInController);
	Container.set(TOKENS.RefreshTokenController, RefreshTokenController);
	Container.set(TOKENS.SignUpController, SignUpController);
	Container.set(TOKENS.SignInController, UserLoginController);
	Container.set(TOKENS.UserExistController, UserExistController);
	Container.set(TOKENS.UserLogoutController, UserLogoutController);

	// Controllers - Video
	Container.set(
		TOKENS.UserVideoController,
		UserUploadVideoPermissionController
	);

	// Controllers - Subscription
	Container.set(
		TOKENS.CancelSubscriptionController,
		CancelSubscriptionController
	);
	Container.set(TOKENS.CreateSubscribeController, CreateSubscribeController);
	Container.set(TOKENS.CanSubscribeController, CanSubscribeController);
	Container.set(TOKENS.GetSubscriptionsController, GetSubscriptionsController);
	Container.set(TOKENS.GetPlansController, GetPlansController);
	Container.set(TOKENS.GetMemberLimitController, GetMemberLimitController);
	Container.set(
		TOKENS.HandleSubscriptionWebhookController,
		HandleSubscriptionWebhookController
	);
	Container.set(
		TOKENS.GetWorkspaceLimitController,
		GetWorkspaceLimitController
	);

	// Controllers - Profile
	Container.set(TOKENS.GetUserProfileController, GetUserProfileController);
	Container.set(TOKENS.UpdateProfileController, UpdateProfileController);

	// Controllers - Electron
	Container.set(
		TOKENS.ElectronPostLoginController,
		ElectronPostLoginController
	);
}

export function resetDIContainer() {
	Container.reset();
}
