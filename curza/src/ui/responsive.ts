// src/ui/responsive.ts
import { Platform, useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // breakpoints (tweak if you like)
  const isSmallPhone = width < 380;
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  // left rail width (replaces hardcoded 210)
  const railW = Math.round(
    Math.min(280, Math.max(180, width * (isDesktop ? 0.18 : 0.24)))
  );

  // general paddings / typography scales
  const pad = isSmallPhone ? 14 : isPhone ? 20 : 28;
  const headingSize = isSmallPhone ? 28 : isPhone ? 36 : isTablet ? 44 : 48;
  const subSize = isSmallPhone ? 16 : isPhone ? 18 : 22;

  // positions that were previously hard-coded
  const labelLeft = Math.round(railW * 0.22); // replaces "left: '4.5%'"
  const swooshLeft = railW + Math.round(width * 0.05); // was '21%' etc.
  const dotLeft = railW + Math.round(width * 0.18);

  return {
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    isDesktop,
    railW,
    pad,
    headingSize,
    subSize,
    labelLeft,
    swooshLeft,
    dotLeft,
  };
}
