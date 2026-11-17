import { createStore } from '@/shared/lib';
import {
  ArticleStatus,
  ExpertApplicationStatus,
  FilmFormat,
  FilmProcess,
  HandoverMethod,
  ProcessingStage,
  Role,
  ServiceOrderStatus,
} from './enums';
import {
  mockExpertArticles,
  mockFeedPosts,
  mockForumThreads,
  mockLabs,
  mockMarketplaceListings,
  mockOrders,
  mockWorkshops,
} from './mock-data';
import { MAX_OFFER_ROUNDS } from './options';
import type {
  AiChatMessage,
  ArticleDraft,
  BookingDraft,
  ConsignmentCategory,
  ConsignmentListing,
  ExpertArticle,
  ExpertUpgradeApplication,
  FilmLab,
  ForumThread,
  PhotoFeedPost,
  PriceOffer,
  ScanQualityAnalysis,
  ServiceOrder,
  ServicePackage,
  UserAccount,
  WorkshopEvent,
} from './types';

export type AuthStoreState = {
  readonly user: UserAccount | null;
  readonly isAuthenticated: boolean;
  readonly isHydrated: boolean;
  readonly expertApplication: ExpertUpgradeApplication | null;
};

export const authStore = createStore<AuthStoreState>({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  expertApplication: null,
});

export function logoutUser(): void {
  authStore.setState((prev) => ({
    ...prev,
    user: null,
    isAuthenticated: false,
    expertApplication: null,
  }));
}

export function setAuthUser(user: UserAccount | null): void {
  authStore.setState((prev) => ({
    ...prev,
    user,
    isAuthenticated: user !== null,
    expertApplication: user ? prev.expertApplication : null,
  }));
}

export function setAuthHydrated(isHydrated: boolean): void {
  authStore.setState((prev) => ({
    ...prev,
    isHydrated,
  }));
}

export function updateProfile(updates: Partial<UserAccount>): void {
  authStore.setState((prev) => ({
    ...prev,
    user: prev.user ? { ...prev.user, ...updates } : null,
  }));
}

export function switchUserRole(role: Role): void {
  authStore.setState((prev) => ({
    ...prev,
    user: prev.user ? { ...prev.user, role } : null,
  }));
}

export function submitExpertApplication(payload: {
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly specialization: string;
  readonly experience: string;
  readonly portfolioUrl?: string;
}): void {
  authStore.setState((prev) => ({
    ...prev,
    expertApplication: {
      ...payload,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      status: ExpertApplicationStatus.PENDING,
      submittedAt: new Date().toISOString(),
    },
  }));
}

export function approveExpertApplicationDemo(): void {
  authStore.setState((prev) => {
    const existing = prev.expertApplication;
    const approvedApp: ExpertUpgradeApplication = existing
      ? { ...existing, status: ExpertApplicationStatus.APPROVED }
      : {
          id: 'EXP-8899',
          userId: prev.user?.id ?? 'USR-1024',
          fullName: prev.user?.fullName ?? 'Minh Khôi Analog',
          email: prev.user?.email ?? 'photographer@filmlink.vn',
          experience: '8 năm chụp và tự tráng phim Đen Trắng, C-41 tại buồng tối cá nhân.',
          specialization: 'Buồng tối B&W & Máy ảnh cơ học',
          status: ExpertApplicationStatus.APPROVED,
          submittedAt: new Date().toISOString(),
        };
    return {
      ...prev,
      expertApplication: approvedApp,
      user: prev.user ? { ...prev.user, role: Role.PHOTOGRAPHY_EXPERT } : null,
    };
  });
}

export type DraftStoreState = {
  readonly bookingDraft: BookingDraft;
  readonly articleDraft: ArticleDraft;
};

const INITIAL_BOOKING_DRAFT: BookingDraft = {
  labId: 'LAB-01',
  labName: 'Mộc Film Lab',
  packageId: 'PKG-C41-STD',
  packageName: 'Tráng C-41 + Scan TIFF 16-bit',
  unitPrice: 85_000,
  filmStock: 'Kodak Portra 400',
  filmFormat: FilmFormat.FORMAT_35MM,
  filmProcess: FilmProcess.C41,
  rollCount: 1,
  pushPullStops: 0,
  handoverMethod: HandoverMethod.SELF_DROP_OFF,
  note: '',
};

