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
import { GetAdminProfileDTO } from "@/domain/dtos/admin/GetAdminProfileDTO";
import { GetAdminProfileResponseDTO } from "@/domain/dtos/admin/GetAdminProfileResponseDTO";
import { GetAdminProfileController } from "@/presentation/http/controllers/admin/GetAdminProfileController";
import { AdminRepository } from "./repositories/prisma/AdminRepository";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";
import { IAdminSignInUseCase } from "@/app/use-cases/admin/IAdminSignInUseCase";
import { AdminSignInUseCase } from "@/app/use-cases/admin/implementation/AdminSignInUseCase";
import { AdminSignInController } from "@/presentation/http/controllers/admin/AdminSignInController";
import { GetAdminProfileUseCase } from "@/app/use-cases/admin/implementation/GetAdminProfileUseCase";
import { IBanUserUseCase } from "@/app/use-cases/admin/IBanUserUseCase";
import { BanUserUseCase } from "@/app/use-cases/admin/implementation/BanUserUseCase";
import { BanUserController } from "@/presentation/http/controllers/admin/BanUserController";
import { IGetPaginatedUsersUseCase } from "@/app/use-cases/admin/IGetPaginatedUsersUseCase";
import { GetPaginatedUsersUseCase } from "@/app/use-cases/admin/implementation/GetPaginatedUsersUseCase";
import { GetPaginatedUsersController } from "@/presentation/http/controllers/admin/GetPaginatedUsersController";
import { IVideoServiceClient } from "@/app/services/IVideoServiceClient";
import { VideoServiceClient } from "@/app/services/implementation/VideoServiceClient";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { DeletePromotionalVideoController } from "@/presentation/http/controllers/admin/promotionalVideo/DeletePromotionalVideoController";
import { UpdatePromotionalVideoController } from "@/presentation/http/controllers/admin/promotionalVideo/UpdatePromotionalVideoController";
import { GetPromotionalVideoByIdController } from "@/presentation/http/controllers/admin/promotionalVideo/GetPromotionalVideoByIdController";
import { GetPromotionalVideosController } from "@/presentation/http/controllers/admin/promotionalVideo/GetPromotionalVideosController";
import { UploadPromotionalVideoController } from "@/presentation/http/controllers/admin/promotionalVideo/UploadPromotionalVideoController";
import { GetSignedUrlController } from "@/presentation/http/controllers/admin/promotionalVideo/GetSignedUrlController";
import { DeletePromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/implementation/DeletePromotionalVideoUseCase";
import { IDeletePromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/IDeletePromotionalVideoUseCase";
import { IUpdatePromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/IUpdatePromotionalVideoUseCase";
import { UpdatePromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/implementation/UpdatePromotionalVideoUseCase";
import { GetPromotionalVideoByIdUseCase } from "@/app/use-cases/admin/promotionalVideo/implementation/GetPromotionalVideoByIdUseCase";
import { IGetPromotionalVideoByIdUseCase } from "@/app/use-cases/admin/promotionalVideo/IGetPromotionalVideoByIdUseCase";
import { GetPromotionalVideosUseCase } from "@/app/use-cases/admin/promotionalVideo/implementation/GetPromotionalVideosUseCase";
import { IGetPromotionalVideosUseCase } from "@/app/use-cases/admin/promotionalVideo/IGetPromotionalVideosUseCase";
import { UploadPromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/implementation/UploadPromotionalVideoUseCase";
import { IUploadPromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/IUploadPromotionalVideoUseCase";
import { GetSignedUrlUseCase } from "@/app/use-cases/admin/promotionalVideo/implementation/GetSignedUrlUseCase";
import { IGetSignedUrlUseCase } from "@/app/use-cases/admin/promotionalVideo/IGetSignedUrlUseCase";
import { IPaymentGateway } from "@/app/repositories/IPaymentGateway";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { TogglePlanActiveController } from "@/presentation/http/controllers/admin/subscriptionPlan/TogglePlanActiveController";
import { DeletePlanController } from "@/presentation/http/controllers/admin/subscriptionPlan/DeletePlanController";
import { CreatePlanController } from "@/presentation/http/controllers/admin/subscriptionPlan/CreatePlanController";
import { TogglePlanActiveUseCase } from "@/app/use-cases/admin/subscriptionPlan/implementation/TogglePlanActiveUseCase";
import { ITogglePlanActiveUseCase } from "@/app/use-cases/admin/subscriptionPlan/ITogglePlanActiveUseCase";
import { DeletePlanUseCase } from "@/app/use-cases/admin/subscriptionPlan/implementation/DeletePlanUseCase";
import { IDeletePlanUseCase } from "@/app/use-cases/admin/subscriptionPlan/IDeletePlanUseCase";
import { CreatePlanUseCase } from "@/app/use-cases/admin/subscriptionPlan/implementation/CreatePlanUseCase";
import { ICreatePlanUseCase } from "@/app/use-cases/admin/subscriptionPlan/ICreatePlanUseCase";
import { AuthenticateAdminController } from "@/presentation/http/controllers/admin/Authenticate";
import { AdminRefreshTokenController } from "@/presentation/http/controllers/admin/RefreshToken";
import { AdminGoogleSignInController } from "@/presentation/http/controllers/admin/GoogleSignin";
import { AuthenticateAdminUseCase } from "@/app/use-cases/admin/implementation/AuthenticateAdminUseCase";
import { AdminRefreshTokenUseCase } from "@/app/use-cases/admin/implementation/RefreshTokenUseCase";
import { AdminGoogleSigninUseCase } from "@/app/use-cases/admin/implementation/GoogleSignInUseCase";
import { AdminLogoutUseCase } from "@/app/use-cases/admin/implementation/AdminLogoutUseCase";
import { AdminLogoutController } from "@/presentation/http/controllers/admin/Logout";
import { GetPlansUseCase as GetAdminPlansUseCase } from "@/app/use-cases/admin/subscriptionPlan/implementation/GetPlansUseCase";
import { GetAdminPlansController } from "@/presentation/http/controllers/admin/subscriptionPlan/GetPlansController";
import { IGetPaginatedPaymentsUseCase } from "@/app/use-cases/admin/monetization/IGetPaginatedPaymentsUseCase";
import { GetPaginatedPaymentsUseCase } from "@/app/use-cases/admin/monetization/implementation/GetPaginatedPaymentsUseCase";
import { GetPaginatedPaymentsController } from "@/presentation/http/controllers/admin/monetization/GetPaginatedPaymentsController";
import { GetSubscriptionStatusController } from "@/presentation/http/controllers/admin/monetization/GetSubscriptionStatusController";
import { SalesSummaryController } from "@/presentation/http/controllers/reports/SalesSummaryController";
import { PlanGroupController } from "@/presentation/http/controllers/reports/PlanGroupController";
import { FreePlanUsageController } from "@/presentation/http/controllers/reports/FreePlanUsageController";
import { RevenueByPeriodController } from "@/presentation/http/controllers/reports/RevenueByPeriodController";
import { StatusDistributionController } from "@/presentation/http/controllers/reports/StatusDistributionController";
import { GetSubscriptionByRazorpayId } from "@/presentation/http/controllers/subscription/GetSubscriptionByRazorpayId";

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
	container
		.bind<IUseCase<GetAdminProfileDTO, GetAdminProfileResponseDTO>>(
			TOKENS.GetAdminProfileUseCase
		)
		.to(GetAdminProfileUseCase)
		.inSingletonScope();
	container
		.bind<IController>(TOKENS.GetAdminProfileController)
		.to(GetAdminProfileController)
		.inSingletonScope();
	container
		.bind<IAdminRepository>(TOKENS.AdminRepository)
		.to(AdminRepository)
		.inSingletonScope();
	container
		.bind<IAdminSignInUseCase>(TOKENS.AdminSignInUseCase)
		.to(AdminSignInUseCase)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.AdminSignInController)
		.to(AdminSignInController)
		.inSingletonScope();
	container
		.bind<IBanUserUseCase>(TOKENS.BanUserUseCase)
		.to(BanUserUseCase)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.BanUserController)
		.to(BanUserController)
		.inSingletonScope();
	container
		.bind<IGetPaginatedUsersUseCase>(TOKENS.GetPaginatedUsersUseCase)
		.to(GetPaginatedUsersUseCase)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.GetPaginatedUsersController)
		.to(GetPaginatedUsersController)
		.inSingletonScope();
	container
		.bind<IGetSignedUrlUseCase>(TOKENS.GetSignedUrlUseCase)
		.to(GetSignedUrlUseCase)
		.inSingletonScope();

	container
		.bind<IUploadPromotionalVideoUseCase>(TOKENS.UploadPromotionalVideoUseCase)
		.to(UploadPromotionalVideoUseCase)
		.inSingletonScope();

	container
		.bind<IGetPromotionalVideosUseCase>(TOKENS.GetPromotionalVideosUseCase)
		.to(GetPromotionalVideosUseCase)
		.inSingletonScope();

	container
		.bind<IGetPromotionalVideoByIdUseCase>(
			TOKENS.GetPromotionalVideoByIdUseCase
		)
		.to(GetPromotionalVideoByIdUseCase)
		.inSingletonScope();

	container
		.bind<IUpdatePromotionalVideoUseCase>(TOKENS.UpdatePromotionalVideoUseCase)
		.to(UpdatePromotionalVideoUseCase)
		.inSingletonScope();

	container
		.bind<IDeletePromotionalVideoUseCase>(TOKENS.DeletePromotionalVideoUseCase)
		.to(DeletePromotionalVideoUseCase)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.GetSignedUrlController)
		.to(GetSignedUrlController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.UploadPromotionalVideoController)
		.to(UploadPromotionalVideoController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.GetPromotionalVideosController)
		.to(GetPromotionalVideosController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.GetPromotionalVideoByIdController)
		.to(GetPromotionalVideoByIdController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.UpdatePromotionalVideoController)
		.to(UpdatePromotionalVideoController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.DeletePromotionalVideoController)
		.to(DeletePromotionalVideoController)
		.inSingletonScope();

	container
		.bind<IVideoServiceClient>(TOKENS.VideoServiceClient)
		.to(VideoServiceClient)
		.inSingletonScope();

	// services
	container.bind<IS3Service>(TOKENS.S3Service).to(S3Service).inSingletonScope();
	container
		.bind<IEmailService>(TOKENS.EmailService)
		.to(EmailService)
		.inSingletonScope();

	container
		.bind<IGetPlansUseCase>(TOKENS.GetAdminPlansUseCase)
		.to(GetAdminPlansUseCase)
		.inSingletonScope();

	container
		.bind<ICreatePlanUseCase>(TOKENS.CreatePlanUseCase)
		.to(CreatePlanUseCase)
		.inSingletonScope();

	container
		.bind<IDeletePlanUseCase>(TOKENS.DeletePlanUseCase)
		.to(DeletePlanUseCase)
		.inSingletonScope();

	container
		.bind<ITogglePlanActiveUseCase>(TOKENS.TogglePlanActiveUseCase)
		.to(TogglePlanActiveUseCase)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.GetAdminPlansController)
		.to(GetAdminPlansController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.CreatePlanController)
		.to(CreatePlanController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.DeletePlanController)
		.to(DeletePlanController)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.TogglePlanActiveController)
		.to(TogglePlanActiveController)
		.inSingletonScope();

	container
		.bind<IUserSubscriptionRepository>(TOKENS.UserSubscriptionRepository)
		.to(UserSubscriptionRepository)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.AuthenticateAdminController)
		.to(AuthenticateAdminController)
		.inSingletonScope();
	container
		.bind<IController>(TOKENS.AdminRefreshTokenController)
		.to(AdminRefreshTokenController)
		.inSingletonScope();
	container
		.bind<IController>(TOKENS.AdminGoogleSignInController)
		.to(AdminGoogleSignInController)
		.inSingletonScope();

	container
		.bind(TOKENS.AuthenticateAdminCase)
		.to(AuthenticateAdminUseCase)
		.inSingletonScope();
	container
		.bind<IRefreshTokenUseCase>(TOKENS.AdminRefreshTokenUseCase)
		.to(AdminRefreshTokenUseCase)
		.inSingletonScope();
	container
		.bind<IGoogleSignInUseCase>(TOKENS.AdminGoogleSignInUseCase)
		.to(AdminGoogleSigninUseCase)
		.inSingletonScope();
	container
		.bind<IUserLogoutUseCase>(TOKENS.AdminLogoutUseCase)
		.to(AdminLogoutUseCase)
		.inSingletonScope();
	container
		.bind<IController>(TOKENS.AdminLogoutController)
		.to(AdminLogoutController)
		.inSingletonScope();

	// Repositories
	container
		.bind<IPromotionalVideoRepository>(TOKENS.PromotionalVideoRepository)
		.to(PromotionalVideoRepository)
		.inSingletonScope();
	container.bind(TOKENS.UserRepository).to(UserRepository).inSingletonScope();
	container
		.bind(TOKENS.RefreshTokenRepository)
		.to(RefreshTokenRepository)
		.inSingletonScope();
	container
		.bind<ISubscriptionRepository>(TOKENS.SubscriptionRepository)
		.to(SubscriptionRepository)
		.inSingletonScope();
	container
		.bind<IPaymentGateway>(TOKENS.PaymentGateway)
		.to(RazorpayRepository)
		.inSingletonScope();

	container
		.bind<IGetPaginatedPaymentsUseCase>(TOKENS.GetPaginatedPaymentsUseCase)
		.to(GetPaginatedPaymentsUseCase)
		.inSingletonScope();

	container
		.bind<IController>(TOKENS.GetPaginatedPaymentsController)
		.to(GetPaginatedPaymentsController)
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

	container
		.bind(TOKENS.GetSubscriptionStatusController)
		.to(GetSubscriptionStatusController);

container.bind<IController>(TOKENS.SalesSummaryController).to(SalesSummaryController);
container.bind<IController>(TOKENS.PlanGroupController).to(PlanGroupController);
container.bind<IController>(TOKENS.FreePlanUsageController).to(FreePlanUsageController);
container.bind<IController>(TOKENS.RevenueByPeriodController).to(RevenueByPeriodController);
container.bind<IController>(TOKENS.StatusDistributionController).to(StatusDistributionController);
container.bind<IController>(TOKENS.GetSubscriptionByRazorpayId).to(GetSubscriptionByRazorpayId);

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
