export function buildDecisionReportPrompt(symbol: string, snapshot: unknown) {
  return `
请严格按照下述“多角色投资决策报告”流程，用简体中文分析 ${symbol}。这不是普通股票摘要，也不是产业链扫描。

数据快照：
${JSON.stringify(snapshot)}

【总原则】
1. 所有价格、指标和事件必须锚定快照的 asOf 与最近完整收盘 bar，禁止把未来数据、盘中数据和旧读数混用。
2. 财务、价格和技术指标只能引用快照；不得心算或编造快照中没有的数字。
3. 新闻只是线索。公司公告、SEC/财报、FMP 财务数据为强证据；媒体为中等；社交情绪和纯价格推断为弱证据。
4. 每个核心观点必须给 evidenceIds。可用：fmp:quote、fmp:profile、fmp:financials、fmp:estimates、fmp:technicals、fmp:insiders、fmp:filings、fmp:filing-text、fmp:earnings、fmp:macro、fmp:sentiment、longbridge:quote、news:N。
5. 数据缺失必须写入 dataStatus 与 missingEvidence，不能用模型记忆补齐。
6. 交易建议必须是条件化计划，不得保证收益；用收盘确认、财报/宏观事件和逻辑失效条件约束。
7. 必须采用用户提供的 MU 报告式决策纪律：先判断“公司质地 / 当前择时 / 事件状态”，再给评级；“不追/无仓观望”不能翻译成“已有持仓立即卖出”；SELL 只能用于基本面逻辑证伪、指引/现金流恶化、关键价位收盘跌破且上行逻辑受损，或强证据风险事件。
8. 对临近财报等二元事件：若质地强但缺少安全垫，标准表达是 HOLD/WATCH、不追、不空、无仓可零仓过夜、持仓者降到可承受事件波动；事件落地且强于预期后，才可按收盘确认、回踩承接和失效条件转为 BUY/分批买入。
9. 若数据快照包含 marketData.context.secFilingTexts，必须优先读取最新 8-K/财报新闻稿正文，把其中的营收、EPS、毛利率、指引和管理层表述作为强证据，证据 ID 写 fmp:filing-text。
10. 若数据快照包含 marketData.longbridge，必须优先用其中的 lastDone、preMarketQuote、postMarketQuote、overnightQuote 校准当前/盘前/盘后/夜盘价格；技术指标仍以 FMP 日线为准。证据 ID 写 longbridge:quote。

【按顺序完成内部研究流程】
A. 四份冻结分析师报告
- 市场分析师：趋势、动量、波动、量价；必须解释 EMA10、SMA50、SMA200、MACD、RSI14、布林带、ATR14、VWMA20，并给关键支撑/阻力及其含义。
- 基本面分析师：营收/利润/毛利率趋势、现金流、资本开支、资产负债表、估值、分析师预期；指出 trailing 与 forward 口径差异和盈利兑现风险。
- 新闻分析师：公司事件、财报日期、未来两到三周宏观事件、利好/利空与证据强弱；不得把重复报道当多条独立证据。
- 情绪分析师：方向、拥挤度、样本和局限。没有社交/期权数据时必须降级，不得编造 IV、空头比例或帖子数量。

B. 多空对抗
- 多头至少三条论据，每条带强度与 evidenceIds，并承认最弱环节。
- 空头至少三条最强反方理由，每条带强度与 evidenceIds，并承认最强支撑。

C. 研究经理裁决
- 明确采纳哪些多头事实、打折哪些外推、采纳哪些空头风险；解释当前最重要矛盾是质地、估值、择时还是事件风险。

D. 交易员执行计划
- 给当前姿态、分批研究/建仓条件、加减仓条件、事件前后规则、上行参考、下行参考和最终失效条件。
- allocationPct 是相对于“计划仓位”的比例，不是用户总资产；无法合理给出时用 null。
- priceLevel 只能引用或由技术数据直接推导，不能随意给目标价。

E. 风险三方压力测试
- 激进派：指出计划可能过度保守之处和放大回报的代价。
- 中性派：校准读数、价格触发和节奏。
- 保守派：描述跳空、估值压缩或宏观叠加的最坏情形与防守方式。

F. 组合经理最终决策
- 给 BUY / HOLD / SELL / WATCH、目标计划仓位描述、事件姿态、价格框架和至少三条主要风险。
- 必须额外给 decisionFramework、positionActions、scenarioDecisionPlan：前者拆分公司质地/择时/事件状态，第二项拆分无仓者/已有持仓者/做空者，第三项给强势突破、回踩承接、逻辑失效等情景动作。

【输出】
只输出 JSON，必须满足调用方 schema。methodologyVersion 固定为 deep-v2。
顶层 facts、sections、scenarios、risks、missingEvidence 用于快速摘要；它们必须与详细分析一致。
executiveSummary 放最重要的三到五条理由和三到六个风险触发。
analysts、debate、riskPanel、tradePlan、portfolioManager、dataStatus、nextChecks 必须全部填写。
所有叙述性字符串必须为简体中文，股票代码、公司/产品名、评级字母和 evidenceIds 除外。

【精确 JSON 契约】
必须逐字使用下列键名和枚举值，不得改名、漏项或增加 Markdown 代码围栏。示例中的中文说明必须替换为本次研究内容：
枚举只能从这些值中选择：rating = buy-research/hold/avoid/needs-checking；strength = strong/medium/weak；severity = high/medium/low；evidenceStrength = strong/medium/weak/needs-checking；finalRating = BUY/HOLD/SELL/WATCH；status = success/degraded/missing。
{
  "methodologyVersion": "deep-v2",
  "headline": "中文标题",
  "summary": "中文摘要",
  "rating": "hold",
  "confidence": 0,
  "facts": [{ "claim": "中文事实", "sourceIds": ["fmp:quote"], "strength": "medium" }],
  "sections": [{ "title": "中文小节", "judgment": "中文判断", "evidenceIds": ["fmp:financials"] }],
  "scenarios": [{ "name": "中文情景", "condition": "中文条件", "interpretation": "中文解释" }],
  "risks": [{ "condition": "中文风险条件", "consequence": "中文后果" }],
  "missingEvidence": ["中文缺失项"],
  "executiveSummary": {
    "oneSentence": "中文一句话结论",
    "positionAction": "中文当前行动",
    "coreReasons": [{ "point": "中文理由", "evidenceIds": ["fmp:technicals"], "strength": "medium" }],
    "riskTriggers": [{ "condition": "中文触发条件", "response": "中文应对", "severity": "medium" }]
  },
  "analysts": {
    "fundamentals": { "judgment": "中文", "quality": "中文", "earningsTrend": "中文", "valuation": "中文", "estimates": "中文", "cashFlowAndBalanceSheet": "中文", "evidenceIds": ["fmp:financials"], "mainRisk": "中文" },
    "technical": { "judgment": "中文", "trend": "中文", "momentum": "中文", "volatility": "中文", "volumePrice": "中文", "keyLevels": [{ "label": "中文", "price": null, "meaning": "中文" }], "evidenceIds": ["fmp:technicals"] },
    "news": { "judgment": "中文", "companyEvents": ["中文"], "macroEvents": ["中文"], "nextCatalysts": ["中文"], "evidenceIds": ["news:0"], "limitations": "中文" },
    "sentiment": { "direction": "中文", "crowding": "中文", "evidenceStrength": "needs-checking", "observations": ["中文"], "limitations": "中文" }
  },
  "debate": {
    "bull": { "arguments": [{ "point": "中文", "strength": "medium", "evidenceIds": ["fmp:financials"] }], "weakestPoint": "中文" },
    "bear": { "arguments": [{ "point": "中文", "strength": "medium", "evidenceIds": ["fmp:technicals"] }], "strongestCounterpoint": "中文" },
    "managerVerdict": { "verdict": "中文", "acceptedBull": "中文", "discountedBull": "中文", "acceptedBear": "中文", "decisionLogic": "中文" }
  },
  "riskPanel": {
    "aggressive": { "position": "中文", "rationale": "中文", "cost": "中文" },
    "neutral": { "position": "中文", "rationale": "中文", "calibration": "中文" },
    "conservative": { "position": "中文", "worstCase": "中文", "protection": "中文" }
  },
  "tradePlan": {
    "posture": "中文", "currentAction": "中文",
    "entrySteps": [{ "condition": "中文", "action": "中文", "allocationPct": null, "priceLevel": null }],
    "reduceSteps": [{ "condition": "中文", "action": "中文", "priceLevel": null }],
    "eventRules": ["中文"], "upsideReferences": [], "downsideReferences": [], "invalidation": "中文", "riskReward": "中文"
  },
  "decisionFramework": {
    "companyQuality": { "label": "优质/一般/转弱", "rationale": "中文" },
    "timingState": { "label": "有利/中性/错误时点/待确认", "rationale": "中文" },
    "eventRegime": { "label": "事件前/事件已落地/高波动二元事件/常态", "rationale": "中文" },
    "overallLogic": "中文"
  },
  "positionActions": {
    "noPosition": { "preEvent": "中文", "overnight": "中文", "postEventPlan": ["中文"] },
    "existingHolder": { "preEventAction": "中文", "maxEventRisk": "中文", "postEventPlan": ["中文"] },
    "shortSeller": { "allowed": false, "rationale": "中文" }
  },
  "scenarioDecisionPlan": [
    { "name": "中文情景", "trigger": "中文触发", "action": "中文动作", "invalidation": "中文失效条件" }
  ],
  "portfolioManager": {
    "finalRating": "WATCH", "ratingReason": "中文", "targetPosition": "中文", "actionSummary": "中文", "eventStance": "中文", "priceFramework": "中文", "topRisks": ["中文风险一", "中文风险二", "中文风险三"]
  },
  "dataStatus": [{ "category": "中文类别", "source": "中文来源", "status": "success", "notes": "中文" }],
  "nextChecks": ["中文核验动作"]
}
`;
}
