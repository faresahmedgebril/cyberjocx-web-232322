import { describe, expect, it } from "vitest";
import { isMobileNavigationViewport, MOBILE_NAV_BREAKPOINT } from "./navigation";

describe("dashboard navigation breakpoint", () => {
  it("uses the mobile drawer at and below the breakpoint", () => {
    expect(isMobileNavigationViewport(MOBILE_NAV_BREAKPOINT)).toBe(true);
    expect(isMobileNavigationViewport(390)).toBe(true);
  });

  it("keeps the desktop collapse control above the breakpoint", () => {
    expect(isMobileNavigationViewport(MOBILE_NAV_BREAKPOINT + 1)).toBe(false);
    expect(isMobileNavigationViewport(1280)).toBe(false);
  });

  it("rejects invalid viewport widths", () => {
    expect(isMobileNavigationViewport(Number.NaN)).toBe(false);
  });
});
