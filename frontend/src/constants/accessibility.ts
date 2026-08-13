export const ACCESSIBILITY_MODE_STORAGE_KEY = "riquisimo.modoAccesible";
export const ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY = "riquisimo.tamanoTexto";
export const ACCESSIBILITY_CONTRAST_STORAGE_KEY = "riquisimo.contraste";
export const ACCESSIBILITY_VOICE_STORAGE_KEY = "riquisimo.voz";
export const ACCESSIBILITY_SOUND_STORAGE_KEY = "riquisimo.sonidos";
export const ACCESSIBILITY_SOUND_VOLUME_STORAGE_KEY = "riquisimo.volumenSonidos";

export const ACCESSIBILITY_TEXT_SIZES = ["small", "normal", "large"] as const;

export type AccessibilityTextSize = (typeof ACCESSIBILITY_TEXT_SIZES)[number];

export const SOUND_VOLUME_LEVELS = ["soft", "normal", "loud"] as const;
export type SoundVolumeLevel = (typeof SOUND_VOLUME_LEVELS)[number];
export const DEFAULT_SOUND_VOLUME: SoundVolumeLevel = "loud";
