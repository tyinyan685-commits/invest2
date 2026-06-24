export function buildDecisionReportPrompt(symbol: string, snapshot: unknown) {
  return `
请严格按照下述“多角色投资决策报告”流程，用简体中文分析 ${symbol}。这不是普通股票摘要，也不是产业链扫描。

数据快照：
${JSON.stringify(snapshot)}

【总原则】
1. 所有价格、指标和事件必须锚定快照的 asOf 与最近完整收盘 bar，禁止把未来数据、盘中数据和旧读数混用。
2. 财务、价格和技术指标只能引用快照；不得心算或编造快照中没有的数字。
3. 新闻只是线索。公司公告、SEC/财报、FMP 财务数据为强证据；媒体为中等；社交情绪和纯价格推断为弱证据。
4. 每个核心观点必须给 evidenceIds。可用：fmp:quote、fmp:profile、fmp:financials、fmp:technicals、fmp:insiders、fmp:filings、fmp:earnings、fmp:macro、fmp:sentiment、news:N。
5. 数据缺失必须写入 dataStatus 与 missingEvidence，不能用模型记忆补齐。
6. 交易建议必须是条件化计划，不得保证收益；用收盘确认、财报/宏观事件和逻辑失效条件约束。

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

【输出】
只输出 JSON，必须满足调用方 schema。methodologyVersion 固定为 deep-v2。
顶层 facts、sections、scenarios、risks、missingEvidence 用于快速摘要；它们必须与详细分析一致。
executiveSummary 放最重要的三到五条理由和三到六个风险触发。
analysts、debate、riskPanel、tradePlan、portfolioManager、dataStatus、nextChecks 必须全部填写。
所有叙述性字符串必须为简体中文，股票代码、公司/产品名、评级字母和 evidenceIds 除外。
`;
}
