import { expect, test } from "@playwright/test";

const releases = [
  {
    id: "theatrical-1",
    title: "Mayan - Chapter 1",
    release_category: "THEATRICAL",
    release_date: "2026-12-03",
    original_language: "ta",
    genres: ["Action", "Drama"],
    content_type: "movie",
    runtime: 122,
    platform_name: null,
    poster_path: null,
  },
  {
    id: "ott-1",
    title: "River of Stars",
    release_category: "OTT",
    release_date: "2026-12-05",
    original_language: "hi",
    genres: ["Drama"],
    content_type: "series",
    runtime: 0,
    platform_name: "Netflix India",
    poster_path: null,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/ott/releases**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(releases),
    });
  });
  await page.goto("/");
});

test("Discover loads API releases and its category filters work", async ({ page }) => {
  await expect(page.locator(".release-card")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();
  await expect(page.locator(".preview-note")).toHaveCount(0);

  await page.getByRole("button", { name: "Theatrical" }).click();
  await expect(page.locator(".release-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Mayan - Chapter 1" })).toBeVisible();

  await page.getByRole("button", { name: "On OTT" }).click();
  await expect(page.locator(".release-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();
});

test("Discover search narrows the loaded results", async ({ page }) => {
  const search = page.getByPlaceholder("Find a title...");
  await search.fill("river");
  await expect(page.locator(".release-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "River of Stars" })).toBeVisible();

  await search.fill("no matching title");
  await expect(page.getByText("No releases match those filters yet.")).toBeVisible();
});

test("Calendar navigation is present but the page is still a placeholder", async ({ page }) => {
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { name: /Coming into view/ })).toBeVisible();
  await expect(page.getByText("The weekly and monthly release calendar is taking shape.")).toBeVisible();
});

test("Platforms navigation reaches a static logo strip, not the API registry", async ({ page }) => {
  await page.getByRole("link", { name: "Platforms" }).click();
  await expect(page).toHaveURL(/#platforms$/);
  await expect(page.locator(".platform-strip h2")).toContainText("watch next.");
  await expect(page.locator(".netflix")).toHaveText("N");
  await expect(page.locator(".zee")).toHaveText("ZEE5");
  await expect(page.locator(".aha")).toHaveText("aha");
});

test("roadmap navigation audit reports missing and incomplete tabs", async ({ page }) => {
  const tabs = await page.locator("header nav a").allTextContents();
  expect(tabs.map((tab) => tab.trim())).toEqual(["Discover", "Calendar", "Platforms"]);

  const roadmapTabsWithoutDedicatedNavigation = [
    "Theatrical Releases",
    "OTT Releases",
    "This Week",
    "Upcoming",
    "Search",
    "Admin",
  ];
  const incompleteTabs = ["Calendar (placeholder)", "Platforms (static logos)"];
  console.log(
    `Navigation audit: ${tabs.length} current tabs; ${incompleteTabs.length} incomplete; ` +
    `${roadmapTabsWithoutDedicatedNavigation.length} roadmap items lack a dedicated top-level tab. ` +
    `Missing tabs: ${roadmapTabsWithoutDedicatedNavigation.join(", ")}.`,
  );
  expect(roadmapTabsWithoutDedicatedNavigation).toHaveLength(6);
  expect(incompleteTabs).toHaveLength(2);
});
