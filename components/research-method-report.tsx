import { AlertTriangle, CheckCircle2, Gauge, Shield, Swords, Target } from "lucide-react";
import type { ResearchOutput } from "@/lib/llm";

export function ResearchMethodReport({ analysis }: { analysis: ResearchOutput }) {
  if (analysis.methodologyVersion !== "deep-v2") return null;
  const analystCards = [
    ["基本面分析师", analysis.analysts.fundamentals.judgment, [analysis.analysts.fundamentals.quality, analysis.analysts.fundamentals.earningsTrend, analysis.analysts.fundamentals.valuation, analysis.analysts.fundamentals.estimates, analysis.analysts.fundamentals.cashFlowAndBalanceSheet, `主要风险：${analysis.analysts.fundamentals.mainRisk}`]],
    ["市场分析师", analysis.analysts.technical.judgment, [analysis.analysts.technical.trend, analysis.analysts.technical.momentum, analysis.analysts.technical.volatility, analysis.analysts.technical.volumePrice]],
    ["新闻分析师", analysis.analysts.news.judgment, [...analysis.analysts.news.companyEvents, ...analysis.analysts.news.macroEvents, ...analysis.analysts.news.nextCatalysts, `局限：${analysis.analysts.news.limitations}`]],
    ["情绪分析师", `${analysis.analysts.sentiment.direction} · ${analysis.analysts.sentiment.crowding}`, [...analysis.analysts.sentiment.observations, analysis.analysts.sentiment.limitations]],
  ] as const;

  return <div className="method-report">
    <section className="method-decision">
      <div className="method-decision-rating"><span>组合经理最终评级</span><strong>{analysis.portfolioManager.finalRating}</strong><b>{analysis.portfolioManager.targetPosition}</b></div>
      <div><span className="section-kicker">FINAL DECISION</span><h2>{analysis.executiveSummary.oneSentence}</h2><p>{analysis.portfolioManager.ratingReason}</p><div className="decision-action"><Target size={16} /><b>{analysis.executiveSummary.positionAction}</b><span>{analysis.portfolioManager.eventStance}</span></div><div className="portfolio-detail"><p><b>执行摘要</b>{analysis.portfolioManager.actionSummary}</p><p><b>价格框架</b>{analysis.portfolioManager.priceFramework}</p><p><b>首要风险</b>{analysis.portfolioManager.topRisks.join("；")}</p></div></div>
    </section>

    <section className="method-grid-block">
      <div><h3><CheckCircle2 /> 核心理由</h3>{analysis.executiveSummary.coreReasons.map((reason, index) => <article className="method-evidence-row" key={`${reason.point}-${index}`}><b>{index + 1}</b><p>{reason.point}<small>{reason.strength} · {reason.evidenceIds.join(" · ")}</small></p></article>)}</div>
      <div><h3><AlertTriangle /> 风险触发</h3>{analysis.executiveSummary.riskTriggers.map((trigger, index) => <article className="method-trigger-row" key={`${trigger.condition}-${index}`}><b className={`severity-${trigger.severity}`}>{trigger.severity}</b><p><strong>{trigger.condition}</strong>{trigger.response}</p></article>)}</div>
    </section>

    <section className="method-section">
      <div className="method-heading"><span className="section-kicker">EXECUTION PLAN</span><h2>交易员 · 条件化研究计划</h2><p>{analysis.tradePlan.posture} · {analysis.tradePlan.currentAction}</p></div>
      <div className="plan-table">
        <div className="plan-head"><span>类型</span><span>触发条件</span><span>研究动作</span><span>计划仓位</span><span>价格</span></div>
        {analysis.tradePlan.entrySteps.map((step, index) => <div className="plan-row" key={`entry-${index}`}><b>增加</b><span>{step.condition}</span><span>{step.action}</span><span>{step.allocationPct === null ? "按风险定" : `${step.allocationPct}%`}</span><span>{step.priceLevel === null ? "-" : step.priceLevel.toLocaleString()}</span></div>)}
        {analysis.tradePlan.reduceSteps.map((step, index) => <div className="plan-row plan-reduce" key={`reduce-${index}`}><b>降低</b><span>{step.condition}</span><span>{step.action}</span><span>-</span><span>{step.priceLevel === null ? "-" : step.priceLevel.toLocaleString()}</span></div>)}
      </div>
      <div className="plan-notes"><p><b>事件规则</b>{analysis.tradePlan.eventRules.join("；")}</p><p><b>上行参考</b>{analysis.tradePlan.upsideReferences.length ? analysis.tradePlan.upsideReferences.join(" / ") : "待核验"}</p><p><b>下行参考</b>{analysis.tradePlan.downsideReferences.length ? analysis.tradePlan.downsideReferences.join(" / ") : "待核验"}</p><p><b>逻辑失效</b>{analysis.tradePlan.invalidation}</p><p><b>风险收益</b>{analysis.tradePlan.riskReward}</p></div>
    </section>

    <section className="method-section">
      <div className="method-heading"><span className="section-kicker">FROZEN ANALYST REPORTS</span><h2>四份冻结分析师报告</h2></div>
      <div className="analyst-cards">{analystCards.map(([name, judgment, details]) => <article key={name}><span>{name}</span><h3>{judgment}</h3>{details.filter(Boolean).map((detail, index) => <p key={`${name}-${index}`}>{detail}</p>)}</article>)}</div>
      {analysis.analysts.technical.keyLevels.length > 0 && <div className="key-levels"><b>技术关键位</b>{analysis.analysts.technical.keyLevels.map((level) => <span key={`${level.label}-${level.price}`}>{level.label}<strong>{level.price === null ? "待核验" : level.price.toLocaleString()}</strong><small>{level.meaning}</small></span>)}</div>}
    </section>

    <section className="method-section">
      <div className="method-heading"><span className="section-kicker">BULL / BEAR DEBATE</span><h2>多空对抗与研究经理裁决</h2></div>
      <div className="debate-grid"><article className="bull-card"><h3><Swords /> 多头研究员</h3>{analysis.debate.bull.arguments.map((argument, index) => <p key={`bull-${index}`}><b>{argument.strength}</b>{argument.point}<small>{argument.evidenceIds.join(" · ")}</small></p>)}<footer>最弱环节：{analysis.debate.bull.weakestPoint}</footer></article><article className="bear-card"><h3><Shield /> 空头研究员</h3>{analysis.debate.bear.arguments.map((argument, index) => <p key={`bear-${index}`}><b>{argument.strength}</b>{argument.point}<small>{argument.evidenceIds.join(" · ")}</small></p>)}<footer>承认的最强支撑：{analysis.debate.bear.strongestCounterpoint}</footer></article></div>
      <div className="manager-verdict"><Gauge /><div><span>研究经理裁决</span><h3>{analysis.debate.managerVerdict.verdict}</h3><p>{analysis.debate.managerVerdict.decisionLogic}</p><small>采纳多头：{analysis.debate.managerVerdict.acceptedBull}　·　打折：{analysis.debate.managerVerdict.discountedBull}　·　采纳空头：{analysis.debate.managerVerdict.acceptedBear}</small></div></div>
    </section>

    <section className="method-section">
      <div className="method-heading"><span className="section-kicker">RISK COMMITTEE</span><h2>风险三方压力测试</h2></div>
      <div className="risk-panel"><article><span>激进派</span><h3>{analysis.riskPanel.aggressive.position}</h3><p>{analysis.riskPanel.aggressive.rationale}</p><small>代价：{analysis.riskPanel.aggressive.cost}</small></article><article><span>中性派</span><h3>{analysis.riskPanel.neutral.position}</h3><p>{analysis.riskPanel.neutral.rationale}</p><small>校准：{analysis.riskPanel.neutral.calibration}</small></article><article><span>保守派</span><h3>{analysis.riskPanel.conservative.position}</h3><p>{analysis.riskPanel.conservative.worstCase}</p><small>防守：{analysis.riskPanel.conservative.protection}</small></article></div>
    </section>

    <section className="method-section data-status-section">
      <div className="method-heading"><span className="section-kicker">DATA STATUS</span><h2>数据完整性与下一步核验</h2></div>
      <div className="data-status-table">{analysis.dataStatus.map((row, index) => <div key={`${row.category}-${index}`}><b>{row.category}</b><span>{row.source}</span><em className={`status-${row.status}`}>{row.status}</em><p>{row.notes}</p></div>)}</div>
      <div className="next-checks"><b>下一步</b><ol>{analysis.nextChecks.map((check) => <li key={check}>{check}</li>)}</ol></div>
    </section>
  </div>;
}
