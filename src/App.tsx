import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link, NavLink, Route, Routes, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { dateToIso, getAnnouncements, getPlatforms, getReleases, indiaToday, type Announcement, type Platform, type Release, type ReleaseCategory, type ReleaseQuery } from "./lib/api";

const navItems = [
  ["Discover", "/"], ["Theatrical", "/theatrical"], ["OTT", "/ott"], ["This Week", "/week"],
  ["Upcoming", "/upcoming"], ["Announcements", "/announcements"], ["Calendar", "/calendar"], ["Platforms", "/platforms"], ["Search", "/search"],
] as const;

function Header() {
  return <header className="topbar">
    <Link className="brand" to="/" aria-label="OTT Radar home"><span className="brand-mark"><span /></span><span>OTT<span className="brand-light">RADAR</span></span></Link>
    <nav aria-label="Main navigation">{navItems.map(([label, path]) => <NavLink key={path} to={path} end={path === "/"}>{label}</NavLink>)}</nav>
    <div className="header-actions"><Link className="icon-button" to="/search" aria-label="Search releases"><Search size={18} /></Link><span className="region-chip">IN <i /> IST</span></div>
  </header>;
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { VERIFIED: "Verified", API_REPORTED: "API reported", UPCOMING: "Upcoming", RELEASED: "Released", ANNOUNCED: "Announced" };
  return <span className={`status-badge status-${status.toLowerCase().replaceAll("_", "-")}`}>{labels[status] ?? status.replaceAll("_", " ")}</span>;
}

function ReleaseCard({ release, index = 0 }: { release: Release; index?: number }) {
  const palette = ["rain", "ember", "blue", "violet"][index % 4];
  return <article className="release-card" data-testid="release-card" style={{ "--delay": `${index * 35}ms` } as CSSProperties}>
    <div className={`poster poster-${palette}`}>
      {release.posterUrl && <img className="poster-image" src={release.posterUrl} alt={`${release.title} poster`} loading="lazy" />}
      <span className="poster-label">{release.category === "THEATRICAL" ? "IN INDIAN CINEMAS" : release.platform || "OTT RADAR"}</span>
      <div className="poster-copy"><span>{release.verificationStatus === "VERIFIED" ? "CONFIRMED RELEASE" : "SOURCE REPORTED"}</span><strong>{release.title}</strong></div>
      <span className="format">{release.contentType === "movie" ? "FILM" : "SERIES"}</span>
    </div>
    <div className="release-info">
      <div className="release-meta"><span className={`kind ${release.category === "THEATRICAL" ? "kind-theatre" : "kind-ott"}`}>{release.category === "THEATRICAL" ? "IN CINEMAS" : release.platform || "OTT"}</span><span className="date">{release.dateLabel}</span></div>
      <h3>{release.title}</h3>
      <p>{release.language} <i /> {release.genre} <i /> {release.contentType === "movie" ? `${release.runtime || "—"} min` : "Series"}</p>
      <div className="release-card-bottom"><StatusBadge status={release.verificationStatus} />{release.sourceUrl && <a href={release.sourceUrl} target="_blank" rel="noreferrer">Source</a>}</div>
    </div>
  </article>;
}

