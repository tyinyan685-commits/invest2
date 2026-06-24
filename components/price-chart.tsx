export function PriceChart() {
  return (
    <div className="chart" role="img" aria-label="MU 示意价格趋势图">
      <svg viewBox="0 0 760 250" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b7f34a" stopOpacity=".34" />
            <stop offset="100%" stopColor="#b7f34a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="grid-lines">
          <line x1="0" y1="36" x2="760" y2="36" />
          <line x1="0" y1="104" x2="760" y2="104" />
          <line x1="0" y1="172" x2="760" y2="172" />
          <line x1="0" y1="230" x2="760" y2="230" />
        </g>
        <path className="area" d="M0 216 C45 220 68 205 104 207 S167 184 205 190 S260 155 300 162 S349 125 386 136 S438 90 476 102 S520 49 558 59 S605 30 642 42 S687 23 714 70 S740 97 760 91 L760 250 L0 250 Z" />
        <path className="line" d="M0 216 C45 220 68 205 104 207 S167 184 205 190 S260 155 300 162 S349 125 386 136 S438 90 476 102 S520 49 558 59 S605 30 642 42 S687 23 714 70 S740 97 760 91" />
        <line className="event-line" x1="714" y1="12" x2="714" y2="231" />
        <circle className="event-dot" cx="714" cy="70" r="5" />
      </svg>
      <div className="chart-event" style={{ left: "79%" }}><b>财报前夕</b><span>波动骤升</span></div>
      <div className="chart-axis"><span>12M ago</span><span>9M</span><span>6M</span><span>3M</span><span>Now</span></div>
    </div>
  );
}
