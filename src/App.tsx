import { useEffect, useState, type CSSProperties } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { ArrowDownUp, ArrowRight, CalendarDays, ChevronDown, Search, SlidersHorizontal, Sparkles, Tv2 } from "lucide-react";
import { getReleases, type Release } from "./lib/api";

const filters = ["All releases", "Theatrical", "On OTT"] as const;
type Filter = typeof filters[number];

function Header() {
  return <header className="topbar"><Link className="brand" to="/"><span className="brand-mark"><span /></span><span>OTT<span className="brand-light">RADAR</span></span></Link><nav><NavLink to="/" end>Discover</NavLink><NavLink to="/calendar">Calendar</NavLink><a href="/#platforms">Platforms</a></nav><div className="header-actions"><a className="icon-button" href="/#releases" aria-label="Browse releases"><Search size={18} /></a><span className="region-chip">IN <i /> IST</span></div></header>;
}

function ReleaseCard({ release, index }: { release: Release; index: number }) {
  return <article className="release-card" style={{ "--delay": `${index * 55}ms` } as CSSProperties}>
    <div className={`poster poster-${release.art}`}>
      {release.posterUrl && <img className="poster-image" src={release.posterUrl} alt="" loading="lazy" />}
      <span className="poster-label">{release.artLabel}</span>
      <div className="poster-copy"><span>{release.posterKicker}</span><strong>{release.posterTitle}</strong></div>
      <span className="format">{release.contentType === "movie" ? "FILM" : "SERIES"}</span>
    </div>
    <div className="release-info"><div className="release-meta"><span className={`kind ${release.category === "THEATRICAL" ? "kind-theatre" : "kind-ott"}`}>{release.category === "THEATRICAL" ? "IN CINEMAS" : release.platform}</span><span className="date">{release.dateLabel}</span></div><h3>{release.title}</h3><p>{release.language} <i /> {release.genre} <i /> {release.contentType === "movie" ? `${release.runtime} min` : release.seasonLabel}</p></div>
  </article>;
}

function Discover() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [filter, setFilter] = useState<Filter>("All releases");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getReleases().then(({ items, preview }) => { setReleases(items); setIsPreview(preview); }).finally(() => setLoading(false)); }, []);
  const visible = releases.filter((release) => (filter === "All releases" || (filter === "Theatrical" ? release.category === "THEATRICAL" : release.category === "OTT")) && `${release.title} ${release.platform} ${release.language}`.toLowerCase().includes(query.toLowerCase()));
  return <main>
    <section className="hero"><div className="hero-text"><div className="eyebrow"><span className="live-dot" /> YOUR INDIA RELEASE RADAR <span className="eyebrow-line" /></div><h1>Know what’s<br />coming <em>next.</em></h1><p>Every cinema premiere and OTT drop across India.<br className="desktop-break" /> Curated in one place, updated as it happens.</p><div className="hero-buttons"><a href="#releases" className="button button-primary">Explore releases <ArrowRight size={16} /></a><a href="/calendar" className="button button-quiet"><CalendarDays size={16} /> Open calendar</a></div><div className="hero-caption"><span className="caption-dash" /> A clearer picture of what to watch.</div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbital-star">✳</div><div className="hero-poster hero-poster-back"><span>THE NEXT<br />CHAPTER</span><small>COMING SOON</small></div><div className="hero-poster hero-poster-front"><div className="hero-poster-art"><span className="moon" /><span className="horizon" /></div><span className="hero-poster-title">A WORLD<br />AWAKENS</span><small>AN ORIGINAL SERIES</small></div><div className="floating-tag tag-one"><span className="tag-icon"><Tv2 size={13} /></span><span><b>Streaming</b><small>across India</small></span></div><div className="floating-tag tag-two"><span className="tag-icon calendar-icon"><CalendarDays size={13} /></span><span><b>Always ahead</b><small>release dates, verified</small></span></div><div className="hero-orbit-note">01 <span /> 24° N · 79° E</div></div><div className="hero-bottom"><span>INDIA, ON THE BIG SCREEN & BEYOND</span><span>SCROLL TO EXPLORE <span className="scroll-arrow">↓</span></span></div></section>
    <section id="releases" className="release-section"><div className="section-heading"><div><div className="eyebrow muted"><span className="heading-spark">✳</span> THE RELEASE RADAR</div><h2>This week, <em>in focus.</em></h2><p>The stories, films and series landing across India.</p></div><a href="/calendar" className="text-link">Full release calendar <ArrowRight size={15} /></a></div>{isPreview && <div className="preview-note"><Sparkles size={13} /> Preview cards — sample titles and dates, not release announcements.</div>}<div className="toolbar"><div className="filter-tabs">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "active" : ""}>{item}{item === "All releases" && <span>{releases.length || 0}</span>}</button>)}</div><div className="toolbar-tools"><label className="search-field"><Search size={15} /><input placeholder="Find a title..." value={query} onChange={(e) => setQuery(e.target.value)} /></label><button className="filter-button"><SlidersHorizontal size={15} /> Filters <ChevronDown size={13} /></button><button className="sort-button"><ArrowDownUp size={15} /><span>By date</span></button></div></div>
      {loading ? <div className="empty-state">Tuning into the latest releases…</div> : visible.length ? <div className="release-grid">{visible.map((release, index) => <ReleaseCard key={release.id} release={release} index={index} />)}</div> : <div className="empty-state">No releases match those filters yet.</div>}
      <a href="/calendar" className="view-all">View all this week <ArrowRight size={15} /></a>
    </section>
    <section id="platforms" className="platform-strip"><div><div className="eyebrow muted"><span className="heading-spark">✳</span> ALL IN ONE PLACE</div><h2>From first look to <em>watch next.</em></h2></div><div className="platform-logos"><span className="netflix">N</span><span className="prime">prime<span>video</span></span><span className="jio">Jio<span>Hotstar</span></span><span className="zee">ZEE5</span><span className="sony">SONY<span>LIV</span></span><span className="aha">aha</span></div></section>
    <footer><Link className="brand" to="/"><span className="brand-mark"><span /></span><span>OTT<span className="brand-light">RADAR</span></span></Link><span>Made for what India watches next.</span><span className="credits">Data by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a> &amp; <a href="https://www.watchmode.com/" target="_blank" rel="noreferrer">Watchmode</a></span><span>© 2026 OTT Radar <i /> IST · India</span></footer>
  </main>;
}

function CalendarPage() { return <main className="simple-page"><div className="eyebrow muted"><CalendarDays size={13} /> RELEASE CALENDAR</div><h1>Coming into <em>view.</em></h1><p>The weekly and monthly release calendar is taking shape.</p><Link to="/" className="button button-primary">Back to discover <ArrowRight size={16} /></Link></main>; }

export default function App() {
  return <><Header /><Routes><Route path="/" element={<Discover />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="*" element={<Discover />} /></Routes></>;
}