function useReleaseData(query: ReleaseQuery) {
  const queryKey = JSON.stringify(query);
  const [items, setItems] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const parsedQuery = JSON.parse(queryKey) as ReleaseQuery;
    setLoading(true);
    setError("");
    getReleases(parsedQuery).then((rows) => {
      if (active) setItems(rows);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load releases.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [queryKey]);
  return { items, loading, error };
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading"><div className="eyebrow muted"><span className="heading-spark">✳</span>{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>;
}

function ReleaseFeed({
  title, eyebrow, subtitle, from, to, initialCategory, status, showCategory = false, queryLabel = "Find a title...", initialQuery = "",
}: {
  title: string; eyebrow: string; subtitle: string; from?: string; to?: string;
  initialCategory?: ReleaseCategory; status?: ReleaseQuery["status"]; showCategory?: boolean; queryLabel?: string; initialQuery?: string;
}) {
  const [category, setCategory] = useState<ReleaseCategory | undefined>(initialCategory);
  const [verification, setVerification] = useState<ReleaseQuery["verification_status"]>();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [offset, setOffset] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedQuery(query.trim()); setOffset(0); }, 250); return () => window.clearTimeout(timer); }, [query]);
  const request = useMemo(() => ({ from, to, category: showCategory ? category : initialCategory, status, verification_status: verification, q: debouncedQuery || undefined, limit: 25, offset }), [from, to, category, initialCategory, showCategory, status, verification, debouncedQuery, offset]);
  const { items, loading, error } = useReleaseData(request);
  const hasMore = items.length > 24;
  const visible = hasMore ? items.slice(0, 24) : items;
  const emptyMessage = category === "OTT" || initialCategory === "OTT"
    ? "No India OTT release dates are verified yet. We’ll show titles here when a platform date is confirmed."
    : "No releases match this date range and these filters.";
  return <main className="page-shell">
    <PageHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
    <section className="feed-section" aria-label="Release results">
      <div className="feed-toolbar">
        {showCategory && <div className="filter-tabs" role="group" aria-label="Release category">
          {[undefined, "THEATRICAL", "OTT"].map((value) => <button key={value ?? "all"} onClick={() => { setCategory(value as ReleaseCategory | undefined); setOffset(0); }} className={category === value ? "active" : ""}>{value ?? "All releases"}</button>)}
        </div>}
        <label className="search-field"><Search size={15} /><input aria-label={queryLabel} placeholder={queryLabel} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="verification-filter">Evidence
          <select aria-label="Filter by evidence" value={verification ?? ""} onChange={(event) => { setVerification((event.target.value || undefined) as ReleaseQuery["verification_status"]); setOffset(0); }}>
            <option value="">All evidence</option><option value="VERIFIED">Verified</option><option value="API_REPORTED">API reported</option>
          </select>
        </label>
      </div>
      {loading ? <div className="empty-state" role="status">Loading releases…</div>
        : error ? <div className="empty-state error-state" role="alert">{error}. Try again in a moment.</div>
        : visible.length ? <div className="release-grid">{visible.map((release, index) => <ReleaseCard key={release.id} release={release} index={index} />)}</div>
        : <div className="empty-state" role="status">{emptyMessage}</div>}
      {hasMore && <button className="load-more" onClick={() => setOffset((value) => value + 24)}>Load more releases <ArrowDown size={14} /></button>}
      {visible.length > 0 && <p className="data-note"><ShieldCheck size={14} /> Release dates include their evidence status. Pending and rejected items are not public.</p>}
    </section>
  </main>;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
function dateFromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}
function daysBetween(from: Date, count: number): Date[] { return Array.from({ length: count }, (_, index) => addDays(from, index)); }
function weekLabel(from: Date, to: Date): string {
  const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

function Discover() {
  const today = dateFromIso(indiaToday());
  const weekFrom = startOfWeek(today);
  const weekTo = addDays(weekFrom, 6);
  return <main>
    <section className="hero"><div className="hero-text"><div className="eyebrow"><span className="live-dot" /> YOUR INDIA RELEASE RADAR <span className="eyebrow-line" /></div><h1>Know what’s<br />coming <em>next.</em></h1><p>Indian cinema releases and OTT availability,<br className="desktop-break" /> with the evidence shown up front.</p><div className="hero-buttons"><Link to="/week" className="button button-primary">This week <ArrowRight size={16} /></Link><Link to="/calendar" className="button button-quiet"><CalendarDays size={16} /> Open calendar</Link></div><div className="hero-caption"><span className="caption-dash" /> {weekLabel(weekFrom, weekTo)} · INDIA</div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbital-star">✳</div><div className="hero-poster hero-poster-back"><span>THE NEXT<br />CHAPTER</span><small>COMING SOON</small></div><div className="hero-poster hero-poster-front"><div className="hero-poster-art"><span className="moon" /><span className="horizon" /></div><span className="hero-poster-title">A WORLD<br />AWAKENS</span><small>AN ORIGINAL SERIES</small></div></div><div className="hero-bottom"><span>INDIA, ON THE BIG SCREEN &amp; BEYOND</span><span>DATES SHOW THEIR EVIDENCE <span className="scroll-arrow">↓</span></span></div></section>
    <ReleaseFeed eyebrow="THE RELEASE RADAR" title="This week, in focus." subtitle="The stories, films and series landing across India." from={dateToIso(weekFrom)} to={dateToIso(weekTo)} showCategory />
    <footer><Link className="brand" to="/"><span className="brand-mark"><span /></span><span>OTT<span className="brand-light">RADAR</span></span></Link><span>Made for what India watches next.</span><span className="credits">Data by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a> &amp; <a href="https://www.watchmode.com/" target="_blank" rel="noreferrer">Watchmode</a></span><span>© 2026 OTT Radar <i /> IST · India</span></footer>
  </main>;
}

function WeekPage() {
  const current = dateFromIso(indiaToday());
  const from = dateToIso(startOfWeek(current));
  const to = dateToIso(addDays(startOfWeek(current), 6));
  return <ReleaseFeed eyebrow="MONDAY – SUNDAY · IST" title="This week" subtitle={`${weekLabel(dateFromIso(from), dateFromIso(to))} · India`} from={from} to={to} showCategory />;
}
function TheatricalPage() {
  return <ReleaseFeed eyebrow="IN INDIAN CINEMAS" title="Theatrical releases" subtitle="India release dates reported by the metadata source, with evidence status shown on each title." initialCategory="THEATRICAL" />;
}
function OttPage() {
  return <ReleaseFeed eyebrow="INDIA STREAMING" title="OTT releases" subtitle="Only platform dates available in India. Pending announcements stay out of public listings." initialCategory="OTT" />;
}
function UpcomingPage() {
  return <ReleaseFeed eyebrow="AHEAD OF RELEASE" title="Upcoming" subtitle="Announced and upcoming dates in India." from={indiaToday()} status="UPCOMING" showCategory />;
}
function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const query = params.get("q")?.trim() ?? "";
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setParams(value.trim() ? { q: value.trim() } : {});
  };
  return <div className="page-shell search-page-shell">
    <PageHeading eyebrow="SEARCH INDIA RELEASES" title="Find a title" subtitle="Search release titles across the full API result set." />
    <form className="search-page-form" onSubmit={handleSubmit}><label className="search-field"><Search size={17} /><input aria-label="Search titles" placeholder="Search titles..." value={value} onChange={(event) => setValue(event.target.value)} /></label><button className="button button-primary" type="submit">Search <ArrowRight size={15} /></button></form>
    {query ? <ReleaseFeed key={query} eyebrow={`RESULTS FOR “${query}”`} title="Search results" subtitle="Only public, non-pending release records are searchable." initialQuery={query} queryLabel="Refine search..." /> : <p className="empty-state">Enter a title to search releases.</p>}
  </div>;
}

