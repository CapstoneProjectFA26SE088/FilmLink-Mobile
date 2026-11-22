import { createStore } from '@/shared/lib';
import { ArticleStatus, ProcessingStage, Role, ServiceOrderStatus } from '../enums';
import {
  mockExpertArticles,
  mockFeedPosts,
  mockForumThreads,
  mockLabs,
  mockMarketplaceListings,
  mockOrders,
  mockWorkshops,
} from '../mock-data';
import { MAX_OFFER_ROUNDS } from '../options';
import type {
  BookingDraft,
  ConsignmentCategory,
  ConsignmentListing,
  ExpertArticle,
  FilmLab,
  ForumThread,
  PhotoFeedPost,
  PriceOffer,
  ServiceOrder,
  WorkshopEvent,
} from '../types';

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
