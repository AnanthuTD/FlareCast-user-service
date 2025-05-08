export interface GetPlansAdminDto {
	skip?: number;
	limit?: number;
	status?: "active" | "inactive" | "all";
}