const INITIAL_ARTICLE_DRAFT: ArticleDraft = {
  title: '',
  category: 'Kỹ thuật buồng tối',
  summary: '',
  content: '',
  proposeKnowledgeBase: true,
};

export const draftStore = createStore<DraftStoreState>({
  bookingDraft: INITIAL_BOOKING_DRAFT,
  articleDraft: INITIAL_ARTICLE_DRAFT,
});

export function updateBookingDraft(patch: Partial<BookingDraft>): void {
  draftStore.setState((prev) => ({
    ...prev,
    bookingDraft: { ...prev.bookingDraft, ...patch },
  }));
}

export function selectLabPackageForBooking(lab: FilmLab, pkg: ServicePackage): void {
  updateBookingDraft({
    labId: lab.id,
    labName: lab.name,
    packageId: pkg.id,
    packageName: pkg.name,
    unitPrice: pkg.priceVnd,
    filmProcess: pkg.process,
    filmFormat: pkg.format,
  });
}

export function resetBookingDraft(): void {
  draftStore.setState((prev) => ({ ...prev, bookingDraft: INITIAL_BOOKING_DRAFT }));
}

export function updateArticleDraft(patch: Partial<ArticleDraft>): void {
  draftStore.setState((prev) => ({
    ...prev,
    articleDraft: { ...prev.articleDraft, ...patch },
  }));
}

export function resetArticleDraft(): void {
  draftStore.setState((prev) => ({ ...prev, articleDraft: INITIAL_ARTICLE_DRAFT }));
}

export type FilmLinkStoreState = {
  readonly labs: readonly FilmLab[];
  readonly orders: readonly ServiceOrder[];
  readonly listings: readonly ConsignmentListing[];
  readonly posts: readonly PhotoFeedPost[];
  readonly threads: readonly ForumThread[];
  readonly articles: readonly ExpertArticle[];
  readonly workshops: readonly WorkshopEvent[];
};

export const filmLinkStore = createStore<FilmLinkStoreState>({
  labs: mockLabs,
  orders: mockOrders,
  listings: mockMarketplaceListings,
  posts: mockFeedPosts,
  threads: mockForumThreads,
  articles: mockExpertArticles,
  workshops: mockWorkshops,
});

export function createServiceOrder(draft: BookingDraft): ServiceOrder {
  const cleanFilmStock = draft.filmStock.trim();
  if (!cleanFilmStock) {
    throw new Error('Vui lòng nhập hoặc chọn tên cuộn phim cần tráng.');
  }
  if (draft.rollCount < 1) {
    throw new Error('Số lượng cuộn phim tối thiểu là 1 cuộn.');
  }

  const newOrder: ServiceOrder = {
    id: `FL-${Math.floor(1002 + Math.random() * 899)}`,
    labId: draft.labId,
    labName: draft.labName,
    filmStock: cleanFilmStock,
    filmProcess: draft.filmProcess,
    filmFormat: draft.filmFormat,
    packageName: draft.packageName,
    rollCount: draft.rollCount,
    handoverMethod: draft.handoverMethod,
    status: ServiceOrderStatus.AWAITING_LAB_CONFIRMATION,
    stage: ProcessingStage.RECEIVED,
    progress: 15,
    totalPriceVnd: draft.unitPrice * draft.rollCount,
    createdAt: new Date().toISOString(),
    promisedReturnDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    timeline: [
      {
        stage: ProcessingStage.RECEIVED,
        label: 'Lab đã tiếp nhận phim',
        technicianNote: draft.note.trim() || 'Đã khởi tạo đơn trên ứng dụng di động.',
        isCurrent: true,
        isDone: false,
      },
      {
        stage: ProcessingStage.DEVELOPING,
        label: `Đang tráng hóa chất ${draft.filmProcess}`,
        isCurrent: false,
        isDone: false,
      },
      {
        stage: ProcessingStage.WASHING,
        label: 'Đang rửa ổn định phim',
        isCurrent: false,
        isDone: false,
      },
      {
        stage: ProcessingStage.DRYING,
        label: 'Đang sấy khô âm bản',
        isCurrent: false,
        isDone: false,
      },
      {
        stage: ProcessingStage.SCANNING,
        label: 'Đang scan kỹ thuật số',
        isCurrent: false,
        isDone: false,
      },
      {
        stage: ProcessingStage.QC,
        label: 'Kiểm tra chất lượng (QC)',
        isCurrent: false,
        isDone: false,
      },
    ],
    scans: [],
  };

  filmLinkStore.setState((prev) => ({
    ...prev,
    orders: [newOrder, ...prev.orders],
  }));
  return newOrder;
}

