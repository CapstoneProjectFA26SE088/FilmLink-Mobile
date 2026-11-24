import type { FilmStockResponse, PublicFilmLabResponse, PublicServicePackage } from '@/shared/api';
import { formatVnd } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  FilterChipGroup,
  HStack,
  Icon,
  Input,
  Text,
  VStack,
} from '@/shared/ui';
import {
  clampExposureCount,
  clampPushPullStops,
  clampShootingIso,
  type LiveBookingRollDraft,
  resolveRollPackage,
  resolveScanOptionId,
} from '../model/services';

const ISO_PRESETS = ['100', '200', '400', '800', '1600', '3200'] as const;

function FilmStockSelectorSection({
  stocks,
  selectedStockId,
  customStockName,
  onChangeCustomStock,
  onSelectCatalogStock,
}: {
  readonly stocks: readonly FilmStockResponse[];
  readonly selectedStockId: number | null;
  readonly customStockName: string;
  readonly onChangeCustomStock: (text: string) => void;
  readonly onSelectCatalogStock: (stockId: number) => void;
}) {
  return (
    <VStack gap="sm">
      <Input
        testID="services.booking.film-stock"
        label="Dòng phim (chọn danh mục hoặc nhập tự do)"
        value={customStockName}
        onChangeText={onChangeCustomStock}
        placeholder="Kodak Portra 400"
        icon={<Icon name="camera-outline" size="sm" tone="muted" />}
      />
      {selectedStockId !== null ? (
        <Badge label={`Đã chọn dòng phim danh mục #${selectedStockId}`} tone="brand" />
      ) : null}
      {stocks.length > 0 ? (
        <FilterChipGroup
          testIDPrefix="services.booking.stock"
          label="Danh mục phim phổ biến"
          options={stocks.map((stock) => ({
            value: String(stock.id),
            label: `${stock.stockName} (${stock.iso})`,
          }))}
          value={selectedStockId !== null ? String(selectedStockId) : ''}
          onChange={(val) => onSelectCatalogStock(Number(val))}
          scrollable
        />
      ) : null}
    </VStack>
  );
}

function RollQuantitySummaryBar({
  rolls,
  activeIndex,
  selectedLab,
  fallbackPackage,
  canAdd,
  onAddRoll,
  onSelectRoll,
  onDuplicateRoll,
  onRemoveRoll,
}: {
  readonly rolls: readonly LiveBookingRollDraft[];
  readonly activeIndex: number;
  readonly selectedLab: PublicFilmLabResponse;
  readonly fallbackPackage: PublicServicePackage;
  readonly canAdd: boolean;
  readonly onAddRoll: () => void;
  readonly onSelectRoll: (index: number) => void;
  readonly onDuplicateRoll: (index: number) => void;
  readonly onRemoveRoll: (index: number) => void;
}) {
  return (
    <VStack gap="sm">
      <HStack justify="between" align="center">
        <VStack gap="none">
          <Text variant="heading">Danh sách cuộn phim ({rolls.length}/20)</Text>
          <Text variant="caption" tone="muted">
            Mỗi cuộn có thể chọn gói dịch vụ & thông số riêng
          </Text>
        </VStack>
        <Button
          testID="services.booking.roll-add"
          label="+ Thêm cuộn"
          size="sm"
          variant="secondary"
          disabled={!canAdd}
          onPress={onAddRoll}
        />
      </HStack>

      {rolls.map((roll, idx) => {
        const pkg = resolveRollPackage(selectedLab, roll.servicePackageId, fallbackPackage);
        const stockText =
          roll.filmStockId !== null
            ? `Danh mục #${roll.filmStockId}`
            : roll.filmStockNameText.trim() || 'Chưa chọn phim';
        const isActive = idx === activeIndex;
        return (
          <Card key={roll.id} tone={isActive ? 'brand' : 'muted'} className="p-3">
            <VStack gap="xs">
              <HStack justify="between" align="center" gap="xs">
                <VStack gap="none" className="flex-1">
                  <Text variant="secondary">
                    Cuộn #{idx + 1} · {stockText}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {pkg?.packageName ?? 'Chưa chọn gói'} · {roll.exposureCount} kiểu · ISO{' '}
                    {roll.shootingIso}
                  </Text>
                </VStack>
                <Badge
                  label={isActive ? 'Đang sửa' : `#${idx + 1}`}
                  tone={isActive ? 'brand' : 'neutral'}
                />
              </HStack>
              <HStack gap="xs">
                {!isActive ? (
                  <Button
                    testID={`services.booking.roll-select.${idx}`}
                    label="Chỉnh sửa"
                    size="sm"
                    variant="outline"
                    onPress={() => onSelectRoll(idx)}
                  />
                ) : null}
                <Button
                  testID={`services.booking.roll-duplicate.${idx}`}
                  label="Nhân bản"
                  size="sm"
                  variant="ghost"
                  disabled={!canAdd}
                  onPress={() => onDuplicateRoll(idx)}
                />
                {rolls.length > 1 ? (
                  <Button
                    testID={`services.booking.roll-remove.${idx}`}
                    label="Xóa"
                    size="sm"
                    variant="ghost"
                    onPress={() => onRemoveRoll(idx)}
                  />
                ) : null}
              </HStack>
            </VStack>
          </Card>
        );
      })}
    </VStack>
  );
}

