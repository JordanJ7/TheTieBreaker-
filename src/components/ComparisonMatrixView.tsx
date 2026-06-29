/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Sparkles, 
  Activity, 
  RotateCcw, 
  CheckCircle, 
  BarChart2, 
  ArrowRight,
  TrendingUp,
  Info
} from "lucide-react";
import { Decision } from "../types";

interface ComparisonMatrixViewProps {
  decision: Decision;
  onTriggerAI: () => void;
  isGenerating: boolean;
}

export default function ComparisonMatrixView({
  decision,
  onTriggerAI,
  isGenerating
}: ComparisonMatrixViewProps) {
  const analysis = decision.comparisonAnalysis;

  if (!analysis) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4 animate-fade-in" id="matrix-no-analysis-state">
        <div className="p-4 bg-zinc-800 text-orange-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <BarChart2 className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-sans font-bold text-lg text-white">Comparison Matrix Not Configured</h3>
        <p className="text-zinc-400 text-sm">
          Run Multi-Criteria Decision Analysis (MCDA). This creates a structured evaluation matrix scoring each option against your criteria, complete with rationale.
        </p>
        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-lg text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-orange-500/10"
          id="btn-gen-matrix-tab"
        >
          {isGenerating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Grading Matrix...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Construct Matrix
            </>
          )}
        </button>
      </div>
    );
  }

  // Calculate weighted score in real-time using current criteria weights from decision!
  // This allows the user to slide weights in "Overview" and see this update dynamically!
  const calculateWeightedScore = (optionId: string) => {
    let totalScore = 0;
    let totalWeight = 0;

    analysis.rows.forEach((row) => {
      // Find current weight in decision criteria
      const currentCrit = decision.criteria.find(c => c.name.toLowerCase() === row.criteriaName.toLowerCase());
      const weight = currentCrit ? currentCrit.weight : row.criteriaWeight;

      const evalItem = row.evaluations.find(e => e.optionId === optionId);
      if (evalItem) {
        totalScore += evalItem.score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? parseFloat((totalScore / totalWeight).toFixed(2)) : 0;
  };

  // Find high score option
  const optionScores = decision.options.map((opt) => ({
    id: opt.id,
    name: opt.name,
    score: calculateWeightedScore(opt.id)
  }));

  const sortedScores = [...optionScores].sort((a, b) => b.score - a.score);
  const winningOptionId = sortedScores[0]?.id;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    if (score >= 6) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (score >= 4) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  return (
    <div className="space-y-6" id="matrix-view-root">
      {/* Header and Control */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="matrix-ribbon">
        <div className="flex items-center gap-2 text-zinc-400">
          <Info className="w-4 h-4 text-orange-400" />
          <span className="text-xs">Adjust weights in the <b>Overview</b> tab to see weighted scores recalculate dynamically!</span>
        </div>
        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-zinc-850 border border-zinc-700 px-3 py-2 rounded-lg cursor-pointer ml-auto"
          id="btn-re-gen-matrix"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Recalculate with AI
        </button>
      </div>

      {/* MCDA Leaderboard Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="matrix-dashboard">
        {decision.options.map((opt) => {
          const score = calculateWeightedScore(opt.id);
          const isWinner = opt.id === winningOptionId && score > 0;
          return (
            <div 
              key={opt.id}
              className={`p-5 rounded-xl border relative transition-all ${
                isWinner 
                  ? "bg-gradient-to-br from-zinc-900 to-zinc-950 border-orange-500/30 shadow-md ring-1 ring-orange-500/10" 
                  : "bg-zinc-900 border-zinc-800"
              }`}
              id={`leaderboard-${opt.id}`}
            >
              {isWinner && (
                <span className="absolute top-3 right-3 bg-orange-500 text-zinc-950 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-2.5 h-2.5" /> Best Choice
                </span>
              )}
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Weighted MCDA Index</span>
              <h4 className="font-bold text-zinc-200 text-sm mt-1 mb-2 truncate pr-16">{opt.name}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{score}</span>
                <span className="text-xs text-zinc-500">/ 10</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Decision Matrix Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden" id="matrix-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="matrix-table">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-850">
                <th className="p-4 text-xs font-extrabold text-zinc-400 uppercase tracking-wider w-1/3">Evaluation Criteria</th>
                <th className="p-4 text-xs font-extrabold text-zinc-400 uppercase tracking-wider text-center w-16">Weight</th>
                {decision.options.map((opt) => (
                  <th key={opt.id} className="p-4 text-xs font-extrabold text-zinc-400 uppercase tracking-wider text-center">
                    {opt.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-sm">
              {analysis.rows.map((row, idx) => {
                // Fetch dynamic weight from current user adjustments
                const currentCrit = decision.criteria.find(c => c.name.toLowerCase() === row.criteriaName.toLowerCase());
                const weight = currentCrit ? currentCrit.weight : row.criteriaWeight;

                return (
                  <tr key={idx} className="hover:bg-zinc-950/40 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-zinc-200">{row.criteriaName}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-orange-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded">
                        {weight}x
                      </span>
                    </td>
                    {decision.options.map((opt) => {
                      const evalItem = row.evaluations.find(e => e.optionId === opt.id);
                      return (
                        <td key={opt.id} className="p-4">
                          <div className="flex flex-col items-center space-y-1 text-center">
                            {evalItem ? (
                              <>
                                <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${getScoreColor(evalItem.score)}`}>
                                  {evalItem.score}
                                </span>
                                <span className="text-[11px] text-zinc-450 max-w-xs mt-1 leading-snug">
                                  {evalItem.rationale}
                                </span>
                              </>
                            ) : (
                              <span className="text-zinc-700 text-xs">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              
              {/* Bottom Row: Aggregated MCDA Indices */}
              <tr className="bg-zinc-950 font-semibold border-t-2 border-zinc-850">
                <td className="p-4">
                  <div className="font-bold text-white uppercase text-xs tracking-wider">Final Weighted Score</div>
                </td>
                <td className="p-4 text-center">—</td>
                {decision.options.map((opt) => {
                  const score = calculateWeightedScore(opt.id);
                  return (
                    <td key={opt.id} className="p-4 text-center">
                      <span className="text-lg font-black text-white block">
                        {score} <span className="text-xs font-normal text-zinc-500">/ 10</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Rationale and AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="matrix-insights">
        {analysis.summary && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2" id="matrix-summary-card">
            <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Evaluation Summary</h4>
            <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">{analysis.summary}</p>
          </div>
        )}
        {analysis.recommendation && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2" id="matrix-recommendation-card">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Definitive Multi-Criteria Recommendation
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">{analysis.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
