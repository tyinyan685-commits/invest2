export type EvidenceStrength = "强" | "中" | "弱" | "待核验";

export const decisionReport = {
  symbol: "MU",
  company: "Micron Technology",
  exchange: "NASDAQ",
  title: "美光科技：好公司，错误时点",
  date: "2026-06-24",
  asOf: "2026-06-23 美股收盘",
  price: "$1,051.77",
  change: "-13.0%",
  rating: "持有",
  ratingEn: "HOLD",
  confidence: 78,
  summary:
    "美光正处于 HBM / DRAM 盈利兑现期，基本面真实、前瞻估值不贵；但股价一年上涨超过三倍，数小时后又将面对财报二元事件。此刻最有价值的动作不是猜方向，而是让事件先发生。",
  stance: [
    ["不追", "历史高位、零安全垫，财报前追多更像押注事件。"],
    ["不空", "结构性赢家仍可能超预期，裸空的损失分布不对称。"],
    ["不清", "长期逻辑尚未破坏，板块错杀不等于公司基本面转差。"],
  ],
  reasons: [
    {
      title: "质地强，前瞻估值并不贵",
      body: "最近半年营收同比增长 123.7%，净利率 41.5%，ROE 39.8%。高达 138 倍的 trailing PE 被上一轮低谷季度扭曲，当前盈利运行率对应的前瞻 PE 约 18 倍。",
      evidence: "强" as EvidenceStrength,
    },
    {
      title: "当前价格几乎没有安全垫",
      body: "年内涨幅 233.6%，卖方目标价共识已低于现价。好消息需要明显超预期才可能推动下一轮重估，符合预期也可能触发获利兑现。",
      evidence: "中" as EvidenceStrength,
    },
    {
      title: "财报是高波动的二元事件",
      body: "期权隐含单日波动约 ±13–17%，多头情绪拥挤。报告选择把方向确认交给财报后的价格与指引，而不是在结果公布前承担无补偿的缺口风险。",
      evidence: "中" as EvidenceStrength,
    },
  ],
  levels: [
    { label: "上方确认", value: "$1,125", tone: "up" },
    { label: "现价锚", value: "$1,051.77", tone: "now" },
    { label: "趋势中枢", value: "$1,003", tone: "warn" },
    { label: "逻辑失效", value: "$879", tone: "down" },
  ],
  scenarios: [
    {
      label: "A",
      title: "Beat + 强指引",
      trigger: "收复并站稳 $1,125",
      action: "确认后分批研究，观察 $1,213 → $1,300 区间。",
      probability: "35%",
    },
    {
      label: "B",
      title: "Sell the news",
      trigger: "回落但基本面逻辑未破",
      action: "重点观察 $965 / $920 / $879 的承接与收盘确认。",
      probability: "45%",
    },
    {
      label: "C",
      title: "指引转弱",
      trigger: "收盘跌破 $879",
      action: "上行逻辑受损，不用“便宜了”替代事实核验。",
      probability: "20%",
    },
  ],
};

export const latestResearch = [
  {
    kind: "决策摘要",
    title: "美光科技：好公司，错误时点",
    symbol: "MU",
    rating: "持有",
    date: "2026-06-24",
    excerpt: "让财报先发生，再用价格确认决定仓位节奏。",
    href: "/research/mu-2026-06-24",
  },
  {
    kind: "市场扫描",
    title: "AI 内存超周期进入拥挤区",
    symbol: "US Market",
    rating: "5 个候选",
    date: "2026-06-16",
    excerpt: "强催化与机械价值评分出现分叉，先修正评分再排公司。",
    href: "/market/2026-06-16",
  },
  {
    kind: "深度研究",
    title: "美光科技：质地一档，节奏优先",
    symbol: "MU",
    rating: "买入研究",
    date: "2026-06-13",
    excerpt: "基本面与趋势共振，但事件前不应把确定性误当成低波动。",
    href: "/research/mu-2026-06-24",
  },
];

export const marketCandidates = [
  { rank: 1, symbol: "PATH", score: 8.0, signal: "深回撤价值", caveat: "缺少离散催化，价值分被普涨行情抬高。" },
  { rank: 2, symbol: "FOXA", score: 7.75, signal: "并购重定价", caveat: "超卖不是安全边际，交易结构仍需核验。" },
  { rank: 3, symbol: "SNAP", score: 7.5, signal: "高 beta 反弹", caveat: "贴近均线但广告结构逆风未解决。" },
  { rank: 4, symbol: "SOFI", score: 5.66, signal: "左侧观察", caveat: "利率敏感，FOMC 前没有个股催化。" },
  { rank: 5, symbol: "SPCX", score: 5.5, signal: "IPO 动量", caveat: "情绪极度拥挤，追高风险大于基本面上修。" },
];
