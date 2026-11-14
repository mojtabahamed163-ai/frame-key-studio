import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { Play } from "lucide-react";
import { faceCenterAt, type FaceKeyframe } from "../media/face-tracking";
import { objectPositionForPortraitCrop } from "../media/framing";
import { resolveCaptionPosition } from "../media/caption-placement";
import { CAPTION_BACKGROUND } from "../export/convert-clip";
import type { CaptionCue, ClipSuggestion, StudioSettings } from "../types";

export function VideoPreview({
  src,
  clip,
  cues,
  settings,
  faceKeyframes,
  videoRef,
  currentTime,
  onTimeUpdate,
}: {
  src: string;
  clip: ClipSuggestion | null;
  cues: CaptionCue[];
  settings: StudioSettings;
  faceKeyframes: FaceKeyframe[];
  videoRef: RefObject<HTMLVideoElement | null>;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}) {
  const [logoUrl, setLogoUrl] = useState("");
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSize, setVideoSize] = useState({ src: "", width: 0, height: 0 });
  const localTime = clip ? Math.max(0, currentTime - clip.start) : 0;
  const framingMode =
    settings.framingMode === "fill"
      ? "vertical"
      : settings.framingMode === "full"
        ? "fit-background"
        : settings.framingMode;
  const useSmartFraming = framingMode === "smart" || settings.smartFraming;
  const center = useMemo(
    () =>
      useSmartFraming
        ? faceCenterAt(
            faceKeyframes,
            localTime,
            settings.manualCropX,
            settings.manualCropY
          )
        : { x: settings.manualCropX, y: settings.manualCropY },
    [
      useSmartFraming,
      settings.manualCropX,
      settings.manualCropY,
      faceKeyframes,
      localTime,
    ]
  );
  const sourceWidth = videoSize.src === src ? videoSize.width : 0;
  const sourceHeight = videoSize.src === src ? videoSize.height : 0;
  const preferredCaptionPosition = useRef(settings.captionPosition);
  const previousCaptionPosition = useRef(settings.captionPosition);
  const objectPosition = useMemo(
    () =>
      objectPositionForPortraitCrop(
        sourceWidth,
        sourceHeight,
        9 / 16,
        center.x,
        center.y
      ),
    [sourceWidth, sourceHeight, center.x, center.y]
  );
  const activeCue = cues.find(
    cue => currentTime >= cue.start && currentTime <= cue.end
  );
  const activeWordId = activeCue?.words.find(
    word => currentTime >= word.start && currentTime <= word.end
  )?.id;
  const titleText =
    clip?.selectedTitle?.trim() || clip?.titleOptions[0]?.trim() || "";
  const isArabic = Boolean(activeCue && /[\u0600-\u06FF]/.test(activeCue.text));
  if (preferredCaptionPosition.current !== settings.captionPosition) {
    preferredCaptionPosition.current = settings.captionPosition;
    previousCaptionPosition.current = settings.captionPosition;
  }
  const captionPosition = resolveCaptionPosition({
    preferred: settings.captionPosition,
    faceCenter: useSmartFraming ? center : null,
    previousPosition: previousCaptionPosition.current,
  });
  previousCaptionPosition.current = captionPosition;

  function handleTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (!clip) {
      onTimeUpdate(video.currentTime);
      return;
    }
    if (video.currentTime >= clip.end) {
      video.pause();
      video.currentTime = clip.end;
    } else if (video.currentTime < clip.start) {
      video.currentTime = clip.start;
    }
    onTimeUpdate(Math.max(clip.start, Math.min(video.currentTime, clip.end)));
  }

  useEffect(() => {
    const background = backgroundVideoRef.current;
    if (!background || framingMode !== "fit-background") return;
    if (Math.abs(background.currentTime - currentTime) > 0.08)
      background.currentTime = currentTime;
  }, [backgroundVideoRef, currentTime, framingMode]);

  useEffect(() => {
    if (!settings.logo) {
      setLogoUrl("");
      return;
    }
    const url = URL.createObjectURL(settings.logo);
    setLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [settings.logo]);

  return (
    <div className="studio-preview-wrap">
      <div className="studio-preview-topline">
        <span>
          <span className="studio-live-dot" /> LOCAL PREVIEW
        </span>
        <span>{framingMode === "preserve" ? "ORIGINAL FRAME" : "9:16 / PORTRAIT"}</span>
      </div>
      <div className="studio-preview-frame">
        {framingMode === "fit-background" && (
          <video
            ref={backgroundVideoRef}
            className="studio-preview-background"
            src={src}
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        )}
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onPlay={event => {
            if (!clip) return;
            const video = event.currentTarget;
            if (
              video.currentTime >= clip.end ||
              video.currentTime < clip.start
            ) {
              video.currentTime = clip.start;
              onTimeUpdate(clip.start);
            }
          }}
          onLoadedMetadata={event => {
            const video = event.currentTarget;
            setVideoSize({
              src,
              width: video.videoWidth,
              height: video.videoHeight,
            });
            if (clip) video.currentTime = clip.start;
          }}
          style={
            framingMode === "preserve"
              ? { objectFit: "contain", objectPosition: "50% 50%" }
              : framingMode === "fit-background"
                ? { objectFit: "contain" }
                : {
                  objectPosition: `${objectPosition.x * 100}% ${objectPosition.y * 100}%`,
                }
          }
        />
        {logoUrl && (
          <img
            className={`studio-preview-logo studio-preview-logo--${settings.logoPosition}`}
            src={logoUrl}
            alt=""
            aria-hidden="true"
          />
        )}
        {settings.showTitleCard &&
          clip &&
          titleText &&
          currentTime >= clip.start &&
          currentTime < clip.start + 2.8 && (
            <div
              className={`studio-preview-title title-${settings.titleStyle}`}
              style={{
                backgroundColor: settings.primaryColor,
                fontFamily: settings.fontFamily,
              }}
            >
              <span style={{ backgroundColor: settings.accentColor }} />
              <strong>{titleText}</strong>
            </div>
          )}
        {settings.showCaptions && activeCue && (
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className={`studio-preview-caption caption-${settings.captionStyle} caption-position-${captionPosition}${isArabic ? " caption-arabic" : ""}`}
            style={{
              backgroundColor: CAPTION_BACKGROUND,
              fontFamily: settings.fontFamily,
            }}
            aria-live="off"
          >
            {activeCue.words.length ? (
              activeCue.words.map(word => (
                <span
                  key={word.id}
                  className={word.id === activeWordId ? "is-speaking" : ""}
                  style={
                    word.id === activeWordId
                      ? { color: settings.accentColor }
                      : undefined
                  }
                >
                  {word.text}{" "}
                </span>
              ))
            ) : (
              <span>{activeCue.text}</span>
            )}
          </div>
        )}
        {!clip && (
          <div className="studio-preview-empty">
            <span>
              <Play size={20} fill="currentColor" />
            </span>
            <p>
              Choose a suggested moment
              <br />
              to preview your cut.
            </p>
          </div>
        )}
        {clip && (
          <div className="studio-preview-clip-label">
            <span>F&amp;K / CUT</span>
            <strong>
              {clip.selectedTitle || clip.titleOptions[0] || "Manual clip"}
            </strong>
          </div>
        )}
      </div>
      <div className="studio-preview-footer">
        <span>
          {clip
            ? `${formatTime(clip.start)} — ${formatTime(clip.end)}`
            : "Waiting for a clip"}
        </span>
        <span>
          {framingMode === "preserve"
            ? "ORIGINAL FRAME"
            : center.x < 0.48
            ? "FRAME LEFT"
            : center.x > 0.52
              ? "FRAME RIGHT"
              : "CENTER FRAME"}
        </span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}
