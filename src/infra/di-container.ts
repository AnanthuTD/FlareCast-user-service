import { Container } from "inversify";
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
import { UploadVideoPermissionController } from "@/presentation/http/controllers/user/VideoUploadPermission";
import { UploadVideoPermissionsController } from "@/presentation/http/controllers/service/VideoUploadPermission";
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
import { EventService } from "@/app/services/implementation/EventService";
import { KafkaConsumerService } from "./kafka/ConsumerService";
import { TOKENS } from "@/app/tokens";
import { AuthenticateUserUseCase } from "@/app/use-cases/auth/implementation/AuthenticateUserUseCase";
import { IUserExistUseCase } from "@/app/use-cases/user/IUserExistUseCase";
import { UserExistUseCase } from "@/app/use-cases/user/implementation/UserExistUseCase";
import { GoogleSignInUseCase } from "@/app/use-cases/auth/implementation/GoogleSignInUseCase";
import { IGoogleSignInUseCase } from "@/app/use-cases/auth/IGoogleSignInUseCase";
import { UserLogoutUseCase } from "@/app/use-cases/auth/implementation/UserLogoutUseCase";
import { IUserLogoutUseCase } from "@/app/use-cases/auth/IUserLogoutUseCase";
import { IRefreshTokenUseCase } from "@/app/use-cases/auth/IRefreshTokenUseCase";
import { RefreshTokenUseCase } from "@/app/use-cases/auth/implementation/RefreshTokenUseCase";
import { IUserLoginUseCase } from "@/app/use-cases/auth/IUserLoginUseCase";
import { UserLoginUseCase } from "@/app/use-cases/auth/implementation/UserLoginUseCase";
import { IVerifyUserEmailUseCase } from "@/app/use-cases/auth/IVerifyUserEmailUseCase";
import { VerifyUserEmailUseCase } from "@/app/use-cases/auth/implementation/VerifyUserEmailUseCase";
import { IGetActiveSubscriptionUseCase } from "@/app/use-cases/user/IGetActiveSubscriptionUseCase";
import { GetActiveSubscriptionUseCase } from "@/app/use-cases/user/implementation/GetActiveSubscriptionUseCase";
import { IPublishUserVerifiedEventUseCase } from "@/app/use-cases/auth/IPublishUserVerifiedEventUseCase";
import { PublishUserVerifiedEventUseCase } from "@/app/use-cases/auth/implementation/PublishUserVerifiedEventUseCase";
import { IEventService } from "@/app/services/IEventService";
import { IEmailService } from "@/app/services/IEmailService";
import { EmailService } from "@/app/services/implementation/EmailService";
import { ISignUpUseCase } from "@/app/use-cases/auth/ISignUpUseCase";
import { SignUpUseCase } from "@/app/use-cases/auth/implementation/SignUpUseCase";
import { IElectronPostLoginUseCase } from "@/app/use-cases/auth/IElectronPostLoginUseCase";
import { ElectronPostLoginUseCase } from "@/app/use-cases/auth/implementation/ElectronPostLoginUseCase";
import { IUploadVideoPermissionsUseCase } from "@/app/use-cases/video/IUploadVideoPermissionsUseCase";
import { UploadVideoPermissionsUseCase } from "@/app/use-cases/video/implementation/UploadVideoPermissionsUseCase";
import { ICancelSubscriptionUseCase } from "@/app/use-cases/subscription/ICancelSubscriptionUseCase";
import { CancelSubscriptionUseCase } from "@/app/use-cases/subscription/implementation/CancelSubscriptionUseCase";
import { ICanSubscribeUseCase } from "@/app/use-cases/subscription/ICanSubscribeUseCase";
import { CanSubscribeUseCase } from "@/app/use-cases/subscription/implementation/CanSubscribeUseCase";
import { ICreateSubscribeUseCase } from "@/app/use-cases/subscription/ICreateSubscribeUseCase";
import { CreateSubscribeUseCase } from "@/app/use-cases/subscription/implementation/CreateSubscribeUseCase";
import { IGetSubscriptionsUseCase } from "@/app/use-cases/subscription/IGetSubscriptionsUseCase";
import { GetSubscriptionsUseCase } from "@/app/use-cases/subscription/implementation/GetSubscriptionsUseCase";
import { IGetMemberLimitUseCase } from "@/app/use-cases/subscription/IGetMemberLimitUseCase";
import { GetMemberLimitUseCase } from "@/app/use-cases/subscription/implementation/GetMemberLimitUseCase";
import { IGetPlansUseCase } from "@/app/use-cases/subscription/IGetPlansUseCase";
import { GetPlansUseCase } from "@/app/use-cases/subscription/implementation/GetPlansUseCase";
import { IHandleSubscriptionWebhookUseCase } from "@/app/use-cases/subscription/IHandleSubscriptionWebhookUseCase";
import { HandleSubscriptionWebhookUseCase } from "@/app/use-cases/subscription/implementation/HandleSubscriptionWebhookUseCase";
import { IGetWorkspaceLimitUseCase } from "@/app/use-cases/subscription/IGetWorkspaceLimitUseCase";
import { GetWorkspaceLimitUseCase } from "@/app/use-cases/subscription/implementation/GetWorkspaceLimitUseCase";
import { GetUserProfileUseCase } from "@/app/use-cases/user/implementation/GetUserProfileUseCase";
import { IGetUserProfileUseCase } from "@/app/use-cases/user/IGetUserProfileUseCase";
import { IUpdateProfileUseCase } from "@/app/use-cases/user/IUpdateProfileUseCase";
import { UpdateProfileUseCase } from "@/app/use-cases/user/implementation/UpdateProfileUseCase";
import { IS3Service } from "@/app/services/IS3Service";
import { S3Service } from "@/app/services/implementation/S3Service";
import { ICheckUploadVideoPermissionUseCase } from "@/app/use-cases/user/ICheckUploadVideoPermissionUseCase";
import { CheckUploadVideoPermissionUseCase } from "@/app/use-cases/user/implementation/CheckUploadVideoPermissionUseCase";
import { VerifyPaymentUseCase } from "@/app/use-cases/subscription/implementation/VerifyPaymentUseCase";
import { VerifyPaymentDTO } from "@/domain/dtos/subscription/VerifyPaymentDTO";
import { VerifyPaymentResponseDTO } from "@/domain/dtos/subscription/VerifyPaymentResponseDTO";
import { IUseCase } from "@/app/use-cases/IUseCase";
import { IController } from "@/presentation/http/controllers/IController";
import { VerifyPaymentController } from "@/presentation/http/controllers/subscription/VerifyPayment";

