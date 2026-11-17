import { useState } from 'react';
import {
  CONSIGNMENT_CATEGORIES,
  type ConsignmentCategory,
  createConsignmentListing,
  HOLDING_LABS,
  validateConsignmentListingInput,
} from '@/shared/domain';
import { Button, Card, FilterChipGroup, Input, Text, VStack } from '@/shared/ui';

export function ConsignmentFormSection({ onSuccess }: { readonly onSuccess: () => void }) {
  const [title, setTitle] = useState('Nikon FM2n Black + Nikkor 50mm f/1.4 AI-S');
  const [category, setCategory] = useState<ConsignmentCategory>('Máy ảnh cơ');
  const [brand, setBrand] = useState('Nikon');
  const [priceText, setPriceText] = useState('6500000');
  const [holdingLabName, setHoldingLabName] = useState(HOLDING_LABS[0] ?? 'Mộc Film Lab');
  const [description, setDescription] = useState(
    'Máy hoạt động hoàn hảo mọi tốc cơ 1s – 1/4000s, đo sáng LED chuẩn.',
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const check = validateConsignmentListingInput({ title, priceText });
    if (!check.valid) {
      setError(check.error);
      return;
    }
    setError(null);
    createConsignmentListing({
      title,
      category,
      brand,
      priceVnd: check.numericPrice,
      holdingLabName,
      description,
    });
    onSuccess();
  };

  return (
    <Card>
      <VStack gap="md">
        <Text variant="heading">Đăng ký ký gửi thiết bị tại Lab (BR-51)</Text>
        <Input
          testID="marketplace.form.title"
          label="Tên thiết bị"
          value={title}
          onChangeText={setTitle}
        />
        <FilterChipGroup
          testIDPrefix="marketplace.form.category"
          label="Danh mục"
          options={CONSIGNMENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={setCategory}
        />
        <Input
          testID="marketplace.form.brand"
          label="Hãng sản xuất"
          value={brand}
          onChangeText={setBrand}
        />
        <Input
          testID="marketplace.form.price"
          label="Giá mong muốn (VNĐ)"
          value={priceText}
          onChangeText={setPriceText}
          keyboardType="numeric"
          error={error}
        />
        <FilterChipGroup
          testIDPrefix="marketplace.form.lab"
          label="Phòng Lab giữ máy & kiểm định"
          options={HOLDING_LABS.map((lab) => ({ value: lab, label: lab }))}
          value={holdingLabName}
          onChange={setHoldingLabName}
        />
        <Input
          testID="marketplace.form.description"
          label="Mô tả tình trạng"
          value={description}
          onChangeText={setDescription}
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
