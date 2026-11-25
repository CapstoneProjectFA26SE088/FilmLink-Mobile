import type {
  ChatbotMessagesParams,
  NegativePreviewSessionListParams,
  PublicFilmLabSearchParams,
  SearchFilmArchiveParams,
  ServiceOrderListParams,
} from './contracts';

export const CATALOG_STALE_TIME_MS = 5 * 60 * 1000;
export const SIGNED_URL_STALE_TIME_MS = 10 * 60 * 1000;
export const ORDER_STALE_TIME_MS = 30_000;

export const filmLinkQueryKeys = {
  accounts: {
    all: ['accounts'] as const,
    me: () => ['accounts', 'me'] as const,
  },
  archive: {
    all: ['archive'] as const,
    list: (params?: SearchFilmArchiveParams) => ['archive', 'list', params ?? {}] as const,
    infinite: (params?: Omit<SearchFilmArchiveParams, 'page'>) =>
      ['archive', 'infinite', params ?? {}] as const,
    roll: (archiveRollId: number) => ['archive', 'roll', archiveRollId] as const,
  },
  catalogs: {
    all: ['catalogs'] as const,
    formats: () => ['catalogs', 'formats'] as const,
    processes: () => ['catalogs', 'processes'] as const,
    serviceTypes: () => ['catalogs', 'service-types'] as const,
    stocks: (q?: string) => ['catalogs', 'stocks', (q ?? '').trim().toLowerCase()] as const,
    printSizes: () => ['catalogs', 'print-sizes'] as const,
  },
  chatbot: {
    all: ['chatbot'] as const,
    messages: (sessionId: number, params?: ChatbotMessagesParams) =>
      ['chatbot', 'messages', sessionId, params ?? {}] as const,
  },
  labs: {
    all: ['labs'] as const,
    list: (params?: PublicFilmLabSearchParams) => ['labs', 'list', params ?? {}] as const,
    detail: (labId: number) => ['labs', 'detail', labId] as const,
    printPrices: (labId: number) => ['labs', 'print-prices', labId] as const,
  },
  negativePreview: {
    all: ['negative-preview'] as const,
    sessions: (params?: NegativePreviewSessionListParams) =>
      ['negative-preview', 'sessions', params ?? {}] as const,
    session: (sessionId: number) => ['negative-preview', 'session', sessionId] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (params?: ServiceOrderListParams) => ['orders', 'list', params ?? {}] as const,
    infinite: (params?: Omit<ServiceOrderListParams, 'page'>) =>
      ['orders', 'infinite', params ?? {}] as const,
    detail: (orderId: number) => ['orders', 'detail', orderId] as const,
  },
} as const;
