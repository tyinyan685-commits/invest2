import "server-only";
import {
  debateStageSchema,
  executionStageSchema,
  fundamentalStageSchema,
  newsStageSchema,
  portfolioStageSchema,
  researchOutputSchema,
  sentimentStageSchema,
  technicalStageSchema,
  type ResearchOutput,
} from "./types";
import { generateStagedObject } from "./staged";

export const researchStageOrder = ["fundamentals", "technical", "news", "sentiment", "debate", "execution", "portfolio"] as const;
export type ResearchStageName = typeof researchStageOrder[number];
export type StoredStages = Partial<Record<ResearchStageName, unknown>>;

const system = "你是多角色投资决策委员会中的专业研究员。必须以冻结快照为唯一事实边界，明确区分事实、推断和缺失证据。输出应详细、可审计、可用于后续角色继续研究，但不构成个性化投资建议。";

const decisionDiscipline = `\n\n【必须遵守的 MU 报告式决策纪律】\n- 先判断“公司质地 / 当前择时 / 事件状态”，再给评级；不得把风险提示直接等同于 SELL。\n- 如果公司质地强、估值/周期逻辑未被破坏，但短线缺少安全垫或临近二元事件，标准结论是 HOLD/WATCH：不追、不空、无仓者可零仓过夜，持仓者只降到能承受事件波动的规模。\n- 如果重大事件已经落地且结果强于预期，允许从 HOLD/WATCH 切到 BUY/分批买入，但必须给收盘确认、回踩承接、追高限制和失效条件。\n- SELL 只用于基本面逻辑被证伪、指引/现金流恶化、关键价位收盘跌破且上行逻辑受损，或数据明确支持的风险事件；不能仅因 trailing PE 高、内部人卖出、涨幅大或保守风险委员担忧而 SELL。\n- “无仓者不参与/不追”不是“已有持仓者立即清仓”；必须分别写无仓者、已有持仓者、做空者的动作。\n- 内部人交易若缺少 10b5-1/交易计划/动机证据，只能作为风险提示，不能写成管理层确认高估。\n- 目标价、支撑阻力和止损必须来自快照或由快照技术数据直接推导；无法确认就写待核验。`;

function base(symbol: string, snapshot: unknown) {
  return `研究标的：${symbol}\n冻结数据快照：${JSON.stringify(snapshot)}\n\n证据 ID 只能使用 fmp:quote、fmp:aftermarket、fmp:realtime、fmp:intraday、fmp:profile、fmp:financials、fmp:estimates、fmp:technicals、fmp:insiders、fmp:filings、fmp:filing-text、fmp:earnings、fmp:macro、fmp:sentiment、longbridge:quote、news:N。价格、指标、财务和事件必须来自快照；缺失数据要直说。当前价校准优先级：snapshot.marketData.longbridge（未来代理） > snapshot.marketData.realtime.current > snapshot.marketData.aftermarket.quote/trade > snapshot.marketData.quote。若 snapshot.marketData.realtime 存在，必须用 fmp:realtime/fmp:intraday 写 marketState，并让交易建议服从实时价、5分钟 EMA/RSI/MACD/VWAP/量比；日线技术指标仍用于大级别支撑阻力。若 snapshot.marketData.longbridge 存在，必须优先用 longbridge:quote 中的 lastDone、preMarketQuote、postMarketQuote、overnightQuote 校准“当前/盘前/盘后/夜盘价格”；若 snapshot.marketData.aftermarket 存在，必须用 fmp:aftermarket 校准盘前/盘后价格。若 snapshot.marketData.context.secFilingTexts 存在，必须优先读取最新 8-K/财报新闻稿正文，把其中的营收、EPS、毛利率、指引、管理层表述作为强证据。每个字段都应写出充分推理，不要把详细报告压缩成一句话。禁止杜撰借券成本、期权隐波、空头比例、用户账户规模或用户可承受亏损；快照没有期权数据时不得建议具体期权策略。内部人卖出可以作为风险信号，但若快照不能确认交易计划和动机，不得单独视为确定性卖出证据。对强周期公司不得只用 trailing PE 下结论，必须同时讨论 forward 估值、盈利周期位置、预测兑现条件和现金流。${decisionDiscipline}`;
}

export function nextResearchStage(stages: StoredStages): ResearchStageName | null {
  return researchStageOrder.find((stage) => stages[stage] === undefined) ?? null;
}