export function requestOrderFrameRescan(orderId: string, frameId: string, reason: string): void {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error('Vui lòng nhập lý do yêu cầu quét lại khung phim (BR-27).');
  }
  filmLinkStore.setState((prev) => ({
    ...prev,
    orders: prev.orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            scans: order.scans.map((scan) =>
              scan.id === frameId
                ? { ...scan, rescanRequested: true, rescanReason: cleanReason }
                : scan,
            ),
          }
        : order,
    ),
  }));
}

export function submitOrderLabReview(orderId: string, rating: number, comment: string): void {
  filmLinkStore.setState((prev) => ({
    ...prev,
    orders: prev.orders.map((order) =>
      order.id === orderId
        ? { ...order, hasReviewed: true, reviewRating: rating, reviewComment: comment.trim() }
        : order,
    ),
  }));
}

export function submitConsignmentPriceOffer(
  itemId: string,
  offeredPriceVnd: number,
  note?: string,
): PriceOffer {
  const listing = filmLinkStore.getState().listings.find((item) => item.id === itemId);
  if (!listing) {
    throw new Error('Không tìm thấy thiết bị ký gửi.');
  }
  const currentRounds = listing.offers.length;
  if (currentRounds >= MAX_OFFER_ROUNDS) {
    throw new Error(`Đã đạt giới hạn tối đa ${MAX_OFFER_ROUNDS} vòng thương lượng giá (BR-52).`);
  }
  if (offeredPriceVnd < listing.priceVnd * 0.6 || offeredPriceVnd > listing.priceVnd) {
    throw new Error('Mức giá đề xuất phải nằm trong khoảng từ 60% đến 100% giá niêm yết.');
  }

  const newOffer: PriceOffer = {
    id: `OFF-${Date.now().toString().slice(-4)}`,
    round: currentRounds + 1,
    offeredPriceVnd,
    senderRole: 'BUYER',
    status: 'PENDING',
    note: note?.trim(),
    createdAt: new Date().toISOString(),
  };

  filmLinkStore.setState((prev) => ({
    ...prev,
    listings: prev.listings.map((item) =>
      item.id === itemId ? { ...item, offers: [...item.offers, newOffer] } : item,
    ),
  }));
  return newOffer;
}

export function createConsignmentListing(payload: {
  readonly title: string;
  readonly category: ConsignmentCategory;
  readonly brand: string;
  readonly priceVnd: number;
  readonly holdingLabName: string;
  readonly description: string;
}): ConsignmentListing {
  const created: ConsignmentListing = {
    id: `MKT-${Math.floor(210 + Math.random() * 700)}`,
    title: payload.title.trim(),
    category: payload.category,
    brand: payload.brand.trim() || 'Analog',
    priceVnd: payload.priceVnd,
    sellerName: 'Bạn (Ký gửi mới)',
    holdingLabName: payload.holdingLabName,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    description: payload.description.trim(),
    status: 'AVAILABLE',
    conditionReport: {
      id: `CR-${Date.now().toString().slice(-3)}`,
      inspectorLab: `${payload.holdingLabName} (Chờ kiểm định vật lý)`,
      inspectedAt: new Date().toISOString(),
      overallGrade: 'Excellent (90%)',
      cosmeticCondition: 'Đã đăng ký lịch mang máy tới Lab kiểm định BR-51.',
      shutterAccuracy: 'Đang chờ đo bằng máy đo tốc màn trập chuyên dụng.',
      lightMeterStatus: 'Đang chờ kiểm tra.',
      opticsClarity: 'Đang chờ soi đèn kiểm tra thấu kính.',
      lightSealsStatus: 'Đang chờ kiểm tra buồng tối.',
      verifiedWorking: true,
    },
    offers: [],
  };

  filmLinkStore.setState((prev) => ({
    ...prev,
    listings: [created, ...prev.listings],
  }));
  return created;
}

