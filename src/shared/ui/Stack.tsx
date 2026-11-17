import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/shared/lib';

const gapClass = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

const alignClass = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;

const justifyClass = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

export type StackProps = {
  readonly children: ReactNode;
  readonly gap?: keyof typeof gapClass;
  readonly align?: keyof typeof alignClass;
  readonly justify?: keyof typeof justifyClass;
  readonly className?: string;
  readonly testID?: string;
};

function stackClass(direction: string, props: StackProps): string {
  const { gap = 'md', align = 'stretch', justify = 'start', className } = props;
  return cn(direction, gapClass[gap], alignClass[align], justifyClass[justify], className);
}

export function VStack(props: StackProps) {
  return (
    <View testID={props.testID} className={stackClass('flex-col', props)}>
      {props.children}
    </View>
  );
}

export function HStack(props: StackProps) {
  return (
    <View testID={props.testID} className={stackClass('flex-row', props)}>
      {props.children}
    </View>
  );
}