function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getPlatforms().then((rows) => { if (active) setPlatforms(rows); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load platforms."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <main className="page-shell">
    <PageHeading eyebrow="INDIA PLATFORM DIRECTORY" title="Streaming platforms" subtitle="Candidate services are listed with their current verification and India availability." />
    {loading ? <div className="empty-state" role="status">Loading platforms…</div>
      : error ? <div className="empty-state error-state" role="alert">{error}</div>
      : <div className="platform-grid">{platforms.map((platform) => <article className="platform-card" key={platform.id}>
        <div className="platform-card-top"><span className="platform-symbol">{platform.name.slice(0, 1)}</span><StatusBadge status={platform.status} /></div>
        <h2>{platform.name}</h2><p>{platform.platform_category}</p>
        <div className={`availability ${platform.india_available ? "available" : "unconfirmed"}`}><span />{platform.india_available ? "India availability confirmed" : "India availability not verified"}</div>
        {platform.website && <a href={platform.website} target="_blank" rel="noreferrer">Official site <ArrowRight size={13} /></a>}
      </article>)}</div>}
    {!loading && !error && platforms.length === 0 && <div className="empty-state">No platform records are available.</div>}
  </main>;
}

function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { setOffset(0); }, [debouncedQuery]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getAnnouncements({ q: debouncedQuery || undefined, limit: 51, offset }).then((rows) => {
      if (active) {
        setHasMore(rows.length > 50);
        const page = rows.slice(0, 50);
        setItems((current) => offset ? [...current, ...page] : page);
      }
    })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load announcements."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedQuery, offset]);
  const duplicates = items.reduce((total, item) => total + item.duplicate_count, 0);
  return <main className="page-shell">
    <PageHeading eyebrow="HUGGIN RSS · DEDUPLICATED" title="Announcements" subtitle="Entertainment news items from our RSS sources. An article’s publication date is not a verified release date." />
    <section className="feed-section" aria-label="RSS announcements">
      <div className="announcement-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Search announcements" placeholder="Search announcements..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        {!loading && !error && <span className="duplicate-note" data-testid="duplicate-note">{duplicates ? `${duplicates} duplicate ${duplicates === 1 ? "item" : "items"} merged` : "Duplicates suppressed"}</span>}
      </div>
      {loading ? <div className="empty-state" role="status">Loading announcements…</div>
        : error ? <div className="empty-state error-state" role="alert">{error}</div>
        : items.length ? <div className="announcement-list">{items.map((item) => <article className="announcement-card" key={item.id}>
          <div className="announcement-source"><span>{item.publisher || item.source_name}</span><span>{item.published_at ? `Article published ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(item.published_at))}` : "Article date not provided"}</span></div>
          <h2>{item.title}</h2><p>Announcement; not a verified release date.</p>
          <a href={item.source_url} target="_blank" rel="noreferrer">Read source <ArrowRight size={13} /></a>
        </article>)}</div>
        : <div className="empty-state" role="status">No announcements match this search.</div>}
      {hasMore && !loading && <button className="load-more" onClick={() => setOffset((value) => value + 50)}>Load more announcements <ArrowDown size={14} /></button>}
      {loading && items.length > 0 && <div className="empty-state" role="status">Loading more announcements…</div>}
    </section>
  </main>;
}

