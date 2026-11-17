import { Button } from './Button';
import { Card } from './Card';
import { VStack } from './Stack';
import { Text } from './Text';

export type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID: string;
  readonly actionTestID?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  testID,
  actionTestID,
}: EmptyStateProps) {
  return (
    <Card testID={testID} tone="muted">
      <VStack gap="sm" align="center">
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="secondary" tone="muted" className="text-center">
          {description}
        </Text>
        {actionLabel && onAction ? (
          <Button
            testID={actionTestID ?? `${testID}.action`}
            label={actionLabel}
            variant="primary"
            size="sm"
            onPress={onAction}
          />
        ) : null}
      </VStack>
    </Card>
  );
}
