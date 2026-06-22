import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Camera,
  Cpu,
  Dumbbell,
  Film,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Leaf,
  Mic,
  Music,
  Palette,
  PawPrint,
  Plane,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  UtensilsCrossed,
  Users,
} from "lucide-react";

/** Ionicons name stored in DB → Lucide preview in admin dashboard. */
export type CategoryIconOption = {
  ionicon: string;
  label: string;
  Icon: LucideIcon;
};

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { ionicon: "grid", label: "All / General", Icon: Star },
  { ionicon: "game-controller", label: "Gaming", Icon: Gamepad2 },
  { ionicon: "color-palette", label: "Arts", Icon: Palette },
  { ionicon: "briefcase", label: "Business", Icon: Briefcase },
  { ionicon: "shirt", label: "Fashion", Icon: Sparkles },
  { ionicon: "football", label: "Sports", Icon: Trophy },
  { ionicon: "musical-notes", label: "Music", Icon: Music },
  { ionicon: "hardware-chip", label: "Technology", Icon: Cpu },
  { ionicon: "restaurant", label: "Food", Icon: UtensilsCrossed },
  { ionicon: "airplane", label: "Travel", Icon: Plane },
  { ionicon: "school", label: "Education", Icon: GraduationCap },
  { ionicon: "fitness", label: "Health", Icon: Heart },
  { ionicon: "barbell", label: "Fitness", Icon: Dumbbell },
  { ionicon: "camera", label: "Photography", Icon: Camera },
  { ionicon: "people", label: "Social", Icon: Users },
  { ionicon: "mic", label: "Talks", Icon: Mic },
  { ionicon: "leaf", label: "Outdoor", Icon: Leaf },
  { ionicon: "film", label: "Film", Icon: Film },
  { ionicon: "flask", label: "Science", Icon: FlaskConical },
  { ionicon: "book", label: "Books", Icon: GraduationCap },
  { ionicon: "home", label: "Family", Icon: Home },
  { ionicon: "paw", label: "Pets", Icon: PawPrint },
  { ionicon: "heart", label: "Charity", Icon: Heart },
  { ionicon: "sparkles", label: "Spirituality", Icon: Sparkles },
  { ionicon: "ticket", label: "Events", Icon: Ticket },
  { ionicon: "bulb", label: "Ideas", Icon: Sparkles },
  { ionicon: "planet", label: "Culture", Icon: Sparkles },
  { ionicon: "megaphone", label: "Community", Icon: Mic },
];

export function getCategoryIconPreview(ionicon?: string | null) {
  const key = String(ionicon || "").trim().toLowerCase();
  return CATEGORY_ICON_OPTIONS.find((item) => item.ionicon === key) ?? null;
}

export function suggestCategoryIcon(name: string) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;

  const direct = CATEGORY_ICON_OPTIONS.find((item) => item.label.toLowerCase() === key);
  if (direct) return direct.ionicon;

  const partial = CATEGORY_ICON_OPTIONS.find((item) => {
    const label = item.label.toLowerCase();
    return key.includes(label) || label.includes(key);
  });
  return partial?.ionicon ?? null;
}