export function toggleLikePhotoPost(postId: string): void {
  filmLinkStore.setState((prev) => ({
    ...prev,
    posts: prev.posts.map((post) => {
      if (post.id !== postId) {
        return post;
      }
      const nextLiked = !post.isLiked;
      return {
        ...post,
        isLiked: nextLiked,
        likesCount: Math.max(0, post.likesCount + (nextLiked ? 1 : -1)),
      };
    }),
  }));
}

export function createPhotoPost(payload: {
  readonly authorName: string;
  readonly authorRole: Role;
  readonly cameraModel: string;
  readonly lensModel: string;
  readonly filmStock: string;
  readonly developedAtLab: string;
  readonly caption: string;
}): void {
  const newPost: PhotoFeedPost = {
    id: `POST-${Date.now().toString().slice(-4)}`,
    ...payload,
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1000&q=80',
    likesCount: 1,
    commentsCount: 0,
    isLiked: true,
    createdAt: new Date().toISOString(),
  };
  filmLinkStore.setState((prev) => ({
    ...prev,
    posts: [newPost, ...prev.posts],
  }));
}

export function postForumAnswer(payload: {
  readonly threadId: string;
  readonly authorName: string;
  readonly authorRole: Role;
  readonly content: string;
}): void {
  const cleanContent = payload.content.trim();
  if (!cleanContent) {
    return;
  }
  const isExpert = payload.authorRole === Role.PHOTOGRAPHY_EXPERT;
  const newAnswer = {
    id: `ANS-${Date.now().toString().slice(-4)}`,
    authorName: payload.authorName,
    authorRole: payload.authorRole,
    content: cleanContent,
    isEndorsedByExpert: isExpert,
    createdAt: new Date().toISOString(),
  };

  filmLinkStore.setState((prev) => ({
    ...prev,
    threads: prev.threads.map((thread) =>
      thread.id === payload.threadId
        ? {
            ...thread,
            answers: isExpert ? [newAnswer, ...thread.answers] : [...thread.answers, newAnswer],
          }
        : thread,
    ),
  }));
}

export function createExpertArticle(payload: {
  readonly title: string;
  readonly authorName: string;
  readonly category: string;
  readonly summary: string;
  readonly contentMarkdown: string;
  readonly proposeKnowledgeBase: boolean;
}): ExpertArticle {
  const article: ExpertArticle = {
    id: `ART-${Math.floor(705 + Math.random() * 200)}`,
    title: payload.title.trim(),
    authorName: payload.authorName,
    category: payload.category,
    readTimeMinutes: Math.max(3, Math.ceil(payload.contentMarkdown.length / 400)),
    summary: payload.summary.trim(),
    contentMarkdown: payload.contentMarkdown.trim(),
    status: payload.proposeKnowledgeBase ? ArticleStatus.KB_PENDING : ArticleStatus.PUBLISHED,
    publishedAt: new Date().toISOString(),
    viewsCount: 1,
    endorsementsCount: 1,
  };
  filmLinkStore.setState((prev) => ({
    ...prev,
    articles: [article, ...prev.articles],
  }));
  return article;
}

