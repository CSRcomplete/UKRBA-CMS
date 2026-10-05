/**
 * Extracts the UK postcode "area" prefix (e.g. "ST" from "ST4 8AB") used to
 * match against nextcrm_postcode_routing.postcode_area.
 */
export function extractPostcodeArea(postcode: string | null | undefined): string {
  if (!postcode) return "";
  const clean = postcode.replace(/\s+/g, "").toUpperCase();
  const match = clean.match(/^([A-Z]{1,2})/);
  return match ? match[1] : "";
}
