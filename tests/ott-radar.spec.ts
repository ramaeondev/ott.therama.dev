import { expect, test } from "@playwright/test";

function isoDay(offset: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(year, month - 1, day + offset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

const releases = [
  {
    id: "theatrical-1", title: "Mayan - Chapter 1", release_category: "THEATRICAL",
    release_date: isoDay(0), original_language: "ta", genres: ["Action", "Drama"],
    content_type: "movie", runtime: 122, platform_name: null, poster_path: null,
    verification_status: "API_REPORTED", status: "UPCOMING", source_url: "https://www.themoviedb.org/movie/1",
  },
  {
    id: "ott-1", title: "River of Stars", release_category: "OTT",
    release_date: isoDay(1), original_language: "hi", genres: ["Drama"],
    content_type: "series", runtime: 0, platform_name: "Netflix India", poster_path: null,
    verification_status: "VERIFIED", status: "UPCOMING", source_url: "https://www.netflix.com/",
  },
];

const platforms = [
  { id: "netflix", name: "Netflix India", slug: "netflix-india", website: "https://www.netflix.com/in/", platform_category: "general entertainment", status: "ACTIVE", india_available: true },
  { id: "prime", name: "Prime Video India", slug: "prime-video-india", website: "https://www.primevideo.com/", platform_category: "general entertainment", status: "ACTIVE", india_available: true },
];

const announcements = [
  { id: "article-1", title: "New series announced for India", source_url: "https://news.example.com/series", published_at: "2026-11-27T10:00:00Z", source_name: "Example Entertainment RSS", publisher: "Example Entertainment", duplicate_count: 2 },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/ott/releases**", async (route) => {
    const url = new URL(route.request().url());
    const params = url.searchParams;
    let rows = [...releases];
    const category = params.get("category");
    const query = params.get("q")?.toLowerCase();
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status");
    const verification = params.get("verification_status");
    if (category) rows = rows.filter((row) => row.release_category === category);
    if (query) rows = rows.filter((row) => row.title.toLowerCase().includes(query));
    if (from) rows = rows.filter((row) => row.release_date >= from);
    if (to) rows = rows.filter((row) => row.release_date <= to);
    if (status) rows = rows.filter((row) => row.status === status);
    if (verification) rows = rows.filter((row) => row.verification_status === verification);
    const offset = Number(params.get("offset") ?? 0);
    const limit = Number(params.get("limit") ?? 24);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows.slice(offset, offset + limit)) });
  });
  await page.route("**/ott/platforms", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(platforms) }));
  await page.route("**/ott/announcements**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(announcements) }));
  await page.goto("/");
});

test("Discover loads real-shaped API data and labels its evidence", async ({ page }) => {
  await expect(page.locator("[data-testid=release-card]")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toBeVisible();
  await expect(page.locator(".status-api-reported")).toHaveCount(0);
  await expect(page.getByText("SOURCE REPORTED")).toHaveCount(0);
  await expect(page.locator(".status-verified")).toBeVisible();
});

test("Discover filters request category-specific records", async ({ page }) => {
  await page.getByRole("button", { name: /THEATRICAL/i }).click();
  await expect(page.locator("[data-testid=release-card]")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toBeVisible();
  await page.getByRole("button", { name: "OTT", exact: true }).click();
  await expect(page.locator("[data-testid=release-card]")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();
});

test("Theatrical and OTT have dedicated, server-filtered pages", async ({ page }) => {
  await page.getByRole("link", { name: "Theatrical", exact: true }).click();
  await expect(page).toHaveURL(/\/theatrical$/);
  await expect(page.getByRole("heading", { name: "Theatrical releases" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toBeVisible();

  await page.getByRole("link", { name: "OTT", exact: true }).click();
  await expect(page).toHaveURL(/\/ott$/);
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();
});

test("This Week and Upcoming use date and release-status filters", async ({ page }) => {
  await page.getByRole("link", { name: "This Week", exact: true }).click();
  await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toBeVisible();

  await page.getByRole("link", { name: "Upcoming", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Upcoming", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();
});

test("Search uses API title search and returns matching results", async ({ page }) => {
  await page.getByRole("link", { name: "Search", exact: true }).click();
  await page.getByRole("textbox", { name: "Search titles" }).fill("River");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toHaveCount(0);
});

test("Calendar supports week and month grids with period navigation", async ({ page }) => {
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page.getByRole("grid", { name: /–/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Week" })).toHaveClass(/active/);
  await page.getByRole("button", { name: "Month" }).click();
  await expect(page.getByRole("grid", { name: /202/ })).toBeVisible();
  await expect(page.getByRole("gridcell")).toHaveCount(42);
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.getByRole("grid")).toBeVisible();
});

test("Platforms are populated from the API and shown as verified", async ({ page }) => {
  await page.getByRole("link", { name: "Platforms", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Streaming platforms" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Netflix India" })).toBeVisible();
  await expect(page.locator(".platform-card .status-badge")).toHaveText(["Verified", "Verified"]);
  await expect(page.getByText("India availability not verified")).toHaveCount(0);
  await expect(page.getByText("India availability confirmed")).toHaveCount(2);
});

test("Announcements publish deduplicated RSS articles without presenting article dates as release dates", async ({ page }) => {
  await page.getByRole("link", { name: "Announcements", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Announcements", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New series announced for India" })).toBeVisible();
  await expect(page.getByText("Announcement; not a verified release date.")).toBeVisible();
  await expect(page.getByText(/Article published/)).toBeVisible();
  await expect(page.getByTestId("duplicate-note")).toHaveText("2 duplicate items merged");
  await expect(page.getByRole("link", { name: "Read source" })).toHaveAttribute("href", "https://news.example.com/series");
});

test("Announcements load more than one page without repeating or dropping rows", async ({ page }) => {
  await page.route("**/ott/announcements**", async (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get("offset") ?? 0);
    const rows = Array.from({ length: offset === 0 ? 51 : 1 }, (_, index) => ({
      id: `article-${offset + index}`, title: `Announcement ${offset + index}`,
      source_url: `https://news.example.com/${offset + index}`, published_at: "2026-11-27T10:00:00Z",
      source_name: "Example RSS", publisher: "Example News", duplicate_count: 0,
    }));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) });
  });
  await page.getByRole("link", { name: "Announcements", exact: true }).click();
  await expect(page.locator(".announcement-card")).toHaveCount(50);
  await page.getByRole("button", { name: "Load more announcements" }).click();
  await expect(page.locator(".announcement-card")).toHaveCount(51);
  await expect(page.getByRole("heading", { name: "Announcement 50" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load more announcements" })).toHaveCount(0);
});

test("all public navigation links open their matching routes", async ({ page }) => {
  const routes = [
    ["Theatrical", "/theatrical"], ["OTT", "/ott"], ["This Week", "/week"],
    ["Upcoming", "/upcoming"], ["Announcements", "/announcements"], ["Calendar", "/calendar"],
    ["Platforms", "/platforms"], ["Search", "/search"], ["Discover", "/"],
  ] as const;
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  for (const [label, path] of routes) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}$`));
    await expect(page.locator("[role=alert]")).toHaveCount(0);
  }
  expect(pageErrors).toEqual([]);
});

test("unknown routes show a not-found page", async ({ page }) => {
  await page.goto("/not-a-real-tab");
  await expect(page.getByRole("heading", { name: "This page isn’t on the radar." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Discover" })).toBeVisible();
});

test("navigation has every requested route and works at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const label of ["Discover", "Theatrical", "OTT", "This Week", "Upcoming", "Announcements", "Calendar", "Platforms", "Search"]) {
    await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await page.getByRole("link", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
});
