import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { VStack } from './Stack';
import { Text } from './Text';

export type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly icon?: ReactNode;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID: string;
  readonly actionTestID?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  testID,
  actionTestID,
}: EmptyStateProps) {
  return (
    <Card testID={testID} tone="muted">
      <VStack gap="md" align="center" className="py-3">
        {icon ? <View className="items-center justify-center">{icon}</View> : null}
        <VStack gap="xs" align="center">
          <Text variant="heading" accessibilityRole="header" className="text-center">
            {title}
          </Text>
          <Text variant="secondary" tone="muted" className="text-center px-4">
            {description}
          </Text>
        </VStack>
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
