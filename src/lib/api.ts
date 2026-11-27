export type Release = {
  id: string;
  title: string;
  category: "OTT" | "THEATRICAL";
  platform: string;
  dateLabel: string;
  language: string;
  genre: string;
  contentType: "movie" | "series";
  runtime: number;
  seasonLabel: string;
  art: string;
  artLabel: string;
  posterKicker: string;
  posterTitle: string;
  posterUrl?: string;
};

const samples: Release[] = [
  { id: "sample-1", title: "The Last Monsoon", category: "OTT", platform: "NETFLIX", dateLabel: "FRI, 28 NOV", language: "Hindi", genre: "Drama", contentType: "movie", runtime: 128, seasonLabel: "", art: "rain", artLabel: "A NETFLIX FILM", posterKicker: "A STORY BY", posterTitle: "THE LAST\nMONSOON" },
  { id: "sample-2", title: "Kaalam: The Beginning", category: "THEATRICAL", platform: "", dateLabel: "FRI, 28 NOV", language: "Tamil", genre: "Action", contentType: "movie", runtime: 146, seasonLabel: "", art: "ember", artLabel: "IN CINEMAS", posterKicker: "THE LEGEND", posterTitle: "KAALAM" },
  { id: "sample-3", title: "House of Stories", category: "OTT", platform: "PRIME VIDEO", dateLabel: "SAT, 29 NOV", language: "Malayalam", genre: "Mystery", contentType: "series", runtime: 0, seasonLabel: "Season 1 · 8 episodes", art: "blue", artLabel: "A PRIME ORIGINAL", posterKicker: "EVERY HOME HAS", posterTitle: "ITS SECRETS" },
  { id: "sample-4", title: "The Quiet Between", category: "OTT", platform: "SONY LIV", dateLabel: "SUN, 30 NOV", language: "Telugu", genre: "Thriller", contentType: "movie", runtime: 119, seasonLabel: "", art: "violet", artLabel: "SONY LIV ORIGINAL", posterKicker: "SOME SILENCES", posterTitle: "SPEAK" },
];

const apiUrl = import.meta.env.VITE_OTT_API_URL || "https://api-v3.therama.dev";

export async function getReleases(): Promise<{ items: Release[]; preview: boolean }> {
  if (!apiUrl) return { items: samples, preview: true };
  try {
    const indiaToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const response = await fetch(`${apiUrl}/ott/releases?from=${indiaToday}&limit=12`);
    if (!response.ok) return { items: samples, preview: true };
    const rows = await response.json() as Array<Record<string, unknown>>;
    if (!rows.length) return { items: samples, preview: true };
    const items: Release[] = rows.map((row): Release => ({
      id: String(row.id), title: String(row.title), category: row.release_category === "THEATRICAL" ? "THEATRICAL" : "OTT",
      posterUrl: row.poster_path ? `https://image.tmdb.org/t/p/w500${String(row.poster_path)}` : undefined,
      platform: String(row.platform_name ?? ""), dateLabel: new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(`${String(row.release_date)}T12:00:00+05:30`)).toUpperCase(),
      language: String(row.original_language ?? "Multilingual"), genre: Array.isArray(row.genres) ? row.genres.slice(0, 2).join(" · ") : "New release",
      contentType: row.content_type === "series" ? "series" : "movie", runtime: Number(row.runtime ?? 0), seasonLabel: "New episodes",
      art: ["rain", "ember", "blue", "violet"][String(row.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4], artLabel: String(row.platform_name ?? "OTT RADAR"), posterKicker: "JUST ANNOUNCED", posterTitle: String(row.title),
    }));
    return { items, preview: false };
  } catch { return { items: samples, preview: true }; }
}
