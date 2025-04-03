export interface CreatePlanDTO {
  type: string;
  name: string;
  price?: number;
  interval?: number;
  period?: string;
  maxRecordingDuration?: number;
  hasAiFeatures?: boolean;
  hasAdvancedEditing?: boolean;
  maxMembers?: number;
  maxVideoCount?: number;
  maxWorkspaces?: number;
  isActive?: boolean;
}