export function BookingRollEditorCard({
  rolls,
  activeIndex,
  selectedLab,
  fallbackPackage,
  stocks,
  onChangeStockSearch,
  onAddRoll,
  onSelectRoll,
  onDuplicateRoll,
  onRemoveRoll,
  onUpdateRoll,
}: {
  readonly rolls: readonly LiveBookingRollDraft[];
  readonly activeIndex: number;
  readonly selectedLab: PublicFilmLabResponse;
  readonly fallbackPackage: PublicServicePackage;
  readonly stocks: readonly FilmStockResponse[];
  readonly onChangeStockSearch: (text: string) => void;
  readonly onAddRoll: () => void;
  readonly onSelectRoll: (index: number) => void;
  readonly onDuplicateRoll: (index: number) => void;
  readonly onRemoveRoll: (index: number) => void;
  readonly onUpdateRoll: (
    index: number,
    updater: (roll: LiveBookingRollDraft) => LiveBookingRollDraft,
  ) => void;
}) {
  const safeIndex = Math.min(Math.max(0, activeIndex), rolls.length - 1);
  const activeRoll = rolls[safeIndex];
  if (!activeRoll) {
    return null;
  }
  const activePackage =
    resolveRollPackage(selectedLab, activeRoll.servicePackageId, fallbackPackage) ??
    fallbackPackage;
  const effectiveScanOptionId = resolveScanOptionId(activePackage, activeRoll.scanOptionId);
  const effectiveStops = activePackage.pushPullAvailable ? activeRoll.pushPullStops : 0;

  return (
    <Card>
      <VStack gap="md">
        <RollQuantitySummaryBar
          rolls={rolls}
          activeIndex={safeIndex}
          selectedLab={selectedLab}
          fallbackPackage={fallbackPackage}
          canAdd={rolls.length < 20}
          onAddRoll={onAddRoll}
          onSelectRoll={onSelectRoll}
          onDuplicateRoll={onDuplicateRoll}
          onRemoveRoll={onRemoveRoll}
        />

        <Text variant="heading">Thông số Cuộn #{safeIndex + 1}</Text>

        {selectedLab.packages.length > 0 ? (
          <FilterChipGroup
            testIDPrefix="services.booking.package"
            label="Gói dịch vụ cho cuộn này"
            options={selectedLab.packages.map((pkg) => ({
              value: String(pkg.id),
              label: `${pkg.packageName} (${formatVnd(pkg.priceVnd)})`,
            }))}
            value={String(activePackage.id)}
            onChange={(val) => {
              const nextPkgId = Number(val);
              const nextPkg = selectedLab.packages.find((p) => p.id === nextPkgId);
              onUpdateRoll(safeIndex, (roll) => ({
                ...roll,
                servicePackageId: nextPkgId,
                scanOptionId: null,
                pushPullStops: nextPkg?.pushPullAvailable ? roll.pushPullStops : 0,
              }));
            }}
            scrollable
          />
        ) : null}

        <FilmStockSelectorSection
          stocks={stocks}
          selectedStockId={activeRoll.filmStockId}
          customStockName={activeRoll.filmStockNameText}
          onChangeCustomStock={(text) => {
            onChangeStockSearch(text);
            onUpdateRoll(safeIndex, (roll) => ({
              ...roll,
              filmStockId: null,
              filmStockNameText: text,
            }));
          }}
          onSelectCatalogStock={(stockId) => {
            onUpdateRoll(safeIndex, (roll) => ({
              ...roll,
              filmStockId: stockId,
              filmStockNameText: '',
            }));
          }}
        />

        {activePackage.scanOptions.length > 0 ? (
          <FilterChipGroup
            testIDPrefix="services.booking.scan"
            label="Tùy chọn độ phân giải Scan"
            options={[
              { value: 'NONE', label: 'Mặc định gói' },
              ...activePackage.scanOptions.map((opt) => ({
                value: String(opt.id),
                label: `${opt.resolutionLabel} (${opt.priceVnd === 0 ? 'Miễn phí' : formatVnd(opt.priceVnd)})`,
              })),
            ]}
            value={effectiveScanOptionId !== null ? String(effectiveScanOptionId) : 'NONE'}
            onChange={(val) =>
              onUpdateRoll(safeIndex, (roll) => ({
                ...roll,
                scanOptionId: val === 'NONE' ? null : Number(val),
              }))
            }
            scrollable
          />
        ) : null}

        <HStack justify="between" align="center" className="py-1">
          <VStack gap="none">
            <Text variant="secondary">Số kiểu chụp / cuộn</Text>
            <Text variant="caption" tone="muted">
              Từ 1 đến 40 kiểu
            </Text>
          </VStack>
          <HStack gap="sm" align="center">
            <Button
              testID="services.booking.exposures-dec"
              label="-"
              size="sm"
              variant="outline"
              className="w-11"
              onPress={() =>
                onUpdateRoll(safeIndex, (roll) => ({
                  ...roll,
                  exposureCount: clampExposureCount(roll.exposureCount, -1),
                }))
              }
            />
            <Text variant="heading" className="w-8 text-center">
              {activeRoll.exposureCount}
            </Text>
            <Button
              testID="services.booking.exposures-inc"
              label="+"
              size="sm"
              variant="outline"
              className="w-11"
              onPress={() =>
                onUpdateRoll(safeIndex, (roll) => ({
                  ...roll,
                  exposureCount: clampExposureCount(roll.exposureCount, 1),
                }))
              }
            />
          </HStack>
        </HStack>

        <FilterChipGroup
          testIDPrefix="services.booking.iso"
          label="Độ nhạy sáng khi chụp (Shooting ISO)"
          options={ISO_PRESETS.map((iso) => ({ value: iso, label: `ISO ${iso}` }))}
          value={String(activeRoll.shootingIso)}
          onChange={(iso) =>
            onUpdateRoll(safeIndex, (roll) => ({
              ...roll,
              shootingIso: clampShootingIso(Number(iso)),
            }))
          }
          scrollable
        />

        <HStack justify="between" align="center" className="py-1">
          <VStack gap="none" className="flex-1 pr-2">
            <Text variant="secondary">Push / Pull (Stops)</Text>
            <Text variant="caption" tone="muted">
              {activePackage.pushPullAvailable
                ? `+${formatVnd(activePackage.pushPullSurchargePerStopVnd ?? 0)} / stop / cuộn`
                : 'Gói này không hỗ trợ Push / Pull'}
            </Text>
          </VStack>
          <HStack gap="sm" align="center">
            <Button
              testID="services.booking.stops-dec"
              label="-"
              size="sm"
              variant="outline"
              className="w-11"
              disabled={!activePackage.pushPullAvailable}
              onPress={() =>
                onUpdateRoll(safeIndex, (roll) => ({
                  ...roll,
                  pushPullStops: clampPushPullStops(roll.pushPullStops, -1),
                }))
              }
            />
            <Text variant="heading" className="w-8 text-center">
              {effectiveStops > 0 ? `+${effectiveStops}` : effectiveStops}
            </Text>
            <Button
              testID="services.booking.stops-inc"
              label="+"
              size="sm"
              variant="outline"
              className="w-11"
              disabled={!activePackage.pushPullAvailable}
              onPress={() =>
                onUpdateRoll(safeIndex, (roll) => ({
                  ...roll,
                  pushPullStops: clampPushPullStops(roll.pushPullStops, 1),
                }))
              }
            />
          </HStack>
        </HStack>
      </VStack>
    </Card>
  );
}
