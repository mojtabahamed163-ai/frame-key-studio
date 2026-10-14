export interface TranscriptWord {
  id: string;
  text: string;
  start: number;
  end: number;
  score?: number;
}

export interface SpeechRange { start: number; end: number }
export interface CropKeyframe { time: number; x: number; y: number; confidence: number; framingSafe?: boolean }

export interface CaptionCue {
  id: string;
  start: number;
  end: number;
  text: string;
  words: TranscriptWord[];
}

export interface ClipSuggestion {
  id: string;
  start: number;
  end: number;
  score: number;
  quality?: "reliable" | "review";
  qualityWarning?: string;
  reasons: string[];
  transcript: string;
  hookOptions: string[];
  hookStartOptions?: number[];
  selectedHook?: string;
  titleOptions: string[];
  selectedTitle?: string;
  description: string;
  editedDescription?: string;
  hashtags: string[];
  editedHashtags?: string;
  callsToAction: string[];
  selectedCallToAction?: string;
}

export type CaptionStyle = "clean" | "bold" | "editorial";
export type CaptionMode = "word" | "block";
export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type OutputPlatform = "generic" | "tiktok" | "instagram-reels" | "youtube-shorts";
export type StepId = "upload" | "select" | "edit" | "export";

export interface BrandSettings {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  captionStyle: CaptionStyle;
  fontFamily: string;
  logoPosition: LogoPosition;
  logo?: Blob;
}

export interface StudioSettings extends BrandSettings {
  captionMode: CaptionMode;
  silenceRemoval: boolean;
  silenceThresholdSeconds: number;
  peakNormalize: boolean;
  smartFraming: boolean;
  manualCropX: number;
  manualCropY: number;
  showCaptions: boolean;
  showTitleCard: boolean;
  outputHeight: 1280 | 1920;
  outputPlatform: OutputPlatform;
  targetLanguage: "none" | "fr" | "es" | "de";
}

export interface StudioProject {
  id: string;
  name: string;
  sourceFileName: string;
  sourceSize: number;
  sourceLastModified: number;
  duration: number;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  step: StepId;
  words: TranscriptWord[];
  editedCues: CaptionCue[];
  translatedCues: CaptionCue[];
  translatedLanguage: "none" | "fr" | "es" | "de";
  sourceLanguage: string;
  clips: ClipSuggestion[];
  selectedClipId: string | null;
  faceKeyframesByClip: Record<string, CropKeyframe[]>;
  settings: StudioSettings;
  sourceSavedInOpfs: boolean;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
  videoCodec?: string;
  audioCodec?: string;
}

export const DEFAULT_SETTINGS: StudioSettings = {
  brandName: "Frame & Key",
  primaryColor: "#203A31",
  accentColor: "#C9794B",
  captionStyle: "clean",
  captionMode: "block",
  fontFamily: "DM Sans, Arial, sans-serif",
  logoPosition: "bottom-right",
  silenceRemoval: false,
  silenceThresholdSeconds: 1.2,
  peakNormalize: false,
  smartFraming: false,
  manualCropX: 0.5,
  manualCropY: 0.5,
  showCaptions: true,
  showTitleCard: false,
  outputHeight: 1920,
  outputPlatform: "generic",
  targetLanguage: "none",
};
