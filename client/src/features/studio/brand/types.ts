import type { BrandSettings, CaptionStyle, LogoPosition } from "../types";

export type BrandKit = BrandSettings & {
  id: string;
  name: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  captionFontSize: number;
  captionWeight: number;
  captionAlign: "left" | "center" | "right";
  captionLineHeight: number;
  captionShadow: boolean;
  captionPosition: "top" | "center" | "bottom";
  createdAt: number;
  updatedAt: number;
};

export type TemplateCategory = "Real Estate" | "Restaurants" | "Podcast" | "Education" | "Marketing";
export type TemplateLayout = "corner" | "split" | "lower-third" | "minimal" | "badge";

export type VideoTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  layout: TemplateLayout;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  captionStyle: CaptionStyle;
  logoPosition: LogoPosition;
  showTitleCard: boolean;
  showCaptions: boolean;
  custom?: boolean;
  createdAt?: number;
};

export const TEMPLATE_CATALOG: VideoTemplate[] = [
  { id: "property-showcase", name: "Property Showcase", category: "Real Estate", description: "Elegant listing highlights with a premium address card.", layout: "corner", primaryColor: "#17352d", secondaryColor: "#f5efe5", accentColor: "#d08a57", backgroundColor: "#17352d", textColor: "#fffaf0", fontFamily: "Georgia, serif", captionStyle: "editorial", logoPosition: "top-right", showTitleCard: true, showCaptions: true },
  { id: "house-tour", name: "House Tour", category: "Real Estate", description: "Warm, guided-room captions for a flowing home walkthrough.", layout: "lower-third", primaryColor: "#4f382c", secondaryColor: "#efe0cc", accentColor: "#d7a06d", backgroundColor: "#4f382c", textColor: "#fff7ed", fontFamily: "Trebuchet MS, sans-serif", captionStyle: "clean", logoPosition: "bottom-left", showTitleCard: true, showCaptions: true },
  { id: "property-advertisement", name: "Property Advertisement", category: "Real Estate", description: "High-contrast offer framing for a decisive property ad.", layout: "badge", primaryColor: "#102b3a", secondaryColor: "#dceaf0", accentColor: "#f2b84b", backgroundColor: "#102b3a", textColor: "#ffffff", fontFamily: "Arial, sans-serif", captionStyle: "bold", logoPosition: "top-left", showTitleCard: true, showCaptions: true },
  { id: "food-showcase", name: "Food Showcase", category: "Restaurants", description: "Appetite-led typography with a bright ingredient accent.", layout: "minimal", primaryColor: "#4a1f1c", secondaryColor: "#fff1df", accentColor: "#f3a33b", backgroundColor: "#4a1f1c", textColor: "#fff8ed", fontFamily: "Georgia, serif", captionStyle: "editorial", logoPosition: "top-left", showTitleCard: true, showCaptions: true },
  { id: "restaurant-promotion", name: "Restaurant Promotion", category: "Restaurants", description: "Punchy promotional frame for opening nights and specials.", layout: "split", primaryColor: "#292018", secondaryColor: "#f4dfbd", accentColor: "#e95d3f", backgroundColor: "#292018", textColor: "#fff9ef", fontFamily: "Arial, sans-serif", captionStyle: "bold", logoPosition: "top-right", showTitleCard: true, showCaptions: true },
  { id: "menu-highlight", name: "Menu Highlight", category: "Restaurants", description: "Menu-ready dish name and price treatment with a clean badge.", layout: "badge", primaryColor: "#f7efe4", secondaryColor: "#2d2520", accentColor: "#bc633d", backgroundColor: "#f7efe4", textColor: "#2d2520", fontFamily: "Trebuchet MS, sans-serif", captionStyle: "clean", logoPosition: "bottom-right", showTitleCard: true, showCaptions: true },
  { id: "podcast-interview", name: "Podcast Interview", category: "Podcast", description: "Studio lower-third for guest names and key soundbites.", layout: "lower-third", primaryColor: "#181c2b", secondaryColor: "#dfe4ff", accentColor: "#8b7cff", backgroundColor: "#181c2b", textColor: "#ffffff", fontFamily: "Arial, sans-serif", captionStyle: "bold", logoPosition: "top-left", showTitleCard: true, showCaptions: true },
  { id: "talking-head", name: "Talking Head", category: "Podcast", description: "Minimal speaker-first captions that keep the face central.", layout: "minimal", primaryColor: "#202526", secondaryColor: "#e9f1ec", accentColor: "#7bd6b2", backgroundColor: "#202526", textColor: "#ffffff", fontFamily: "DM Sans, Arial, sans-serif", captionStyle: "clean", logoPosition: "bottom-right", showTitleCard: false, showCaptions: true },
  { id: "two-person-conversation", name: "Two-Person Conversation", category: "Podcast", description: "Balanced split treatment for dialogue and reactions.", layout: "split", primaryColor: "#2c2338", secondaryColor: "#f0e8ff", accentColor: "#ef9ad4", backgroundColor: "#2c2338", textColor: "#ffffff", fontFamily: "Trebuchet MS, sans-serif", captionStyle: "editorial", logoPosition: "top-right", showTitleCard: true, showCaptions: true },
  { id: "quick-lesson", name: "Quick Lesson", category: "Education", description: "Numbered lesson card with crisp, readable learning cues.", layout: "corner", primaryColor: "#153a46", secondaryColor: "#e2f5f4", accentColor: "#54c7c1", backgroundColor: "#153a46", textColor: "#ffffff", fontFamily: "Arial, sans-serif", captionStyle: "clean", logoPosition: "top-right", showTitleCard: true, showCaptions: true },
  { id: "educational-tips", name: "Educational Tips", category: "Education", description: "Friendly checklist styling for quick practical advice.", layout: "badge", primaryColor: "#273a27", secondaryColor: "#ecf3df", accentColor: "#b9d66d", backgroundColor: "#273a27", textColor: "#ffffff", fontFamily: "Trebuchet MS, sans-serif", captionStyle: "bold", logoPosition: "bottom-left", showTitleCard: true, showCaptions: true },
  { id: "explainer", name: "Explainer", category: "Education", description: "Editorial explainer layout with a strong idea headline.", layout: "split", primaryColor: "#202d42", secondaryColor: "#e7eef8", accentColor: "#6ca5f2", backgroundColor: "#202d42", textColor: "#ffffff", fontFamily: "Georgia, serif", captionStyle: "editorial", logoPosition: "top-left", showTitleCard: true, showCaptions: true },
  { id: "product-advertisement", name: "Product Advertisement", category: "Marketing", description: "Product-first launch frame with a bold callout strip.", layout: "corner", primaryColor: "#24172e", secondaryColor: "#f4e7ff", accentColor: "#d884ff", backgroundColor: "#24172e", textColor: "#ffffff", fontFamily: "Arial, sans-serif", captionStyle: "bold", logoPosition: "top-right", showTitleCard: true, showCaptions: true },
  { id: "promotional-offer", name: "Promotional Offer", category: "Marketing", description: "Urgent offer badge with high-energy contrast and price focus.", layout: "badge", primaryColor: "#501d22", secondaryColor: "#ffe7dc", accentColor: "#ffb84d", backgroundColor: "#501d22", textColor: "#ffffff", fontFamily: "Trebuchet MS, sans-serif", captionStyle: "bold", logoPosition: "top-left", showTitleCard: true, showCaptions: true },
  { id: "service-advertisement", name: "Service Advertisement", category: "Marketing", description: "Trust-forward service story with a calm branded lower third.", layout: "lower-third", primaryColor: "#18352f", secondaryColor: "#e0f0e8", accentColor: "#7ec7a6", backgroundColor: "#18352f", textColor: "#ffffff", fontFamily: "DM Sans, Arial, sans-serif", captionStyle: "clean", logoPosition: "bottom-right", showTitleCard: true, showCaptions: true },
];

export function makeBrandKit(settings: BrandSettings & Partial<BrandKit>, name: string): BrandKit {
  const now = Date.now();
  return { id: crypto.randomUUID(), name: name.trim() || "Untitled Brand Kit", secondaryColor: "#F5EFE5", textColor: "#FFFFFF", backgroundColor: "#203A31", captionFontSize: 100, captionWeight: 700, captionAlign: "center", captionLineHeight: 1.22, captionShadow: true, captionPosition: "bottom", createdAt: now, updatedAt: now, ...settings };
}
