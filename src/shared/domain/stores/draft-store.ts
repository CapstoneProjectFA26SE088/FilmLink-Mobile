import { createStore } from '@/shared/lib';
import { FilmFormat, FilmProcess, HandoverMethod } from '../enums';
import type { ArticleDraft, BookingDraft, FilmLab, ServicePackage } from '../types';

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
