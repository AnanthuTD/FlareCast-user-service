export interface CreatePlanResponseDTO {
  plan: {
    id: string;
    type: string;
    name: string;
    price: number;
    interval?: number | null;
    period?: string | null;
    maxRecordingDuration: number;
    hasAiFeatures: boolean;
    hasAdvancedEditing: boolean;
    maxMembers?: number | null;
    maxVideoCount: number;
    maxWorkspaces?: number | null;
    isActive: boolean;
    planId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}