export function createWorkshopEvent(payload: {
  readonly title: string;
  readonly hostExpertName: string;
  readonly date: string;
  readonly timeRange: string;
  readonly location: string;
  readonly capacity: number;
  readonly feeVnd: number;
  readonly description: string;
}): WorkshopEvent {
  const workshop: WorkshopEvent = {
    id: `WS-${Math.floor(405 + Math.random() * 500)}`,
    ...payload,
    capacity: Math.max(1, payload.capacity),
    feeVnd: Math.max(0, payload.feeVnd),
    registeredCount: 1,
    attendees: [
      {
        id: 'ATT-NEW-1',
        fullName: 'Người tham dự đăng ký sớm',
        email: 'earlybird@filmlink.vn',
        checkedIn: false,
      },
    ],
  };
  filmLinkStore.setState((prev) => ({
    ...prev,
    workshops: [workshop, ...prev.workshops],
  }));
  return workshop;
}

export function toggleWorkshopAttendeeCheckIn(workshopId: string, attendeeId: string): void {
  filmLinkStore.setState((prev) => ({
    ...prev,
    workshops: prev.workshops.map((workshop) =>
      workshop.id === workshopId
        ? {
            ...workshop,
            attendees: workshop.attendees.map((a) =>
              a.id === attendeeId ? { ...a, checkedIn: !a.checkedIn } : a,
            ),
          }
        : workshop,
    ),
  }));
}

export function buildAiAdvisoryReply(prompt: string): AiChatMessage {
  const lower = prompt.toLowerCase();
  let reply =
    'Dựa trên Knowledge Base của FilmLink: Đối với phim màu C-41 (như Kodak Gold 200 hoặc Portra 400), bạn nên đo sáng ưu tiên vùng tối (+0.5 đến +1 EV) để giữ chi tiết mịn màng và tránh bệt hạt vùng shadow.';
  let recommendedLabId: string | undefined = 'LAB-01';

  if (lower.includes('đen trắng') || lower.includes('b&w') || lower.includes('hp5')) {
    reply =
      'Với phim Đen Trắng (Ilford HP5+ / Kodak Tri-X): Nếu bạn chụp thiếu sáng và muốn push lên ISO 1600, hãy ghi chú cho Lab dùng thuốc tráng bù tốc độ Ilford Microphen hoặc D-76 (1+1). Darkroom Sài Gòn và Mộc Film Lab đều hỗ trợ tráng lắc tay B&W.';
    recommendedLabId = 'LAB-02';
  } else if (lower.includes('ecn') || lower.includes('vision') || lower.includes('800t')) {
    reply =
      'Với phim điện ảnh (Kodak Vision3 500T / 250D): Cần chọn đúng quy trình ECN-2 có bước khử lớp chống lóa Remjet để không làm bẩn hóa chất. LLab Analog Hà Nội và Mộc Film Lab có dây chuyền ECN-2 chuyên dụng.';
    recommendedLabId = 'LAB-03';
  } else if (lower.includes('lộ sáng') || lower.includes('xước') || lower.includes('bụi')) {
    reply =
      'Vệt sáng cam/đỏ chạy dọc mép phim thường do lão hóa mút chắn sáng bản lề nắp lưng (Light Seal). Nếu vệt trắng chạy ngang chỉ trong khung hình, có thể do rèm màn trập đóng chậm. Bạn có thể gửi yêu cầu Rescan (BR-27) nếu nghi ngờ lỗi do bụi mặt kính scanner.';
  }

  return {
    id: `AI-${Date.now()}`,
    sender: 'AI',
    text: reply,
    timestamp: new Date().toISOString(),
    recommendedLabId,
  };
}

export function analyzeFilmScanQuality(frameNumber: number): ScanQualityAnalysis {
  return {
    overallScore: 95,
    exposureAssessment: `Frame #${frameNumber}: Dải tương phản cân bằng (Dynamic Range 9.5 stops), không bị cháy sáng vùng highlight.`,
    dustAndScratchReport:
      'Digital ICE / Khử bụi hồng ngoại đạt chuẩn: Không phát hiện dị vật hay đường xước dọc mặt nhũ tương.',
    colorBalanceNote:
      'Cân bằng trắng chuẩn âm bản Kodak, tông màu da tự nhiên, không ám xanh lá vùng tối.',
    recommendation: 'File đủ tiêu chuẩn in phóng khổ 40x60cm hoặc xuất bản lên Photo Feed.',
  };
}
