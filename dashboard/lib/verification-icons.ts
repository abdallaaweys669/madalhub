import { getCategoryIconPreview } from "./category-icons";

/** Map Ionicons `-outline` names (mobile) ↔ picker base names (admin). */
export function iconPickerValueFromDb(icon?: string | null) {
  const value = String(icon || "").trim();
  if (!value) return null;
  return value.replace(/-outline$/, "");
}

export function iconDbFromPicker(icon?: string | null) {
  const value = String(icon || "").trim();
  if (!value) return null;
  if (value.includes("-outline") || value.includes("-sharp") || value.includes("-solid")) {
    return value;
  }
  return `${value}-outline`;
}

export function getVerificationIconPreview(icon?: string | null) {
  return getCategoryIconPreview(iconPickerValueFromDb(icon));
}
