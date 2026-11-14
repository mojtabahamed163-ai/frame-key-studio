import { Palette } from "lucide-react";
import {
  ACTIVE_CAPTION_COLOR_PRESETS,
  clampCaptionStrokeWidth,
  safeCaptionColor,
} from "../media/caption-appearance";
import type { StudioSettings } from "../types";

export function CaptionAppearanceControls({
  settings,
  onChange,
}: {
  settings: StudioSettings;
  onChange: (patch: Partial<StudioSettings>) => void;
}) {
  const textColor = safeCaptionColor(settings.captionTextColor, "#FFFFFF");
  const activeColor = safeCaptionColor(settings.captionActiveColor, "#39D353");
  const strokeColor = safeCaptionColor(settings.captionStrokeColor, "#000000");
  const strokeWidth = clampCaptionStrokeWidth(settings.captionStrokeWidth);

  return (
    <div
      className="caption-appearance-panel"
      aria-label="Caption appearance settings"
    >
      <div className="caption-appearance-heading">
        <Palette size={15} />
        <div>
          <strong>Word captions</strong>
          <small>
            Whisper timing drives the active-word highlight in preview and
            export.
          </small>
        </div>
      </div>
      <div className="caption-appearance-grid">
        <label className="studio-field">
          Base text color
          <span className="caption-color-control">
            <input
              type="color"
              aria-label="Caption base text color"
              value={textColor}
              onChange={event =>
                onChange({ captionTextColor: event.target.value.toUpperCase() })
              }
            />
            <code>{textColor}</code>
          </span>
        </label>
        <label className="studio-field">
          Stroke color
          <span className="caption-color-control">
            <input
              type="color"
              aria-label="Caption stroke color"
              value={strokeColor}
              onChange={event =>
                onChange({
                  captionStrokeColor: event.target.value.toUpperCase(),
                })
              }
            />
            <code>{strokeColor}</code>
          </span>
        </label>
        <label className="studio-field caption-stroke-field">
          Stroke width
          <span className="caption-range-control">
            <input
              type="range"
              aria-label="Caption stroke width"
              min="0"
              max="10"
              step="0.5"
              value={strokeWidth}
              onChange={event =>
                onChange({ captionStrokeWidth: Number(event.target.value) })
              }
            />
            <output>{strokeWidth.toFixed(1)} px</output>
          </span>
        </label>
      </div>
      <div className="caption-active-control">
        <div>
          <span className="caption-control-label">Active word color</span>
          <small>Presets or choose a custom color.</small>
        </div>
        <div
          className="caption-color-presets"
          role="group"
          aria-label="Active word color presets"
        >
          {ACTIVE_CAPTION_COLOR_PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              className={`caption-color-swatch${activeColor === preset.value ? " is-selected" : ""}`}
              style={{ backgroundColor: preset.value }}
              aria-label={`${preset.label} active word color`}
              aria-pressed={activeColor === preset.value}
              onClick={() => onChange({ captionActiveColor: preset.value })}
            />
          ))}
          <label className="caption-custom-color">
            <span>Custom</span>
            <input
              type="color"
              aria-label="Custom active word color"
              value={activeColor}
              onChange={event =>
                onChange({
                  captionActiveColor: event.target.value.toUpperCase(),
                })
              }
            />
            <code>{activeColor}</code>
          </label>
        </div>
      </div>
    </div>
  );
}
