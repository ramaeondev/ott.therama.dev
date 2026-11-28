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
  city?: string;
  currentlyShowing?: boolean;
  sourceUrl?: string;
  posterUrl?: string;
  trailerUrl?: string;
  tmdbId?: number;
};

/** The film object returned by ott-ingest's movie endpoints (see its openapi.yaml). */
export type Film = {
  filmId: string;
  title: string;
  releaseDate: string | null;
  languages: string[];
  trailerUrl: string | null;
  posterVertical: string | null;
  posterHorizontal: string | null;
  tmdbId: number | null;
  genres: string[];
  certificate: string | null;
  durationMin: number | null;
  cities: string[];
  status?: "upcoming" | "released" | "dropped";
};

export type Platform = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
  category: string;
  contentLanguages: string[];
  status: "ACTIVE" | "MONITORING" | "INACTIVE" | "UNVERIFIED";
  indiaAvailable: boolean;
};

/** A film or series an announcement is about, as extracted by the API's AI analysis (DeepSeek / Claude). */
export type AnnouncementTitle = {
  title: string;
  kind: "movie" | "series" | "show" | "unknown";
  platform: { slug: string; name: string | null } | null;
  platformText: string | null;
  releaseDate: string | null; // streaming date stated in the article, never the article's own date
  dateText: string | null;
  languages: string[];
};

export type Announcement = {
  id: string;
  title: string;
  source_url: string;
  published_at: string | null;
  source_name: string;
  publisher: string | null;
  duplicate_count: number;
  image_url?: string | null;
  ai?: {
    status: "pending" | "done" | "failed";
    isOtt: boolean | null;
    category: string | null;
    summary: string | null;
    titles: AnnouncementTitle[];
    provider: string | null;
    model: string | null;
  };
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
  city?: string;
  limit?: number;
  offset?: number;
};

export const apiUrl = (import.meta.env.VITE_OTT_API_URL || "https://ott-api.therama.dev").replace(/\/$/, "");

export function indiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T12:00:00+05:30`)).toUpperCase();
}

/** Films are theatrical (PVR INOX). `city` is the city the user filtered on, shown on the card. */
function filmToRelease(film: Film, nowShowing: boolean, city: string | undefined, today: string): Release {
  const date = film.releaseDate ?? "";
  const currentlyShowing = nowShowing && (!date || date <= today);
  const status = currentlyShowing || (date && date <= today) ? "RELEASED" : date ? "UPCOMING" : "ANNOUNCED";
  return {
    id: film.filmId, title: film.title, category: "THEATRICAL", platform: "PVR INOX",
    date, dateLabel: date ? formatReleaseDate(date) : "DATE TBA",
    language: (film.languages[0] ?? "Multilingual").toUpperCase(),
    genre: film.genres.length ? film.genres.slice(0, 2).join(" · ") : "New release",
    contentType: "movie", runtime: film.durationMin ?? 0, status, verificationStatus: "API_REPORTED",
    city, currentlyShowing,
    posterUrl: film.posterVertical ?? undefined, trailerUrl: film.trailerUrl ?? undefined, tmdbId: film.tmdbId ?? undefined,
  };
}

async function getFilms(path: "now-showing" | "coming-soon", city: string | undefined): Promise<Film[]> {
  const params = new URLSearchParams(city ? { city } : {});
  const response = await fetch(`${apiUrl}/api/v1/movies/${path}${params.size ? `?${params}` : ""}`);
  if (!response.ok) throw new Error(`Release API returned ${response.status}`);
  return (await response.json() as { count: number; data: Film[] }).data;
}

/**
 * Releases for the UI, built from the now-showing and coming-soon film lists (one entry per film; a film in
 * both lists counts as now showing). The API has no OTT premieres or verified dates yet, so those filters
 * return nothing. Date, status and title filters and paging run here, on at most a few hundred films.
 */
export async function getReleases(query: ReleaseQuery = {}): Promise<Release[]> {
  if (query.category === "OTT" || query.verification_status === "VERIFIED") return [];
  const city = query.city && query.city !== "all" ? query.city : undefined;
  const today = indiaToday();
  const [nowShowing, comingSoon] = await Promise.all([getFilms("now-showing", city), getFilms("coming-soon", city)]);
  const byId = new Map<string, Release>();
  for (const film of nowShowing) byId.set(film.filmId, filmToRelease(film, true, city, today));
  for (const film of comingSoon) if (!byId.has(film.filmId)) byId.set(film.filmId, filmToRelease(film, false, city, today));
  const q = query.q?.toLowerCase();
  const rows = [...byId.values()]
    .filter((r) => (!query.from || (r.date && r.date >= query.from)) && (!query.to || (r.date && r.date <= query.to)))
    .filter((r) => !query.status || r.status === query.status)
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .filter((r) => !query.language || r.language.toLowerCase() === query.language.toLowerCase())
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.title.localeCompare(b.title));
  const offset = query.offset ?? 0;
  return rows.slice(offset, offset + (query.limit ?? 24));
}

export async function getPlatforms(): Promise<Platform[]> {
  const response = await fetch(`${apiUrl}/api/v1/ott-platforms`);
  if (!response.ok) throw new Error(`Platform API returned ${response.status}`);
  const result = await response.json() as { count: number; data: Platform[] };
  return result.data;
}

export async function getAnnouncements(query: { from?: string; to?: string; q?: string; ott?: boolean; limit?: number; offset?: number } = {}): Promise<Announcement[]> {
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
