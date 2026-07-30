// Working codename for the product. Swap this one line when the real brand name lands.
export const APP_NAME = "Project Galley";

export const REGIONS = ["mediterranean", "caribbean"] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_LABELS: Record<Region, string> = {
  mediterranean: "Mediterranean",
  caribbean: "Caribbean",
};
