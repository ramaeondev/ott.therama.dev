export type VerificationStatus = "VERIFIED" | "API_REPORTED" | "PENDING_VERIFICATION" | "REJECTED";
export type ReleaseCategory = "OTT" | "THEATRICAL";

export type Release = {
  id: string;
  title: string;
  category: ReleaseCategory;
  platform: string;
  date: string;
  dateLabel: string;
  language: string;
  genre: string;
  contentType: "movie" | "series";
  runtime: number;
  status: string;
  verificationStatus: VerificationStatus;
  sourceUrl?: string;
  posterUrl?: string;
};

export type Platform = {
  id: string;
  name: string;
  slug: string;
  website?: string;
  platform_category: string;
  status: "ACTIVE" | "MONITORING" | "INACTIVE" | "UNVERIFIED";
  india_available: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  source_url: string;
  published_at: string | null;
  source_name: string;
  publisher: string | null;
  duplicate_count: number;
};

export type ReleaseQuery = {
  from?: string;
  to?: string;
  category?: ReleaseCategory;
  platform?: string;
  language?: string;
  q?: string;
  verification_status?: "VERIFIED" | "API_REPORTED";
  status?: "ANNOUNCED" | "UPCOMING" | "RELEASED";
  limit?: number;
  offset?: number;
};

export const apiUrl = (import.meta.env.VITE_OTT_API_URL || "https://api-v3.therama.dev").replace(/\/$/, "");

export function indiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T12:00:00+05:30`)).toUpperCase();
}

function toRelease(row: Record<string, unknown>): Release {
  const date = String(row.release_date ?? "");
  const genre = Array.isArray(row.genres) ? row.genres.slice(0, 2).join(" · ") : "New release";
  return {
    id: String(row.id), title: String(row.title),
    category: row.release_category === "THEATRICAL" ? "THEATRICAL" : "OTT",
    platform: String(row.platform_name ?? ""), date, dateLabel: date ? formatReleaseDate(date) : "DATE TBA",
    language: String(row.original_language ?? "Multilingual").toUpperCase(), genre,
    contentType: row.content_type === "series" ? "series" : "movie",
    runtime: Number(row.runtime ?? 0), status: String(row.status ?? "UPCOMING"),
    verificationStatus: String(row.verification_status ?? "API_REPORTED") as VerificationStatus,
    sourceUrl: typeof row.source_url === "string" ? row.source_url : undefined,
    posterUrl: row.poster_path ? `https://image.tmdb.org/t/p/w500${String(row.poster_path)}` : undefined,
  };
}

export async function getReleases(query: ReleaseQuery = {}): Promise<Release[]> {
  const params = new URLSearchParams();
  Object.entries({ limit: 24, ...query }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const response = await fetch(`${apiUrl}/ott/releases?${params.toString()}`);
  if (!response.ok) throw new Error(`Release API returned ${response.status}`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map(toRelease);
}

export async function getPlatforms(): Promise<Platform[]> {
  const response = await fetch(`${apiUrl}/ott/platforms`);
  if (!response.ok) throw new Error(`Platform API returned ${response.status}`);
  return await response.json() as Platform[];
}

export async function getAnnouncements(query: { from?: string; to?: string; q?: string; limit?: number; offset?: number } = {}): Promise<Announcement[]> {
  const params = new URLSearchParams();
  Object.entries({ limit: 24, ...query }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const response = await fetch(`${apiUrl}/ott/announcements?${params.toString()}`);
  if (!response.ok) throw new Error(`Announcement API returned ${response.status}`);
  return await response.json() as Announcement[];
}

export function dateToIso(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
