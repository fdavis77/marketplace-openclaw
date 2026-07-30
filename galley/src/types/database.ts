export type Region = "mediterranean" | "caribbean";
export type RequestRegion = Region | "other";
export type RequestStatus = "new" | "in_review" | "matched" | "closed";
export type ChefStatus = "pending_review" | "vetted" | "rejected";
export type ChefType = "seasonal" | "permanent" | "rotational" | "single_charter";
export type WaitlistRole = "owner" | "chef";

export interface WaitlistSignup {
  id: string;
  email: string;
  region: Region;
  role: WaitlistRole | null;
  created_at: string;
}

export interface OwnerRequest {
  id: string;
  owner_name: string;
  email: string;
  phone: string | null;
  vessel_name: string | null;
  vessel_length_m: number | null;
  region: RequestRegion;
  season_start: string | null;
  season_end: string | null;
  crew_size: number | null;
  guests_size: number | null;
  cuisine_preferences: string[];
  dietary_requirements: string | null;
  budget_range: string | null;
  chef_type: ChefType | null;
  additional_notes: string | null;
  status: RequestStatus;
  created_at: string;
}

export interface Chef {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo_path: string | null;
  years_experience: number | null;
  cuisine_specialties: string[];
  certifications: string | null;
  regions_available: Region[];
  day_rate_expectation: string | null;
  availability_start: string | null;
  availability_notes: string | null;
  cover_letter: string | null;
  cv_path: string | null;
  status: ChefStatus;
  created_at: string;
}

export interface Match {
  id: string;
  request_id: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MatchChef {
  match_id: string;
  chef_id: string;
}

export interface MatchWithChefs extends Match {
  chefs: Chef[];
}
