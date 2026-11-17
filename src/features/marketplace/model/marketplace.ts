import { type ConsignmentListing, MAX_OFFER_ROUNDS } from '@/shared/domain';

export function filterListingsByCategory(
  listings: readonly ConsignmentListing[],
  category: string,
): readonly ConsignmentListing[] {
  if (!category || category === 'Tất cả') {
    return listings;
  }
  return listings.filter((item) => item.category === category);
}

export function getOfferRoundsMeta(offersCount: number): {
  readonly roundsUsed: number;
  readonly roundsRemaining: number;
  readonly canOffer: boolean;
} {
  const safeCount = Math.max(0, offersCount);
  const roundsRemaining = Math.max(0, MAX_OFFER_ROUNDS - safeCount);
  return {
    roundsUsed: safeCount,
    roundsRemaining,
    canOffer: roundsRemaining > 0,
  };
}
