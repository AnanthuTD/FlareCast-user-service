export const TOKENS = {
	PrismaClient: Symbol("PrismaClient"),
	RedisClient: Symbol("RedisClient"),
	EventPublisher: Symbol("EventPublisher"),
	EventConsumer: Symbol("EventConsumer"),
	EventEmitter: Symbol("EventEmitter"),
	KafkaEventPublisher: Symbol("KafkaEventPublisher"),
	KafkaEventConsumer: Symbol("KafkaEventConsumer"),
	LocalEventEmitter: Symbol("LocalEventEmitter"),
	PromotionalVideoRepository: Symbol("PromotionalVideoRepository"),
	UserRepository: Symbol("UserRepository"),
	RefreshTokenRepository: Symbol("RefreshTokenRepository"),
	SubscriptionRepository: Symbol("SubscriptionRepository"),
	UserSubscriptionRepository: Symbol("UserSubscriptionRepository"),
	BlacklistRefreshTokenUseCase: Symbol("BlacklistRefreshTokenUseCase"),
	PasswordHasher: Symbol("PasswordHasher"),
	GenerateAccessTokenProvider: Symbol("GenerateAccessTokenProvider"),
	GenerateRefreshTokenProvider: Symbol("GenerateRefreshTokenProvider"),
	RazorpayManager: Symbol("RazorpayManager"),
	TokenManagerProvider: Symbol("TokenManagerProvider"),
	HttpErrors: Symbol("HttpErrors"),
	HttpSuccess: Symbol("HttpSuccess"),
	AuthenticateUserController: Symbol("AuthenticateUserController"),
	GoogleSigninController: Symbol("GoogleSigninController"),
	RefreshTokenController: Symbol("RefreshTokenController"),
	SignUpController: Symbol("SignUpController"),
	SignInController: Symbol("SignInController"),
	UserExistController: Symbol("UserExistController"),
	UserLogoutController: Symbol("UserLogoutController"),
	UserVideoController: Symbol("UserVideoController"),
	CancelSubscriptionController: Symbol("CancelSubscriptionController"),
	CreateSubscribeController: Symbol("CreateSubscribeController"),
	CanSubscribeController: Symbol("CanSubscribeController"),
	GetSubscriptionsController: Symbol("GetSubscriptionsController"),
	GetPlansController: Symbol("GetPlansController"),
	GetMemberLimitController: Symbol("GetMemberLimitController"),
	HandleSubscriptionWebhookController: Symbol(
		"HandleSubscriptionWebhookController"
	),
	VerifyPaymentController: Symbol.for("VerifyPaymentController"),
	GetWorkspaceLimitController: Symbol("GetWorkspaceLimitController"),
	GetUserProfileController: Symbol("GetUserProfileController"),
	UpdateProfileController: Symbol("UpdateProfileController"),
	ElectronPostLoginController: Symbol("ElectronPostLoginController"),
	TitleAndSummaryHandler: Symbol("TitleAndSummaryHandler"),
	VerifiedUserHandler: Symbol("VerifiedUserHandler"),
	VideoRemoveHandler: Symbol("VideoRemoveHandler"),
	VideoUploadHandler: Symbol("VideoUploadHandler"),
	EventService: Symbol("EventService"),
	KafkaConsumerService: Symbol("KafkaConsumerService"),

	ServiceUploadVideoPermissionsController: Symbol(
		"ServiceVideoUploadPermission"
	),

	// services
	EmailService: Symbol("EmailService"),
	S3Service: Symbol.for("S3Service"),

	// usecases
	AuthenticateUserUseCase: Symbol("AuthenticateUserUseCase"),
	UserExistUseCase: Symbol.for("UserExistUseCase"),
	GoogleSignInUseCase: Symbol.for("GoogleSignInUseCase"),
	UserLogoutUseCase: Symbol.for("UserLogoutUseCase"),
	RefreshTokenUseCase: Symbol.for("RefreshTokenUseCase"),
	UserLoginUseCase: Symbol.for("UserLoginUseCase"),
	VerifyUserEmailUseCase: Symbol.for("VerifyUserEmailUseCase"),
	GetActiveSubscriptionUseCase: Symbol.for("GetActiveSubscriptionUseCase"),
	PublishUserVerifiedEventUseCase: Symbol.for(
		"PublishUserVerifiedEventUseCase"
	),
	SignUpUseCase: Symbol.for("SignUpUseCase"),
	ElectronPostLoginUseCase: Symbol.for("ElectronPostLoginUseCase"),
	UploadVideoPermissionsUseCase: Symbol.for("UploadVideoPermissionsUseCase"),
	CancelSubscriptionUseCase: Symbol.for("CancelSubscriptionUseCase"),
	CanSubscribeUseCase: Symbol.for("CanSubscribeUseCase"),
	CreateSubscribeUseCase: Symbol.for("CreateSubscribeUseCase"),
	GetSubscriptionsUseCase: Symbol.for("GetSubscriptionsUseCase"),
	GetMemberLimitUseCase: Symbol.for("GetMemberLimitUseCase"),
	GetPlansUseCase: Symbol.for("GetPlansUseCase"),
	HandleSubscriptionWebhookUseCase: Symbol.for(
		"HandleSubscriptionWebhookUseCase"
	),
	GetWorkspaceLimitUseCase: Symbol.for("GetWorkspaceLimitUseCase"),
	GetUserProfileUseCase: Symbol.for("GetUserProfileUseCase"),
	UpdateProfileUseCase: Symbol.for("UpdateProfileUseCase"),
	CheckUploadVideoPermissionUseCase: Symbol.for(
		"CheckUploadVideoPermissionUseCase"
	),
	VerifyPaymentUseCase: Symbol.for("VerifyPaymentUseCase"),
	GetAdminProfileUseCase: Symbol.for("GetAdminProfileUseCase"),
	GetAdminProfileController: Symbol.for("GetAdminProfileController"),
	AdminRepository: Symbol.for("AdminRepository"),
	AdminSignInUseCase: Symbol.for("AdminSignInUseCase"),
	AdminSignInController: Symbol.for("AdminSignInController"),
	BanUserUseCase: Symbol.for("BanUserUseCase"),
	BanUserController: Symbol.for("BanUserController"),
	GetPaginatedUsersUseCase: Symbol.for("GetPaginatedUsersUseCase"),
	GetPaginatedUsersController: Symbol.for("GetPaginatedUsersController"),
	GetSignedUrlUseCase: Symbol.for("GetSignedUrlUseCase"),
	UploadPromotionalVideoUseCase: Symbol.for("UploadPromotionalVideoUseCase"),
	GetPromotionalVideosUseCase: Symbol.for("GetPromotionalVideosUseCase"),
	GetPromotionalVideoByIdUseCase: Symbol.for("GetPromotionalVideoByIdUseCase"),
	UpdatePromotionalVideoUseCase: Symbol.for("UpdatePromotionalVideoUseCase"),
	DeletePromotionalVideoUseCase: Symbol.for("DeletePromotionalVideoUseCase"),
	GetSignedUrlController: Symbol.for("GetSignedUrlController"),
	UploadPromotionalVideoController: Symbol.for(
		"UploadPromotionalVideoController"
	),
	GetPromotionalVideosController: Symbol.for("GetPromotionalVideosController"),
	GetPromotionalVideoByIdController: Symbol.for(
		"GetPromotionalVideoByIdController"
	),
	UpdatePromotionalVideoController: Symbol.for(
		"UpdatePromotionalVideoController"
	),
	DeletePromotionalVideoController: Symbol.for(
		"DeletePromotionalVideoController"
	),
	VideoServiceClient: Symbol.for("VideoServiceClient"),

	GetAdminPlansUseCase: Symbol.for("GetAdminPlansUseCase"),
	CreatePlanUseCase: Symbol.for("CreatePlanUseCase"),
	DeletePlanUseCase: Symbol.for("DeletePlanUseCase"),
	TogglePlanActiveUseCase: Symbol.for("TogglePlanActiveUseCase"),
	GetAdminPlansController: Symbol.for("GetAdminPlansController"),
	CreatePlanController: Symbol.for("CreatePlanController"),
	DeletePlanController: Symbol.for("DeletePlanController"),
	TogglePlanActiveController: Symbol.for("TogglePlanActiveController"),
	PaymentGateway: Symbol.for("PaymentGateway"),

	AuthenticateAdminController: Symbol.for("AuthenticateAdminController"),
	AdminRefreshTokenController: Symbol.for("AdminRefreshTokenController"),
	AdminGoogleSignInController: Symbol.for("AdminGoogleSigninController"),
	AuthenticateAdminCase: Symbol.for("AuthenticateAdminCase"),
	AdminRefreshTokenUseCase: Symbol.for("AdminRefreshTokenUseCase"),
	AdminGoogleSignInUseCase: Symbol.for("AdminGoogleSignInUseCase"),
	AdminLogoutUseCase: Symbol.for("AdminLogoutUseCase"),
	AdminLogoutController: Symbol.for("AdminLogoutController"),

	GetPaginatedPaymentsUseCase: Symbol.for("GetPaginatedPaymentsUseCase"),
	GetPaginatedPaymentsController: Symbol.for("GetPaginatedPaymentsController"),
	GetSubscriptionStatusController: Symbol.for(
		"GetSubscriptionStatusController"
	),

	SubscriptionService: Symbol.for("SubscriptionService"),
	SalesSummaryController: Symbol.for("SalesSummaryController"),
	PlanGroupController: Symbol.for("PlanGroupController"),
	FreePlanUsageController: Symbol.for("FreePlanUsageController"),
	RevenueByPeriodController: Symbol.for("RevenueByPeriodController"),
	StatusDistributionController: Symbol.for("StatusDistributionController"),
	GetSubscriptionByRazorpayId: Symbol.for("GetSubscriptionByRazorpayId"),

	GetUserPlansWithSubscriptionUseCase: Symbol.for(
		"GetUserPlansWithSubscriptionUseCase"
	),
	GetUserPlansWithSubscriptionController: Symbol.for(
		"GetUserPlansWithSubscriptionController"
	),
};