// Define TOKENS as Symbols (unchanged from your original setup)

// Create a single Inversify container instance
const container = new Container();

export function setupDIContainer() {
	// Use Cases
	container
		.bind(TOKENS.BlacklistRefreshTokenUseCase)
		.to(BlacklistRefreshTokenUseCase)
		.inSingletonScope();
	container
		.bind<AuthenticateUserUseCase>(TOKENS.AuthenticateUserUseCase)
		.to(AuthenticateUserUseCase)
		.inSingletonScope();
	container
		.bind<IUserExistUseCase>(TOKENS.UserExistUseCase)
		.to(UserExistUseCase)
		.inSingletonScope();
	container
		.bind<IGoogleSignInUseCase>(TOKENS.GoogleSignInUseCase)
		.to(GoogleSignInUseCase)
		.inSingletonScope();
	container
		.bind<IUserLogoutUseCase>(TOKENS.UserLogoutUseCase)
		.to(UserLogoutUseCase)
		.inSingletonScope();
	container
		.bind<IRefreshTokenUseCase>(TOKENS.RefreshTokenUseCase)
		.to(RefreshTokenUseCase)
		.inSingletonScope();
	container
		.bind<IUserLoginUseCase>(TOKENS.UserLoginUseCase)
		.to(UserLoginUseCase)
		.inSingletonScope();
	container
		.bind<IVerifyUserEmailUseCase>(TOKENS.VerifyUserEmailUseCase)
		.to(VerifyUserEmailUseCase)
		.inSingletonScope();
	container
		.bind<IGetActiveSubscriptionUseCase>(TOKENS.GetActiveSubscriptionUseCase)
		.to(GetActiveSubscriptionUseCase)
		.inSingletonScope();
	container
		.bind<IPublishUserVerifiedEventUseCase>(
			TOKENS.PublishUserVerifiedEventUseCase
		)
		.to(PublishUserVerifiedEventUseCase)
		.inSingletonScope();
	container
		.bind<ISignUpUseCase>(TOKENS.SignUpUseCase)
		.to(SignUpUseCase)
		.inSingletonScope();
	container
		.bind<IElectronPostLoginUseCase>(TOKENS.ElectronPostLoginUseCase)
		.to(ElectronPostLoginUseCase)
		.inSingletonScope();
	container
		.bind<IUploadVideoPermissionsUseCase>(TOKENS.UploadVideoPermissionsUseCase)
		.to(UploadVideoPermissionsUseCase)
		.inSingletonScope();
	container
		.bind<ICancelSubscriptionUseCase>(TOKENS.CancelSubscriptionUseCase)
		.to(CancelSubscriptionUseCase)
		.inSingletonScope();
	container
		.bind<ICanSubscribeUseCase>(TOKENS.CanSubscribeUseCase)
		.to(CanSubscribeUseCase)
		.inSingletonScope();
	container
		.bind<ICreateSubscribeUseCase>(TOKENS.CreateSubscribeUseCase)
		.to(CreateSubscribeUseCase)
		.inSingletonScope();
	container
		.bind<IGetSubscriptionsUseCase>(TOKENS.GetSubscriptionsUseCase)
		.to(GetSubscriptionsUseCase)
		.inSingletonScope();
	container
		.bind<IGetMemberLimitUseCase>(TOKENS.GetMemberLimitUseCase)
		.to(GetMemberLimitUseCase)
		.inSingletonScope();
	container
		.bind<IGetPlansUseCase>(TOKENS.GetPlansUseCase)
		.to(GetPlansUseCase)
		.inSingletonScope();
	container
		.bind<IHandleSubscriptionWebhookUseCase>(
			TOKENS.HandleSubscriptionWebhookUseCase
		)
		.to(HandleSubscriptionWebhookUseCase)
		.inSingletonScope();
	container
		.bind<IGetWorkspaceLimitUseCase>(TOKENS.GetWorkspaceLimitUseCase)
		.to(GetWorkspaceLimitUseCase)
		.inSingletonScope();
	container
		.bind<IGetUserProfileUseCase>(TOKENS.GetUserProfileUseCase)
		.to(GetUserProfileUseCase)
		.inSingletonScope();
	container
		.bind<IUpdateProfileUseCase>(TOKENS.UpdateProfileUseCase)
		.to(UpdateProfileUseCase)
		.inSingletonScope();
	container
		.bind<ICheckUploadVideoPermissionUseCase>(
			TOKENS.CheckUploadVideoPermissionUseCase
		)
		.to(CheckUploadVideoPermissionUseCase)
		.inSingletonScope();
	container
		.bind<IUseCase<VerifyPaymentDTO, VerifyPaymentResponseDTO>>(
			TOKENS.VerifyPaymentUseCase
		)
		.to(VerifyPaymentUseCase)
		.inSingletonScope();

	// services
	container.bind<IS3Service>(TOKENS.S3Service).to(S3Service).inSingletonScope();
	container
		.bind<IEmailService>(TOKENS.EmailService)
		.to(EmailService)
		.inSingletonScope();

	// Repositories
	container
		.bind(TOKENS.PromotionalVideoRepository)
		.to(PromotionalVideoRepository)
		.inSingletonScope();
	container.bind(TOKENS.UserRepository).to(UserRepository).inSingletonScope();
	container
		.bind(TOKENS.RefreshTokenRepository)
		.to(RefreshTokenRepository)
		.inSingletonScope();
	container
		.bind(TOKENS.SubscriptionRepository)
		.to(SubscriptionRepository)
		.inSingletonScope();
	container
		.bind(TOKENS.UserSubscriptionRepository)
		.to(UserSubscriptionRepository)
		.inSingletonScope();
	container
		.bind(TOKENS.RazorpayRepository)
		.to(RazorpayRepository)
		.inSingletonScope();

	// Infrastructure/Providers
	container
		.bind(TOKENS.PrismaClient)
		.toDynamicValue(() => new PrismaClient())
		.inSingletonScope();
	container.bind(TOKENS.RedisClient).toConstantValue(redis);
	container
		.bind(TOKENS.EventPublisher)
		.to(KafkaEventPublisher)
		.inSingletonScope();
	container
		.bind(TOKENS.EventConsumer)
		.to(KafkaEventConsumer)
		.inSingletonScope();
	container.bind(TOKENS.EventEmitter).to(LocalEventEmitter).inSingletonScope();
	container
		.bind(TOKENS.KafkaEventPublisher)
		.to(KafkaEventPublisher)
		.inSingletonScope();
	container
		.bind(TOKENS.KafkaEventConsumer)
		.to(KafkaEventConsumer)
		.inSingletonScope();
	container
		.bind(TOKENS.LocalEventEmitter)
		.to(LocalEventEmitter)
		.inSingletonScope();
	container.bind(TOKENS.PasswordHasher).to(PasswordHasher).inSingletonScope();
	container
		.bind(TOKENS.GenerateAccessTokenProvider)
		.to(GenerateAccessTokenProvider)
		.inSingletonScope();
	container
		.bind(TOKENS.GenerateRefreshTokenProvider)
		.to(GenerateRefreshTokenProvider)
		.inSingletonScope();
	container.bind(TOKENS.RazorpayManager).to(RazorpayManager).inSingletonScope();
	container
		.bind(TOKENS.TokenManagerProvider)
		.to(TokenManagerProvider)
		.inSingletonScope();
	container.bind(TOKENS.HttpErrors).to(HttpErrors).inSingletonScope();
	container.bind(TOKENS.HttpSuccess).to(HttpSuccess).inSingletonScope();
	container
		.bind<IEventService>(TOKENS.EventService)
		.to(EventService)
		.inSingletonScope();
	container
		.bind(TOKENS.KafkaConsumerService)
		.to(KafkaConsumerService)
		.inSingletonScope();
	container
		.bind(TOKENS.TitleAndSummaryHandler)
		.to(TitleAndSummaryHandler)
		.inSingletonScope();
	container
		.bind(TOKENS.VerifiedUserHandler)
		.to(VerifiedUserHandler)
		.inSingletonScope();
	container
		.bind(TOKENS.VideoRemoveHandler)
		.to(VideoRemoveHandler)
		.inSingletonScope();
	container
		.bind(TOKENS.VideoUploadHandler)
		.to(VideoUploadHandler)
		.inSingletonScope();

	// Controllers - Authentication
	container
		.bind(TOKENS.AuthenticateUserController)
		.to(AuthenticateUserController)
		.inSingletonScope();
	container
		.bind(TOKENS.GoogleSigninController)
		.to(GoogleSignInController)
		.inSingletonScope();
	container
		.bind(TOKENS.RefreshTokenController)
		.to(RefreshTokenController)
		.inSingletonScope();
	container
		.bind(TOKENS.SignUpController)
		.to(SignUpController)
		.inSingletonScope();
	container
		.bind(TOKENS.SignInController)
		.to(UserLoginController)
		.inSingletonScope();
	container
		.bind(TOKENS.UserExistController)
		.to(UserExistController)
		.inSingletonScope();
	container
		.bind(TOKENS.UserLogoutController)
		.to(UserLogoutController)
		.inSingletonScope();

	// Controllers - Video
	container
		.bind(TOKENS.UserVideoController)
		.to(UploadVideoPermissionController)
		.inSingletonScope();
	container
		.bind(TOKENS.ServiceUploadVideoPermissionsController)
		.to(UploadVideoPermissionsController)
		.inSingletonScope();

	// Controllers - Subscription
	container
		.bind(TOKENS.CancelSubscriptionController)
		.to(CancelSubscriptionController)
		.inSingletonScope();
	container
		.bind(TOKENS.CreateSubscribeController)
		.to(CreateSubscribeController)
		.inSingletonScope();
	container
		.bind(TOKENS.CanSubscribeController)
		.to(CanSubscribeController)
		.inSingletonScope();
	container
		.bind(TOKENS.GetSubscriptionsController)
		.to(GetSubscriptionsController)
		.inSingletonScope();
	container
		.bind(TOKENS.GetPlansController)
		.to(GetPlansController)
		.inSingletonScope();
	container
		.bind(TOKENS.GetMemberLimitController)
		.to(GetMemberLimitController)
		.inSingletonScope();
	container
		.bind(TOKENS.HandleSubscriptionWebhookController)
		.to(HandleSubscriptionWebhookController)
		.inSingletonScope();
	container
		.bind(TOKENS.GetWorkspaceLimitController)
		.to(GetWorkspaceLimitController)
		.inSingletonScope();
	container
		.bind<IController>(TOKENS.VerifyPaymentController)
		.to(VerifyPaymentController)
		.inSingletonScope();

	// Controllers - Profile
	container
		.bind(TOKENS.GetUserProfileController)
		.to(GetUserProfileController)
		.inSingletonScope();
	container
		.bind(TOKENS.UpdateProfileController)
		.to(UpdateProfileController)
		.inSingletonScope();

	// Controllers - Electron
	container
		.bind(TOKENS.ElectronPostLoginController)
		.to(ElectronPostLoginController)
		.inSingletonScope();

	console.log("Container setup complete");

	return container;
}

export function resetDIContainer() {
	// Inversify doesn't have a direct reset method like TypeDI
	// You can either create a new container or unbind all bindings
	container.unbindAll();
}

// Export the container for use elsewhere
export default container;
