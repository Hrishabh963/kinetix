"use client";

/**
 * Trigger subtle native haptic feedback via Capacitor on iOS/Android,
 * falling back to Web Vibration API when available.
 */
export async function triggerHaptic(style: "light" | "medium" = "light"): Promise<void> {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({
        style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light,
      });
      return;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(style === "medium" ? 18 : 10);
    }
  } catch {
    // Ignore on unsupported platforms
  }
}
