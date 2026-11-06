export type NotificationCategory = "cve" | "content" | "system";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  cve: true,
  content: true,
  system: true,
};

export const NOTIFICATION_PREFERENCES_UPDATED_EVENT = "cyberjocx:notification-preferences-updated";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function preferenceKey(userId?: number) {
  return `cyberjocx:notification-preferences:${userId ?? "guest"}`;
}

export function loadNotificationPreferences(
  userId?: number,
  storage?: StorageLike,
): NotificationPreferences {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!target) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  try {
    const value = target.getItem(preferenceKey(userId));
    if (!value) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;
    return {
      cve: typeof parsed.cve === "boolean" ? parsed.cve : true,
      content: typeof parsed.content === "boolean" ? parsed.content : true,
      system: typeof parsed.system === "boolean" ? parsed.system : true,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(
  userId: number | undefined,
  preferences: NotificationPreferences,
  storage?: StorageLike,
): void {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  target?.setItem(preferenceKey(userId), JSON.stringify(preferences));

  if (typeof window !== "undefined" && !storage) {
    window.dispatchEvent(new Event(NOTIFICATION_PREFERENCES_UPDATED_EVENT));
  }
}

export function shouldShowNotification(
  category: NotificationCategory,
  preferences: NotificationPreferences,
): boolean {
  return preferences[category];
}