export async function runResearchStage(stage: ResearchStageName, symbol: string, snapshot: unknown, stages: StoredStages) {
  const frozen = base(symbol, snapshot);
  switch (stage) {
    case "fundamentals":
      return generateStagedObject("fundamentals_report", fundamentalStageSchema, system, `${frozen}\n\n你是基本面分析师。详细分析营收、利润、毛利率趋势，盈利质量、自由现金流、资本开支、资产负债表、估值与分析师预期。区分 trailing 与 forward 口径，指出周期性、兑现风险和最重要缺失项。judgment 给总体结论，其余字段分别完整展开。`);
    case "technical":
      return generateStagedObject("technical_report", technicalStageSchema, system, `${frozen}\n\n你是市场与技术分析师。先读取 snapshot.marketData.realtime.current 和 snapshot.marketData.realtime.intraday5Min.indicators，判断当前价、盘前/盘后价、5分钟 EMA10/EMA20、RSI14、MACD、VWAP、量比是否触发追高/回踩/转弱；再逐项解释日线 EMA10、SMA50、SMA200、MACD、RSI14、布林带、ATR14、VWMA20，并结合量比、阶段高低点判断趋势、动量、波动和量价。给出四个最重要的支撑/阻力；price 只能使用快照中的价格或由指标直接得到，无法确认则为 null。`);
    case "news":
      return generateStagedObject("news_report", newsStageSchema, system, `${frozen}\n\n你是新闻与宏观分析师。详细梳理公司公告、SEC/财报、媒体报道、下一次财报日期和未来两到三周宏观日历。去除重复报道，区分强中弱证据；不得把新闻标题推断成已证实事实。若日历或公告缺失，在 limitations 中明确说明。`);
    case "sentiment":
      return generateStagedObject("sentiment_report", sentimentStageSchema, system, `${frozen}\n\n你是情绪分析师。评估情绪方向、拥挤度、价格行为与可用社交样本的证据强度。direction、crowding、observations 和 limitations 必须用简体中文。没有期权、空头或可靠社交样本时必须把 evidenceStrength 降为 needs-checking 或 weak，明确样本局限，严禁编造 IV、空头比例、帖子数或机构仓位。`);
    case "debate":
      return generateStagedObject("bull_bear_debate", debateStageSchema, system, `${frozen}\n\n四份冻结报告：${JSON.stringify({ fundamentals: stages.fundamentals, technical: stages.technical, news: stages.news, sentiment: stages.sentiment })}\n\n进行正式多空对抗。多头与空头各提出至少三条经过证据强弱分级的完整论据，并主动承认各自最弱/最强反证。研究经理只可依据冻结快照和四份报告裁决：明确采纳、打折和否决的内容，指出当前核心矛盾究竟是质地、估值、择时还是事件风险。若是“质地强但择时/事件风险差”，裁决应表达为 HOLD/WATCH 与条件化计划，而不是 SELL。`);
    case "execution":
      return generateStagedObject("execution_and_risk", executionStageSchema, system, `${frozen}\n\n冻结分析与研究经理裁决：${JSON.stringify({ analysts: { fundamentals: stages.fundamentals, technical: stages.technical, news: stages.news, sentiment: stages.sentiment }, debate: stages.debate })}\n\n你先作为交易员制定详细的条件化执行计划，再由激进、中性、保守三位风险委员分别压力测试。计划必须包含当前姿态、分批进入/加减仓条件、事件前后规则、上下行参考、风险收益与逻辑失效条件。必须分别处理无仓者和已有持仓者：无仓者可以不追/等回踩，已有持仓者可以降风险但不能被自动等同为立即清仓。allocationPct 仅指计划仓位内部的分批比例，不能写成用户总资产、可用资金或账户净值比例；风险委员也不得建议用户总资产百分比。priceLevel 只能引用冻结数据，无法确认则 null。快照没有借券费率时不得估算借券成本；没有账户信息时不得写账户风险预算。不要保证收益。`);
    case "portfolio":
      return generateStagedObject("portfolio_decision", portfolioStageSchema, system, `${frozen}\n\n完整研究流程产物：${JSON.stringify(stages)}\n\n你是组合经理，负责最终汇总而不是重新发明事实。输出风格参考“MU 深度/决策报告”：先给一句话结论，再给评级、仓位/行动、实时市场状态、核心理由、交易计划、关键价位、风险触发、数据说明。必须填写 marketState：基于 snapshot.marketData.realtime.current 与 intraday5Min.indicators，写明当前价来源、时间、盘前/盘后/常规状态、5分钟趋势、动量、量能与是否触发追高/回踩/止损。给出 BUY/HOLD/SELL/WATCH 条件化评级、目标计划仓位描述、事件姿态、价格框架和主要风险。必须填写 decisionFramework、positionActions、scenarioDecisionPlan：decisionFramework 用“公司质地/择时/事件状态/总逻辑”解释评级；positionActions 必须分别写无仓者、已有持仓者、做空者；scenarioDecisionPlan 至少覆盖强势突破、回踩承接、逻辑失效三种情形。targetPosition 只能用空仓/观察仓/小仓/中性仓/中高计划仓等计划层级描述，不得给用户总资产或账户净值百分比；不得沿用前序角色中任何无来源的借券成本、账户风险预算、具体期权策略或确定性内部人动机。结论必须条件化，禁止使用“无论事件结果如何”一类否定未来证据的绝对表述。对强周期公司，必须平衡 trailing PE、forward 估值、周期位置和自由现金流，不得把单一静态估值直接等同于买卖信号。如果数据快照显示财报已落地且结果强劲，可以给 BUY；如果财报尚未落地且主要问题是事件风险/缺安全垫，应给 HOLD/WATCH，而不是 SELL。executiveSummary 先给结论与行动，再列 3-5 条核心理由和 3-6 个风险触发；同时生成完整的快速摘要字段。facts 至少 6 条，sections 必须覆盖基本面、技术面、新闻宏观、情绪四部分，scenarios 至少包含乐观/基准/悲观三种，dataStatus 逐类披露成功、降级或缺失。所有内容应与前述角色结论一致。`);
  }
}

export function assembleResearchOutput(stages: StoredStages): ResearchOutput {
  const portfolio = portfolioStageSchema.parse(stages.portfolio);
  return researchOutputSchema.parse({
    methodologyVersion: "deep-v2",
    ...portfolio,
    analysts: {
      fundamentals: fundamentalStageSchema.parse(stages.fundamentals),
      technical: technicalStageSchema.parse(stages.technical),
      news: newsStageSchema.parse(stages.news),
      sentiment: sentimentStageSchema.parse(stages.sentiment),
    },
    debate: debateStageSchema.parse(stages.debate),
    ...executionStageSchema.parse(stages.execution),
  });
}
