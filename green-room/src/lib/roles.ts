export const ROLE_OPTIONS = [
  { value: "writer", label: "Writer", hint: "Track scripts, scenes, and submissions." },
  { value: "director", label: "Director", hint: "Track projects from development to delivery." },
  { value: "producer", label: "Producer", hint: "Track projects, submissions, and deadlines." },
  { value: "editor", label: "Editor", hint: "Track projects through to delivery." },
  { value: "actor", label: "Actor", hint: "Track auditions, sides, and availability." },
  { value: "cinematographer", label: "Cinematographer", hint: "DP — track projects and shoot dates." },
  { value: "gaffer", label: "Gaffer", hint: "Lighting — find projects and connect with crews." },
  { value: "sound_designer", label: "Sound designer", hint: "Sound and post — find projects and connect with crews." },
  { value: "composer", label: "Composer", hint: "Score and music — find projects and connect with crews." },
  { value: "production_designer", label: "Production designer", hint: "Art department — find projects and connect with crews." },
  { value: "first_ad", label: "1st assistant director", hint: "Scheduling on set — find projects and connect with crews." },
] as const;

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.value, r.label])
);

export const WRITER_ADJACENT_ROLES = ["writer", "director", "producer", "editor"];
