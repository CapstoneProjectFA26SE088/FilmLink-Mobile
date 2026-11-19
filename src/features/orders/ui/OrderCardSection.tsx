import { useState } from 'react';
import {
  analyzeFilmScanQuality,
  HANDOVER_METHOD_LABELS,
  PROCESSING_STAGE_LABELS,
  requestOrderFrameRescan,
  type ScanFile,
  type ScanQualityAnalysis,
  type ServiceOrder,
  submitOrderLabReview,
} from '@/shared/domain';
import { formatDateVn, formatVnd } from '@/shared/lib';
import { Badge, Button, Card, HStack, Icon, Input, MediaImage, Text, VStack } from '@/shared/ui';

function ScanArchiveSection({
  orderId,
  scans,
}: {
  readonly orderId: string;
  readonly scans: readonly ScanFile[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ScanQualityAnalysis | null>(null);
  const [rescanReason, setRescanReason] = useState(
    'Có vệt bụi mặt kính scanner ở góc trên bên phải khung hình.',
  );
  const [rescanError, setRescanError] = useState<string | null>(null);

  const frame = scans[selectedIndex] ?? scans[0];
  if (!frame) {
    return null;
  }

  const handleRequestRescan = () => {
    try {
      requestOrderFrameRescan(orderId, frame.id, rescanReason);
      setRescanError(null);
    } catch (err) {
      setRescanError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu rescan.');
    }
  };

  return (
    <Card tone="muted">
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Text variant="secondary">Lưu trữ ảnh Scan số độ phân giải cao</Text>
          <Badge label={`Frame #${frame.frameNumber}`} tone="info" />
        </HStack>

        <MediaImage uri={frame.previewUrl} accessibilityLabel={`Scan frame ${frame.frameNumber}`} />

        <HStack gap="xs">
          {scans.map((s, idx) => (
            <Button
              key={s.id}
              testID={`orders.frame.${s.id}`}
              label={`#${s.frameNumber}`}
              size="sm"
              variant={idx === selectedIndex ? 'primary' : 'outline'}
              onPress={() => {
                setSelectedIndex(idx);
                setAnalysis(null);
              }}
            />
          ))}
        </HStack>

        {frame.exposureNote ? (
          <Text variant="caption" tone="secondary">
            {frame.exposureNote}
          </Text>
        ) : null}

        <HStack gap="xs">
          <Button
            testID={`orders.download.${orderId}`}
            label={downloadedId === frame.id ? 'Đã lưu file gốc' : 'Tải Full-Res'}
            size="sm"
            variant="secondary"
            className="flex-1"
            icon={<Icon name="cloud-download-outline" size="xs" tone="brand" />}
            onPress={() => setDownloadedId(frame.id)}
          />
          <Button
            testID={`orders.ai-check.${orderId}`}
            label="AI Chẩn đoán"
            size="sm"
            variant="outline"
            className="flex-1"
            icon={<Icon name="sparkles" size="xs" tone="default" />}
            onPress={() => setAnalysis(analyzeFilmScanQuality(frame.frameNumber))}
          />
        </HStack>

        {analysis ? (
          <Card tone="brand">
            <VStack gap="xs">
              <Text variant="secondary" tone="brand">
                Điểm chất lượng AI: {analysis.overallScore}/100
              </Text>
              <Text variant="caption">{analysis.exposureAssessment}</Text>
              <Text variant="caption">{analysis.dustAndScratchReport}</Text>
            </VStack>
          </Card>
        ) : null}

        <Input
          testID={`orders.rescan-input.${orderId}`}
          label="Yêu cầu quét lại khung phim"
          value={rescanReason}
          onChangeText={setRescanReason}
          error={rescanError}
        />
        <Button
          testID={`orders.rescan-btn.${orderId}`}
          label={frame.rescanRequested ? 'Đã gửi yêu cầu Rescan' : 'Gửi yêu cầu Rescan'}
          size="sm"
          variant="outline"
          disabled={Boolean(frame.rescanRequested)}
          onPress={handleRequestRescan}
        />
      </VStack>
    </Card>
  );
}

function OrderTimelineSection({ timeline }: { readonly timeline: ServiceOrder['timeline'] }) {
  return (
    <VStack gap="xs">
      {timeline.map((step) => {
        const iconName = step.isDone
          ? 'checkmark-circle'
          : step.isCurrent
            ? 'ellipse'
            : 'ellipse-outline';
        const tone = step.isCurrent ? 'brand' : step.isDone ? 'success' : 'muted';
        return (
          <HStack key={step.stage} justify="between" align="center" gap="sm">
            <HStack gap="xs" align="center" className="flex-1">
              <Icon name={iconName} size="xs" tone={tone} />
              <VStack gap="none" className="flex-1">
                <Text variant="caption" tone={tone}>
                  {step.label}
                </Text>
                {step.technicianNote ? (
                  <Text variant="caption" tone="muted">
                    {step.technicianNote}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
            {step.completedAt ? (
              <Text variant="caption" tone="muted">
                {formatDateVn(step.completedAt)}
              </Text>
            ) : null}
          </HStack>
        );
      })}
    </VStack>
  );
}

function LabReviewSection({ order }: { readonly order: ServiceOrder }) {
  const [rating, setRating] = useState(order.reviewRating ?? 5);
  const [comment, setComment] = useState(
    order.reviewComment ?? 'Màu scan trong trẻo, giữ chi tiết vùng tối tốt.',
  );

  return (
    <Card tone="muted">
      <VStack gap="xs">
        <Text variant="secondary">Đánh giá chất lượng Phòng Lab</Text>
        <HStack gap="xs">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              testID={`orders.star.${order.id}.${star}`}
              label={`${star}★`}
              size="sm"
              variant={rating >= star ? 'primary' : 'outline'}
              onPress={() => setRating(star)}
            />
          ))}
        </HStack>
        <Input
          testID={`orders.review-input.${order.id}`}
          value={comment}
          onChangeText={setComment}
          placeholder="Nhận xét chất lượng tráng scan..."
        />
        <Button
          testID={`orders.review-submit.${order.id}`}
          label={order.hasReviewed ? 'Cập nhật đánh giá' : 'Gửi đánh giá Lab'}
          size="sm"
          variant="secondary"
          onPress={() => submitOrderLabReview(order.id, rating, comment)}
        />
      </VStack>
    </Card>
  );
}

export function OrderCardSection({
  order,
  defaultExpanded,
}: {
  readonly order: ServiceOrder;
  readonly defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <VStack gap="none" className="flex-1">
            <Text variant="heading">
              {order.id} · {order.filmStock}
            </Text>
            <Text variant="caption" tone="muted">
              {order.labName} · {HANDOVER_METHOD_LABELS[order.handoverMethod]}
            </Text>
          </VStack>
          <Badge label={`${order.progress}%`} tone={order.progress === 100 ? 'success' : 'brand'} />
        </HStack>

        <HStack justify="between" align="center">
          <Text variant="caption" tone="secondary">
            {PROCESSING_STAGE_LABELS[order.stage]} · Hẹn trả{' '}
            {formatDateVn(order.promisedReturnDate)}
          </Text>
          <Text variant="secondary" tone="brand">
            {formatVnd(order.totalPriceVnd)}
          </Text>
        </HStack>

        <Button
          testID={`orders.toggle.${order.id}`}
          label={expanded ? 'Thu gọn chi tiết' : 'Xem tiến độ & Ảnh scan'}
          size="sm"
          variant="outline"
          onPress={() => setExpanded((prev) => !prev)}
        />

        {expanded ? (
          <VStack gap="sm">
            <OrderTimelineSection timeline={order.timeline} />
            {order.scans.length > 0 ? (
              <ScanArchiveSection orderId={order.id} scans={order.scans} />
            ) : null}
            {order.progress === 100 ? <LabReviewSection order={order} /> : null}
          </VStack>
        ) : null}
      </VStack>
    </Card>
  );
}
