import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  shouldShowNotification,
} from "./preferences";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("notification preferences", () => {
  it("defaults every in-app category to enabled", () => {
    expect(loadNotificationPreferences(7, memoryStorage())).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("persists preferences separately for each account", () => {
    const storage = memoryStorage();
    saveNotificationPreferences(7, { cve: false, content: true, system: false }, storage);
    saveNotificationPreferences(8, { cve: true, content: false, system: true }, storage);

    expect(loadNotificationPreferences(7, storage)).toEqual({ cve: false, content: true, system: false });
    expect(loadNotificationPreferences(8, storage)).toEqual({ cve: true, content: false, system: true });
  });

  it("falls back safely when stored JSON is malformed", () => {
    const storage = memoryStorage();
    storage.setItem("cyberjocx:notification-preferences:7", "{bad json");
    expect(loadNotificationPreferences(7, storage)).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("filters only the selected in-app category", () => {
    const preferences = { cve: false, content: true, system: false };
    expect(shouldShowNotification("cve", preferences)).toBe(false);
    expect(shouldShowNotification("content", preferences)).toBe(true);
    expect(shouldShowNotification("system", preferences)).toBe(false);
  });
});
