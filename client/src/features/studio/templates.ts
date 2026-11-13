import type { CaptionPosition, CaptionStyle, LogoPosition, StudioSettings, TemplateId, TitleStyle } from "./types";

export type TemplateCategory = "Real Estate" | "Restaurants & Food" | "Education" | "Podcasts & Interviews" | "Marketing & Business";
export interface StudioTemplate {
  id: TemplateId;
  name: string;
  category: TemplateCategory;
  description: string;
  primaryColor: string;
  accentColor: string;
  captionStyle: CaptionStyle;
  captionPosition: CaptionPosition;
  titleStyle: TitleStyle;
  fontFamily: string;
  logoPosition: LogoPosition;
  showTitleCard: boolean;
}
const template = (value: StudioTemplate) => value;
export const STUDIO_TEMPLATES: readonly StudioTemplate[] = [
  template({ id: "estate-hero", name: "Listing Hero", category: "Real Estate", description: "Clean property opener with a strong address banner.", primaryColor: "#173B35", accentColor: "#E2B36B", captionStyle: "clean", captionPosition: "bottom", titleStyle: "banner", fontFamily: "DM Sans, Arial, sans-serif", logoPosition: "top-right", showTitleCard: true }),
  template({ id: "estate-editorial", name: "Editorial Listing", category: "Real Estate", description: "High-end editorial typography for architectural tours.", primaryColor: "#F0E9DA", accentColor: "#B86B45", captionStyle: "editorial", captionPosition: "middle", titleStyle: "minimal", fontFamily: "Georgia, serif", logoPosition: "bottom-left", showTitleCard: true }),
  template({ id: "estate-split", name: "Open House Split", category: "Real Estate", description: "A split accent rail that keeps room details readable.", primaryColor: "#243746", accentColor: "#F08A5D", captionStyle: "bold", captionPosition: "top", titleStyle: "split", fontFamily: "Arial, sans-serif", logoPosition: "top-left", showTitleCard: true }),
  template({ id: "food-menu", name: "Menu Spotlight", category: "Restaurants & Food", description: "Warm menu-card captions for dishes and specials.", primaryColor: "#552B20", accentColor: "#F3C969", captionStyle: "clean", captionPosition: "bottom", titleStyle: "banner", fontFamily: "Georgia, serif", logoPosition: "top-left", showTitleCard: true }),
  template({ id: "food-street", name: "Street Food Pop", category: "Restaurants & Food", description: "Punchy top captions with a playful color block.", primaryColor: "#172A3A", accentColor: "#FF6B35", captionStyle: "bold", captionPosition: "top", titleStyle: "corner", fontFamily: "Trebuchet MS, sans-serif", logoPosition: "top-right", showTitleCard: true }),
  template({ id: "food-editorial", name: "Chef's Table", category: "Restaurants & Food", description: "Quiet serif styling for craft, process and plating.", primaryColor: "#F6F1E8", accentColor: "#7B9E87", captionStyle: "editorial", captionPosition: "middle", titleStyle: "minimal", fontFamily: "Georgia, serif", logoPosition: "bottom-right", showTitleCard: true }),
  template({ id: "edu-notes", name: "Lesson Notes", category: "Education", description: "Structured lesson title with calm, readable captions.", primaryColor: "#16324F", accentColor: "#58A6A6", captionStyle: "clean", captionPosition: "bottom", titleStyle: "split", fontFamily: "Arial, sans-serif", logoPosition: "top-right", showTitleCard: true }),
  template({ id: "edu-highlight", name: "Key Takeaway", category: "Education", description: "High-contrast highlight treatment for key concepts.", primaryColor: "#2D1E4A", accentColor: "#F2C14E", captionStyle: "bold", captionPosition: "middle", titleStyle: "corner", fontFamily: "Trebuchet MS, sans-serif", logoPosition: "bottom-left", showTitleCard: true }),
  template({ id: "edu-whiteboard", name: "Whiteboard", category: "Education", description: "Minimal ink-and-paper layout for explainers.", primaryColor: "#F4F1EA", accentColor: "#D96C4F", captionStyle: "editorial", captionPosition: "top", titleStyle: "minimal", fontFamily: "Georgia, serif", logoPosition: "top-left", showTitleCard: true }),
  template({ id: "podcast-lowerthird", name: "Lower Third", category: "Podcasts & Interviews", description: "Conversation-first lower third with speaker emphasis.", primaryColor: "#101820", accentColor: "#FEE715", captionStyle: "bold", captionPosition: "bottom", titleStyle: "banner", fontFamily: "Arial, sans-serif", logoPosition: "top-left", showTitleCard: true }),
  template({ id: "podcast-wave", name: "Waveform", category: "Podcasts & Interviews", description: "Centered editorial treatment for memorable answers.", primaryColor: "#241B4B", accentColor: "#A7F3D0", captionStyle: "clean", captionPosition: "middle", titleStyle: "split", fontFamily: "DM Sans, Arial, sans-serif", logoPosition: "top-right", showTitleCard: true }),
  template({ id: "podcast-bold", name: "Hot Seat", category: "Podcasts & Interviews", description: "Fast, oversized captions for sharp interview clips.", primaryColor: "#331832", accentColor: "#F46036", captionStyle: "bold", captionPosition: "top", titleStyle: "corner", fontFamily: "Trebuchet MS, sans-serif", logoPosition: "bottom-right", showTitleCard: true }),
  template({ id: "marketing-launch", name: "Launch Card", category: "Marketing & Business", description: "Product-forward title card with a strong callout rail.", primaryColor: "#0B132B", accentColor: "#5BC0BE", captionStyle: "clean", captionPosition: "bottom", titleStyle: "split", fontFamily: "DM Sans, Arial, sans-serif", logoPosition: "top-right", showTitleCard: true }),
  template({ id: "marketing-social", name: "Social Proof", category: "Marketing & Business", description: "Bright corner label for testimonials and proof points.", primaryColor: "#3A0CA3", accentColor: "#F72585", captionStyle: "bold", captionPosition: "middle", titleStyle: "corner", fontFamily: "Arial, sans-serif", logoPosition: "bottom-left", showTitleCard: true }),
  template({ id: "marketing-report", name: "Boardroom Brief", category: "Marketing & Business", description: "Restrained report layout for data and executive updates.", primaryColor: "#E9F5DB", accentColor: "#31572C", captionStyle: "editorial", captionPosition: "top", titleStyle: "minimal", fontFamily: "Georgia, serif", logoPosition: "bottom-right", showTitleCard: true }),
];
export function applyTemplate(template: StudioTemplate, current: StudioSettings): StudioSettings {
  return { ...current, templateId: template.id, primaryColor: template.primaryColor, accentColor: template.accentColor, captionStyle: template.captionStyle, captionPosition: template.captionPosition, titleStyle: template.titleStyle, fontFamily: template.fontFamily, logoPosition: template.logoPosition, showTitleCard: template.showTitleCard };
}
