import { Token } from "typedi";

export const TOKENS = {
	PrismaClient: new Token("PrismaClient"),
	RedisClient: new Token("RedisClient"),
	PromotionalVideoRepository: new Token("PromotionalVideoRepository"),
	EventPublisher: new Token("EventPublisher"),
	EventConsumer: new Token("EventConsumer"),
	EventEmitter: new Token("EventEmitter"),
	TitleAndSummaryHandler: new Token("TitleAndSummaryHandler"),
	VerifiedUserHandler: new Token("VerifiedUserHandler"),
	VideoRemoveHandler: new Token("VideoRemoveHandler"),
	VideoUploadHandler: new Token("VideoUploadHandler"),
  LocalEventEmitter: new Token("LocalEventEmitter"),
  EventService: new Token("EventService"),
  KafkaEventPublisher: new Token("KafkaEventPublisher"),
  KafkaEventConsumer: new Token("KafkaEventConsumer"),

	BlacklistRefreshTokenUseCase: new Token("BlacklistRefreshTokenUseCase"),
	RefreshTokenRepository: new Token("RefreshTokenRepository"),
	UserRepository: new Token("UserRepository"),
	PasswordHasher: new Token("PasswordHasher"),
	KafkaConsumerService: new Token("KafkaConsumerService"),

	GenerateAccessTokenProvider: new Token("GenerateAccessTokenProvider"),
	GenerateRefreshTokenProvider: new Token("GenerateRefreshTokenProvider"),
	RazorpayManager: new Token("RazorpayManager"),
	TokenManagerProvider: new Token("TokenManagerProvider"),

	SubscriptionRepository: new Token("SubscriptionRepository"),
	UserSubscriptionRepository: new Token("UserSubscriptionRepository"),
	RazorpayRepository: new Token("RazorpayRepository"),

	HttpErrors: new Token("HttpErrors"),
	HttpSuccess: new Token("HttpSuccess"),
  
	AuthenticateUserController: new Token("AuthenticateUserController"),
	GoogleSigninController: new Token("GoogleSigninController"),
  RefreshTokenController: new Token("RefreshTokenController"),
  SignUpController: new Token("SignUpController"),
  SignInController: new Token("SignInController"),
  UserVideoController: new Token("UserVideoController"),
	UserExistController: new Token("UserExistController"),
	UserLogoutController: new Token("UserLogoutController"),
  
	ElectronPostLoginController: new Token("ElectronPostLoginController"),
	
	CancelSubscriptionController: new Token("CancelSubscriptionController"),
	CreateSubscribeController: new Token("CreateSubscribeController"),
	CanSubscribeController: new Token("CanSubscribeController"),
	GetSubscriptionsController: new Token("GetSubscriptionsController"),
  GetPlansController: new Token("GetPlansController"),
	GetMemberLimitController: new Token("GetMemberLimitController"),
	HandleSubscriptionWebhookController: new Token("HandleSubscriptionWebhookController"),
	GetWorkspaceLimitController: new Token("GetWorkspaceLimit"),

	GetUserProfileController: new Token("GetUserProfileController"),
	UpdateProfileController: new Token("UpdateProfileController"),

};