function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(() => dateFromIso(indiaToday()));
  const start = view === "week" ? startOfWeek(anchor) : startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const count = view === "week" ? 7 : 42;
  const dates = daysBetween(start, count);
  const end = dates[dates.length - 1];
  const { items, loading, error } = useReleaseData({ from: dateToIso(start), to: dateToIso(end), limit: 100 });
  const byDate = new Map<string, Release[]>();
  items.forEach((item) => byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]));
  const title = view === "week"
    ? weekLabel(start, end)
    : new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(anchor);
  const move = (direction: number) => setAnchor((date) => view === "week"
    ? addDays(date, direction * 7)
    : new Date(date.getFullYear(), date.getMonth() + direction, 1));
  return <main className="page-shell calendar-page">
    <PageHeading eyebrow="ASIA/KOLKATA · INDIA" title="Release calendar" subtitle="Browse theatrical and OTT dates in Monday–Sunday weeks or by month." />
    <section className="calendar-panel" aria-label="Release calendar">
      <div className="calendar-toolbar"><div className="calendar-period"><button aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft size={18} /></button><h2>{title}</h2><button aria-label="Next period" onClick={() => move(1)}><ChevronRight size={18} /></button><button className="today-button" onClick={() => setAnchor(dateFromIso(indiaToday()))}>Today</button></div>
        <div className="view-switch" role="group" aria-label="Calendar view"><button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Week</button><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button></div>
      </div>
      {error ? <div className="empty-state error-state" role="alert">{error}</div> : loading ? <div className="empty-state" role="status">Loading calendar…</div> : <>
        <div className={`calendar-grid ${view}`} role="grid" aria-label={title}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div role="columnheader" className="calendar-weekday" key={day}>{day}</div>)}
          {dates.map((date) => {
            const iso = dateToIso(date);
            const dayItems = byDate.get(iso) ?? [];
            const otherMonth = view === "month" && date.getMonth() !== anchor.getMonth();
            return <div role="gridcell" className={`calendar-day ${otherMonth ? "other-month" : ""}`} key={iso}>
              <span className="calendar-day-number">{date.getDate()}</span>
              {dayItems.slice(0, view === "week" ? 5 : 2).map((item) => <div className={`calendar-event ${item.category.toLowerCase()}`} key={item.id} title={`${item.title} · ${item.verificationStatus}`}><b>{item.category === "THEATRICAL" ? "Cinema" : item.platform || "OTT"}</b><span>{item.title}</span></div>)}
              {dayItems.length > (view === "week" ? 5 : 2) && <span className="more-events">+{dayItems.length - (view === "week" ? 5 : 2)} more</span>}
            </div>;
          })}
        </div>
        {items.length === 0 && <p className="calendar-empty">No public releases in this period yet.</p>}
      </>}
    </section>
  </main>;
}

function NotFound() {
  return <main className="page-shell not-found"><PageHeading eyebrow="404 · NOT FOUND" title="This page isn’t on the radar." subtitle="That route doesn’t exist yet. Choose a release view to continue." /><Link className="button button-primary" to="/"><ArrowLeft size={15} /> Back to Discover</Link></main>;
}

export default function App() {
  return <><Header /><Routes>
    <Route path="/" element={<Discover />} />
    <Route path="/theatrical" element={<TheatricalPage />} />
    <Route path="/ott" element={<OttPage />} />
    <Route path="/week" element={<WeekPage />} />
    <Route path="/upcoming" element={<UpcomingPage />} />
    <Route path="/announcements" element={<AnnouncementsPage />} />
    <Route path="/calendar" element={<CalendarPage />} />
    <Route path="/platforms" element={<PlatformsPage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes></>;
}
