export interface GoogleSignInDTO {
	code: {
		access_token: string;
		token_type: string;
		expires_in: string;
		scope: string;
		authuser: string;
		prompt: string;
	};
}
