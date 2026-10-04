export function UrbanDoodles() {
  return <div className="urban-doodles" aria-hidden="true">{[0,1,2,3].map(i => <svg key={i} viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 70c14-34 28 34 42 0s28 34 42 0 28 34 42 0M28 18l7 10-11 4m60 72 12 3-6 11M35 95c-8-15 14-19 17-5s-16 19-21 8M96 25l10-8 6 11-10 8z"/></svg>)}</div>;
}
