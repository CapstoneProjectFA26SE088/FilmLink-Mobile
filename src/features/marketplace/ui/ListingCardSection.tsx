import { useState } from 'react';
import {
  type ConsignmentListing,
  MAX_OFFER_ROUNDS,
  submitConsignmentPriceOffer,
  validateConsignmentOfferPrice,
} from '@/shared/domain';
import { formatDateVn, formatVnd } from '@/shared/lib';
import { Badge, Button, Card, HStack, Input, MediaImage, Text, VStack } from '@/shared/ui';
import { getOfferRoundsMeta } from '../model/marketplace';

export function ListingCardSection({ item }: { readonly item: ConsignmentListing }) {
  const [showReport, setShowReport] = useState(false);
  const [showOfferBox, setShowOfferBox] = useState(false);
  const [offerPriceText, setOfferPriceText] = useState(String(Math.round(item.priceVnd * 0.94)));
  const [offerNote, setOfferNote] = useState(
    'Mình qua Lab kiểm tra trực tiếp và thanh toán ngay trong ngày.',
  );
  const [offerError, setOfferError] = useState<string | null>(null);

  const { roundsUsed, roundsRemaining, canOffer } = getOfferRoundsMeta(item.offers.length);

  const handleSendOffer = () => {
    const check = validateConsignmentOfferPrice(offerPriceText, item.priceVnd);
    if (!check.valid) {
      setOfferError(check.error ?? 'Giá đề xuất không hợp lệ.');
      return;
    }
    try {
      submitConsignmentPriceOffer(item.id, check.numericPrice ?? 0, offerNote);
      setOfferError(null);
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : 'Không thể gửi đề xuất giá.');
    }
  };

  return (
    <Card>
      <VStack gap="sm">
        <MediaImage uri={item.imageUrl} accessibilityLabel={item.title} />

        <HStack justify="between" align="center" gap="sm">
          <Badge label={item.conditionReport.overallGrade} tone="success" />
          <Badge label={`Ký gửi: ${item.holdingLabName}`} tone="info" />
        </HStack>

        <Text variant="heading">{item.title}</Text>
        <Text variant="section" tone="brand">
          {formatVnd(item.priceVnd)}
        </Text>
        <Text variant="secondary" tone="secondary">
          {item.description}
        </Text>

        <HStack gap="xs">
          <Button
            testID={`marketplace.report-btn.${item.id}`}
            label={showReport ? 'Ẩn kiểm định' : 'Xem kiểm định'}
            size="sm"
            variant="outline"
            className="flex-1"
            onPress={() => setShowReport((prev) => !prev)}
          />
          <Button
            testID={`marketplace.offer-toggle.${item.id}`}
            label={`Trả giá (${roundsUsed}/${MAX_OFFER_ROUNDS})`}
            size="sm"
            variant="secondary"
            className="flex-1"
            onPress={() => setShowOfferBox((prev) => !prev)}
          />
        </HStack>

        {showReport ? (
          <Card tone="muted">
            <VStack gap="xs">
              <Text variant="secondary">Đơn vị kiểm định: {item.conditionReport.inspectorLab}</Text>
              <Text variant="caption" tone="muted">
                Ngày kiểm: {formatDateVn(item.conditionReport.inspectedAt)}
              </Text>
              <Text variant="caption">Ngoại hình: {item.conditionReport.cosmeticCondition}</Text>
              <Text variant="caption">Màn trập: {item.conditionReport.shutterAccuracy}</Text>
              <Text variant="caption">Đo sáng: {item.conditionReport.lightMeterStatus}</Text>
              <Text variant="caption">Thấu kính: {item.conditionReport.opticsClarity}</Text>
              <Text variant="caption">Chắn sáng: {item.conditionReport.lightSealsStatus}</Text>
            </VStack>
          </Card>
        ) : null}

        {showOfferBox ? (
          <Card tone="muted">
            <VStack gap="sm">
              <Text variant="secondary">Thương lượng giá · Còn {roundsRemaining} vòng</Text>
              {item.offers.map((off) => (
                <HStack key={off.id} justify="between">
                  <Text variant="caption">
                    Vòng {off.round}: {formatVnd(off.offeredPriceVnd)}
                  </Text>
                  <Badge label={off.status} tone="info" />
                </HStack>
              ))}
              {canOffer ? (
                <>
                  <Input
                    testID={`marketplace.offer-price.${item.id}`}
                    label="Mức giá đề xuất (60%–100%)"
                    value={offerPriceText}
                    onChangeText={setOfferPriceText}
                    keyboardType="numeric"
                    error={offerError}
                  />
                  <Input
                    testID={`marketplace.offer-note.${item.id}`}
                    label="Ghi chú gửi người bán"
                    value={offerNote}
                    onChangeText={setOfferNote}
                  />
                  <Button
                    testID={`marketplace.offer-submit.${item.id}`}
                    label="Gửi đề xuất giá"
                    size="sm"
                    variant="primary"
                    onPress={handleSendOffer}
                  />
                </>
              ) : (
                <Text variant="caption" tone="warning">
                  Đã sử dụng hết {MAX_OFFER_ROUNDS} vòng thương lượng giá.
                </Text>
              )}
            </VStack>
          </Card>
        ) : null}
      </VStack>
    </Card>
  );
}
