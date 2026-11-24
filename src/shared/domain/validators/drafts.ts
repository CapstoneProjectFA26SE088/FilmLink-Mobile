import { z } from 'zod';

export const LabSelectionDraftSchema = z.object({
  activeTab: z.enum(['directory', 'booking']),
  search: z.string(),
  processId: z.union([z.literal('ALL'), z.number().int().positive()]),
  formatId: z.union([z.literal('ALL'), z.number().int().positive()]),
  serviceTypeId: z.union([z.literal('ALL'), z.number().int().positive()]).default('ALL'),
  sort: z.enum(['default', 'price']).default('default'),
  selectedLabId: z.number().int().positive().nullable(),
});

export type LabSelectionDraft = z.infer<typeof LabSelectionDraftSchema>;

export const OrderActionDraftSchema = z.object({
  activeOrderId: z.number().int().positive().nullable(),
  cancelReason: z.string(),
});

export type OrderActionDraft = z.infer<typeof OrderActionDraftSchema>;

export const ConsignmentDraftSchema = z.object({
  title: z.string(),
  category: z.enum(['Máy ảnh cơ', 'Ống kính', 'Phim cuộn', 'Phụ kiện buồng tối']),
  brand: z.string(),
  priceText: z.string(),
  holdingLabName: z.string(),
  description: z.string(),
});

export type ConsignmentDraft = z.infer<typeof ConsignmentDraftSchema>;

export const CommunityDraftSchema = z.object({
  cameraModel: z.string(),
  lensModel: z.string(),
  filmStock: z.string(),
  developedAtLab: z.string(),
  caption: z.string(),
});

export type CommunityDraft = z.infer<typeof CommunityDraftSchema>;

export const ExpertUpgradeDraftSchema = z.object({
  specialization: z.string(),
  experience: z.string(),
  portfolioUrl: z.string(),
});

export type ExpertUpgradeDraft = z.infer<typeof ExpertUpgradeDraftSchema>;

export const AiAdvisorDraftSchema = z.object({
  sessionId: z.number().int().positive().nullable(),
  prompt: z.string(),
});

export type AiAdvisorDraft = z.infer<typeof AiAdvisorDraftSchema>;
