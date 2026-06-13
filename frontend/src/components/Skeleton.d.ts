import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export const SkeletonPiece: ComponentType<{
  width: number | string;
  height: number;
  style?: StyleProp<ViewStyle>;
}>;

declare const Skeleton: ComponentType<{
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}>;

export default Skeleton;
