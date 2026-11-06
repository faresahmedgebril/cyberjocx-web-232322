export const MOBILE_NAV_BREAKPOINT = 760;

export function isMobileNavigationViewport(width: number): boolean {
  return Number.isFinite(width) && width <= MOBILE_NAV_BREAKPOINT;
}
