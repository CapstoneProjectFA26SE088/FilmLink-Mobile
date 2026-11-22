import { useState } from 'react';
import {
  authStore,
  CONSIGNMENT_CATEGORIES,
  type ConsignmentDraft,
  ConsignmentDraftSchema,
  createConsignmentListing,
  HOLDING_LABS,
  validateConsignmentListingInput,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { useStore } from '@/shared/lib';
import {
  Button,
  Card,
  DraftRecoveryBanner,
  FilterChipGroup,
  Input,
  Text,
  VStack,
} from '@/shared/ui';

const INITIAL_CONSIGNMENT_DRAFT: ConsignmentDraft = {
  title: 'Nikon FM2n Black + Nikkor 50mm f/1.4 AI-S',
  category: 'Máy ảnh cơ',
  brand: 'Nikon',
  priceText: '6500000',
  holdingLabName: HOLDING_LABS[0] ?? 'Mộc Film Lab',
  description: 'Máy hoạt động hoàn hảo mọi tốc cơ 1s – 1/4000s, đo sáng LED chuẩn.',
};

function isConsignmentDraftEmpty(draft: ConsignmentDraft): boolean {
  const matchesInitial =
    draft.title === INITIAL_CONSIGNMENT_DRAFT.title &&
    draft.category === INITIAL_CONSIGNMENT_DRAFT.category &&
    draft.brand === INITIAL_CONSIGNMENT_DRAFT.brand &&
    draft.priceText === INITIAL_CONSIGNMENT_DRAFT.priceText &&
    draft.holdingLabName === INITIAL_CONSIGNMENT_DRAFT.holdingLabName &&
    draft.description === INITIAL_CONSIGNMENT_DRAFT.description;
  const allTextBlank =
    draft.title.trim().length === 0 &&
    draft.brand.trim().length === 0 &&
    draft.priceText.trim().length === 0 &&
    draft.description.trim().length === 0;
  return matchesInitial || allTextBlank;
}

export function ConsignmentFormSection({ onSuccess }: { readonly onSuccess: () => void }) {
  const user = useStore(authStore, (state) => state.user);
  const {
    draft,
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    clearDraft,
  } = useDraftPersistence<ConsignmentDraft>({
    flowKey: 'marketplace_draft',
    accountId: user?.id ?? null,
    schema: ConsignmentDraftSchema,
    initialDraft: INITIAL_CONSIGNMENT_DRAFT,
    isEmpty: isConsignmentDraftEmpty,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const check = validateConsignmentListingInput({
      title: draft.title,
      priceText: draft.priceText,
    });
    if (!check.valid) {
      setError(check.error ?? 'Dữ liệu không hợp lệ.');
      return;
    }
    setError(null);
    createConsignmentListing({
      title: draft.title,
      category: draft.category,
      brand: draft.brand,
      priceVnd: check.numericPrice ?? 0,
      holdingLabName: draft.holdingLabName,
      description: draft.description,
    });
    void clearDraft();
    onSuccess();
  };

  return (
    <Card>
      <VStack gap="md">
        <Text variant="heading">Đăng ký ký gửi thiết bị tại Lab</Text>
        <DraftRecoveryBanner
          testID="marketplace.form.draft-recovery"
          visible={hasRecoverableDraft}
          pendingRetry={pendingRetry}
          lastErrorDetail={lastErrorDetail}
          lastSavedAt={lastSavedAt}
          onRestore={() => void restoreDraft()}
          onDiscard={() => void clearDraft()}
        />
        <Input
          testID="marketplace.form.title"
          label="Tên thiết bị"
          value={draft.title}
          onChangeText={(title) => updateDraft((prev) => ({ ...prev, title }))}
        />
        <FilterChipGroup
          testIDPrefix="marketplace.form.category"
          label="Danh mục"
          options={CONSIGNMENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={draft.category}
          onChange={(category) => updateDraft((prev) => ({ ...prev, category }))}
        />
        <Input
          testID="marketplace.form.brand"
          label="Hãng sản xuất"
          value={draft.brand}
          onChangeText={(brand) => updateDraft((prev) => ({ ...prev, brand }))}
        />
        <Input
          testID="marketplace.form.price"
          label="Giá mong muốn (VNĐ)"
          value={draft.priceText}
          onChangeText={(priceText) => updateDraft((prev) => ({ ...prev, priceText }))}
          keyboardType="numeric"
          error={error}
        />
        <FilterChipGroup
          testIDPrefix="marketplace.form.lab"
          label="Phòng Lab giữ máy & kiểm định"
          options={HOLDING_LABS.map((lab) => ({ value: lab, label: lab }))}
          value={draft.holdingLabName}
          onChange={(holdingLabName) => updateDraft((prev) => ({ ...prev, holdingLabName }))}
        />
        <Input
          testID="marketplace.form.description"
          label="Mô tả tình trạng"
          value={draft.description}
          onChangeText={(description) => updateDraft((prev) => ({ ...prev, description }))}
          multiline
        />
        <Button
          testID="marketplace.form.submit"
          label="Gửi đăng ký ký gửi"
          variant="primary"
          onPress={handleSubmit}
        />
      </VStack>
    </Card>
  );
}
