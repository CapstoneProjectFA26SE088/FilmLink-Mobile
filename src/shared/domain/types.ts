import type {
  AccountStatus,
  ArticleStatus,
  ExpertApplicationStatus,
  FilmFormat,
  FilmProcess,
  HandoverMethod,
  ProcessingStage,
  Role,
  ServiceOrderStatus,
} from './enums';

export type UserAccount = {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phoneNumber?: string;
  readonly role: Role;
  readonly status: AccountStatus;
  readonly avatarUrl?: string;
  readonly bio?: string;
  readonly joinedAt: string;
};

export type ExpertUpgradeApplication = {
  readonly id: string;
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly experience: string;
  readonly portfolioUrl?: string;
  readonly specialization: string;
  readonly status: ExpertApplicationStatus;
  readonly submittedAt: string;
  readonly reviewNote?: string;
};

export type ServicePackage = {
  readonly id: string;
  readonly name: string;
  readonly process: FilmProcess;
  readonly format: FilmFormat;
  readonly priceVnd: number;
  readonly turnaroundDays: string;
  readonly resolutionDpi: string;
  readonly description: string;
};

export type FilmLab = {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly address: string;
  readonly rating: number;
  readonly reviewCount: number;
  readonly turnaroundSummary: string;
  readonly supportedProcesses: readonly FilmProcess[];
  readonly supportedFormats: readonly FilmFormat[];
  readonly scannerModels: readonly string[];
  readonly description: string;
  readonly packages: readonly ServicePackage[];
  readonly isVerified: boolean;
};

export type ScanFile = {
  readonly id: string;
  readonly frameNumber: number;
  readonly previewUrl: string;
  readonly fullResUrl: string;
  readonly exposureNote?: string;
  readonly aiQualityScore?: number;
  readonly rescanRequested?: boolean;
  readonly rescanReason?: string;
};

export type ProcessingStageRecord = {
  readonly stage: ProcessingStage;
  readonly label: string;
  readonly completedAt?: string;
  readonly technicianNote?: string;
  readonly isCurrent: boolean;
  readonly isDone: boolean;
};

export type ServiceOrder = {
  readonly id: string;
  readonly labId: string;
  readonly labName: string;
  readonly filmStock: string;
  readonly filmProcess: FilmProcess;
  readonly filmFormat: FilmFormat;
  readonly packageName: string;
  readonly rollCount: number;
  readonly handoverMethod: HandoverMethod;
  readonly status: ServiceOrderStatus;
  readonly stage: ProcessingStage;
  readonly progress: number;
  readonly totalPriceVnd: number;
  readonly createdAt: string;
  readonly promisedReturnDate: string;
  readonly timeline: readonly ProcessingStageRecord[];
  readonly scans: readonly ScanFile[];
  readonly hasReviewed?: boolean;
  readonly reviewRating?: number;
  readonly reviewComment?: string;
};

export type ConditionReport = {
  readonly id: string;
  readonly inspectorLab: string;
  readonly inspectedAt: string;
  readonly overallGrade: 'Mint (98%)' | 'Near Mint (95%)' | 'Excellent (90%)' | 'Good (85%)';
  readonly cosmeticCondition: string;
  readonly shutterAccuracy: string;
  readonly lightMeterStatus: string;
  readonly opticsClarity: string;
  readonly lightSealsStatus: string;
  readonly verifiedWorking: boolean;
};

export type PriceOffer = {
  readonly id: string;
  readonly round: number;
  readonly offeredPriceVnd: number;
  readonly senderRole: 'BUYER' | 'SELLER';
  readonly status: 'PENDING' | 'ACCEPTED' | 'COUNTERED' | 'DECLINED';
  readonly note?: string;
  readonly createdAt: string;
};

export type ConsignmentCategory = 'Máy ảnh cơ' | 'Ống kính' | 'Phim cuộn' | 'Phụ kiện buồng tối';

export type ConsignmentListing = {
  readonly id: string;
  readonly title: string;
  readonly category: ConsignmentCategory;
  readonly brand: string;
  readonly priceVnd: number;
  readonly sellerName: string;
  readonly holdingLabName: string;
  readonly imageUrl: string;
  readonly description: string;
  readonly conditionReport: ConditionReport;
  readonly offers: readonly PriceOffer[];
  readonly status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
};

export type PhotoFeedPost = {
  readonly id: string;
  readonly authorName: string;
  readonly authorRole: Role;
  readonly cameraModel: string;
  readonly lensModel: string;
  readonly filmStock: string;
  readonly developedAtLab: string;
  readonly caption: string;
  readonly imageUrl: string;
  readonly likesCount: number;
  readonly commentsCount: number;
  readonly isLiked: boolean;
  readonly createdAt: string;
};

export type ForumAnswer = {
  readonly id: string;
  readonly authorName: string;
  readonly authorRole: Role;
  readonly content: string;
  readonly isEndorsedByExpert: boolean;
  readonly createdAt: string;
};

export type ForumThread = {
  readonly id: string;
  readonly title: string;
  readonly authorName: string;
  readonly tag: string;
  readonly question: string;
  readonly viewsCount: number;
  readonly createdAt: string;
  readonly answers: readonly ForumAnswer[];
};

export type ExpertArticle = {
  readonly id: string;
  readonly title: string;
  readonly authorName: string;
  readonly category: string;
  readonly readTimeMinutes: number;
  readonly summary: string;
  readonly contentMarkdown: string;
  readonly status: ArticleStatus;
  readonly publishedAt: string;
  readonly viewsCount: number;
  readonly endorsementsCount: number;
};

export type WorkshopAttendee = {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly checkedIn: boolean;
};

export type WorkshopEvent = {
  readonly id: string;
  readonly title: string;
  readonly hostExpertName: string;
  readonly date: string;
  readonly timeRange: string;
  readonly location: string;
  readonly capacity: number;
  readonly registeredCount: number;
  readonly feeVnd: number;
  readonly description: string;
  readonly attendees: readonly WorkshopAttendee[];
};

export type AiChatMessage = {
  readonly id: string;
  readonly sender: 'USER' | 'AI';
  readonly text: string;
  readonly timestamp: string;
  readonly recommendedLabId?: string;
};

export type ScanQualityAnalysis = {
  readonly overallScore: number;
  readonly exposureAssessment: string;
  readonly dustAndScratchReport: string;
  readonly colorBalanceNote: string;
  readonly recommendation: string;
};

export type BookingDraft = {
  readonly labId: string;
  readonly labName: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly unitPrice: number;
  readonly filmStock: string;
  readonly filmFormat: FilmFormat;
  readonly filmProcess: FilmProcess;
  readonly rollCount: number;
  readonly pushPullStops: number;
  readonly handoverMethod: HandoverMethod;
  readonly note: string;
};

export type ArticleDraft = {
  readonly title: string;
  readonly category: string;
  readonly summary: string;
  readonly content: string;
  readonly proposeKnowledgeBase: boolean;
};
