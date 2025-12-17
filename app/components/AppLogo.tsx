import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const logoSource = require('@/assets/logo.png');

type AppLogoProps = {
  size?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
};

export default function AppLogo({
  size = 120,
  className,
  style,
}: AppLogoProps) {
  return (
    <Image
      source={logoSource}
      style={[{ width: size, height: size }, style]}
      className={className}
      resizeMode="contain"
      accessible
      accessibilityLabel="MeaLogger logo"
    />
  );
}
