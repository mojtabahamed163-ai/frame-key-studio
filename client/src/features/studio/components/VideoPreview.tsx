import { useEffect, useMemo, useState, type RefObject } from "react";
import { Play } from "lucide-react";
import { faceCenterAt, type FaceKeyframe } from "../media/face-tracking";
import { objectPositionForPortraitCrop } from "../media/framing";
import { mapSourceTimeToExportOutput, resolveOutputPreviewSourceTime } from "../export/timing";
import type { CaptionCue, ClipSuggestion, SpeechRange, StudioSettings } from "../types";

export function VideoPreview({
  src,
  clip,
  cues,
  ranges,
  settings,
  faceKeyframes,
  videoRef,
  currentTime,
  onTimeUpdate,
}: {
  src: string;
  clip: ClipSuggestion | null;
  cues: CaptionCue[];
  ranges: SpeechRange[];
  settings: StudioSettings;
  faceKeyframes: FaceKeyframe[];
  videoRef: RefObject<HTMLVideoElement | null>;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}) {
  const [logoUrl, setLogoUrl] = useState("");
  const [videoSize, setVideoSize] = useState({ src: "", width: 0, height: 0 });
  const localTime = clip ? Math.max(0, currentTime - clip.start) : 0;
  const outputTime = clip ? mapSourceTimeToExportOutput(currentTime - clip.start, ranges) : null;
  const inRemovedGap = Boolean(settings.silenceRemoval && clip && currentTime >= clip.start && currentTime <= clip.end && outputTime == null);
  const center = useMemo(() => settings.smartFraming
    ? faceCenterAt(faceKeyframes, localTime, settings.manualCropX, settings.manualCropY)
    : { x: settings.manualCropX, y: settings.manualCropY }, [settings.smartFraming, settings.manualCropX, settings.manualCropY, faceKeyframes, localTime]);
  const sourceWidth = videoSize.src === src ? videoSize.width : 0;
  const sourceHeight = videoSize.src === src ? videoSize.height : 0;
  const objectPosition = useMemo(
    () => objectPositionForPortraitCrop(sourceWidth, sourceHeight, 9 / 16, center.x, center.y),
    [sourceWidth, sourceHeight, center.x, center.y],
  );
  const activeCue = outputTime == null ? undefined : cues.find((cue) => outputTime >= cue.start && outputTime <= cue.end);
  const activeWordId = outputTime == null ? undefined : activeCue?.words.find((word) => outputTime >= word.start && outputTime <= word.end)?.id;
  const titleText = clip?.selectedTitle?.trim() || clip?.titleOptions[0]?.trim() || "";

  function handleTimeUpdate(sourceTime: number) {
    if (settings.silenceRemoval && clip) {
      const localSourceTime = sourceTime - clip.start;
      if (mapSourceTimeToExportOutput(localSourceTime, ranges) == null) {
        const resolvedLocalTime = resolveOutputPreviewSourceTime(localSourceTime, ranges);
        if (resolvedLocalTime != null) {
          const resolvedSourceTime = clip.start + resolvedLocalTime;
          const video = videoRef.current;
          if (resolvedLocalTime < localSourceTime) video?.pause();
          if (video && Math.abs(video.currentTime - resolvedSourceTime) > 0.01) video.currentTime = resolvedSourceTime;
          onTimeUpdate(resolvedSourceTime);
          return;
        }
      }
    }
    onTimeUpdate(sourceTime);
  }

  const rangeKey = ranges.map((range) => `${range.start}:${range.end}`).join("|");
  useEffect(() => {
    if (settings.silenceRemoval && clip) handleTimeUpdate(currentTime);
  }, [clip?.id, clip?.start, clip?.end, settings.silenceRemoval, rangeKey]);

  useEffect(() => {
    if (!settings.logo) {
      setLogoUrl("");
      return;
    }
    const url = URL.createObjectURL(settings.logo);
    setLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [settings.logo]);

  const framingLabel = settings.framingMode === "full" ? "FULL FRAME" : center.x < 0.48 ? "FRAME LEFT" : center.x > 0.52 ? "FRAME RIGHT" : "CENTER FRAME";

  return (
    <div className="studio-preview-wrap">
      <div className="studio-preview-topline"><span><span className="studio-live-dot" /> LOCAL PREVIEW</span><span>9:16 / PORTRAIT</span></div>
      <div className="studio-preview-frame">
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="metadata"
          className={settings.framingMode === "full" ? "studio-preview-video--full" : undefined}
          onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setVideoSize({ src, width: video.videoWidth, height: video.videoHeight });
            const requestedTime = Number.isFinite(currentTime) ? currentTime : (clip?.start ?? 0);
            const initialTime = Math.max(0, Math.min(video.duration || requestedTime, requestedTime));
            video.currentTime = initialTime;
            handleTimeUpdate(initialTime);
          }}
          style={settings.framingMode === "full" ? undefined : { objectPosition: `${objectPosition.x * 100}% ${objectPosition.y * 100}%` }}
        />
        {logoUrl && <img className={`studio-preview-logo studio-preview-logo--${settings.logoPosition}`} src={logoUrl} alt="" aria-hidden="true" />}
        {settings.showTitleCard && clip && titleText && outputTime != null && outputTime < 2.8 && <div className="studio-preview-title" style={{ backgroundColor: settings.primaryColor, fontFamily: settings.fontFamily }}><span style={{ backgroundColor: settings.accentColor }} /><strong>{titleText}</strong></div>}
        {settings.showCaptions && activeCue && <div className={`studio-preview-caption caption-${settings.captionStyle}`} style={{ backgroundColor: settings.captionStyle === "editorial" ? "transparent" : settings.primaryColor, fontFamily: settings.fontFamily }} aria-live="off">
          {activeCue.words.length ? activeCue.words.map((word) => <span key={word.id} className={word.id === activeWordId ? "is-speaking" : ""} style={word.id === activeWordId ? { color: settings.accentColor } : undefined}>{word.text} </span>) : <span>{activeCue.text}</span>}
        </div>}
        {inRemovedGap && <div className="studio-preview-gap-note">This pause is removed from the export.</div>}
        {!clip && <div className="studio-preview-empty"><span><Play size={20} fill="currentColor" /></span><p>Choose a suggested moment<br />to preview your cut.</p></div>}
        {clip && <div className="studio-preview-clip-label"><span>F&amp;K / CUT</span><strong>{clip.selectedTitle || clip.titleOptions[0] || "Manual clip"}</strong></div>}
      </div>
      <div className="studio-preview-footer"><span>{clip ? `${formatTime(clip.start)} — ${formatTime(clip.end)}` : "Waiting for a clip"}</span><span>{framingLabel}</span></div>
      {settings.silenceRemoval && <div className="studio-preview-silence-note">Preview skips removed pauses; seek positions remain in source time.</div>}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
