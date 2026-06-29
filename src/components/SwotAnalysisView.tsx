/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  Activity, 
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Decision } from "../types";

interface SwotAnalysisViewProps {
  decision: Decision;
  onTriggerAI: () => void;
  isGenerating: boolean;
}

export default function SwotAnalysisView({
  decision,
  onTriggerAI,
  isGenerating
}: SwotAnalysisViewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    decision.options[0]?.id || ""
  );

  const analysis = decision.swotAnalysis;

  if (!analysis) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4 animate-fade-in" id="swot-no-analysis-state">
        <div className="p-4 bg-zinc-800 text-orange-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <Briefcase className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-sans font-bold text-lg text-white">SWOT Analysis Not Generated</h3>
        <p className="text-zinc-400 text-sm">
          Generate a comprehensive SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) to map the internal pros/cons and external risks/opportunities of each choice.
        </p>
        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-lg text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-orange-500/10"
          id="btn-gen-swot-tab"
        >
          {isGenerating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Sifting Quadrants...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate SWOT Grid
            </>
          )}
        </button>
      </div>
    );
  }

  const currentOptionSWOT = analysis.optionsSWOT.find(
    (os) => os.optionId === selectedOptionId
  ) || analysis.optionsSWOT[0];

  const currentOptionName = decision.options.find(
    (o) => o.id === selectedOptionId
  )?.name || "Selected Option";

  return (
    <div className="space-y-6" id="swot-view-root">
      {/* Option Ribbon Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="swot-ribbon">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analyze Option:</span>
          <div className="flex gap-2" id="swot-option-selector">
            {decision.options.map((opt) => {
              const isSelected = opt.id === selectedOptionId;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-850 border-zinc-700 text-white shadow-sm"
                      : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                  id={`btn-swot-select-${opt.id}`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-zinc-850 border border-zinc-700 px-3 py-2 rounded-lg cursor-pointer"
          id="btn-re-gen-swot"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Re-Analyze with AI
        </button>
      </div>

      {/* SWOT 2x2 Bento Matrix */}
      {currentOptionSWOT ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="swot-2x2-grid">
          {/* S - Strengths */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4" id="swot-strengths">
            <h3 className="font-sans font-bold text-sm text-orange-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-3">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              S. Strengths <span className="text-[10px] font-normal text-zinc-500 tracking-normal normal-case ml-1">(Internal / Helpful)</span>
            </h3>
            <ul className="space-y-2.5 list-disc list-inside text-sm text-zinc-300 pl-1 marker:text-orange-500">
              {currentOptionSWOT.swot.strengths.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="font-medium text-zinc-200 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* W - Weaknesses */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4" id="swot-weaknesses">
            <h3 className="font-sans font-bold text-sm text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-3">
              <AlertTriangle className="w-5 h-5 text-indigo-400" />
              W. Weaknesses <span className="text-[10px] font-normal text-zinc-500 tracking-normal normal-case ml-1">(Internal / Harmful)</span>
            </h3>
            <ul className="space-y-2.5 list-disc list-inside text-sm text-zinc-300 pl-1 marker:text-indigo-400">
              {currentOptionSWOT.swot.weaknesses.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="font-medium text-zinc-200 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* O - Opportunities */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4" id="swot-opportunities">
            <h3 className="font-sans font-bold text-sm text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-3">
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
              O. Opportunities <span className="text-[10px] font-normal text-zinc-500 tracking-normal normal-case ml-1">(External / Helpful)</span>
            </h3>
            <ul className="space-y-2.5 list-disc list-inside text-sm text-zinc-300 pl-1 marker:text-blue-500">
              {currentOptionSWOT.swot.opportunities.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="font-medium text-zinc-200 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* T - Threats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4" id="swot-threats">
            <h3 className="font-sans font-bold text-sm text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-3">
              <Flame className="w-5 h-5 text-rose-400" />
              T. Threats <span className="text-[10px] font-normal text-zinc-500 tracking-normal normal-case ml-1">(External / Harmful)</span>
            </h3>
            <ul className="space-y-2.5 list-disc list-inside text-sm text-zinc-300 pl-1 marker:text-rose-500">
              {currentOptionSWOT.swot.threats.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="font-medium text-zinc-200 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 py-6">No SWOT data found for this option.</div>
      )}

      {/* SWOT-Based Strategic Advice */}
      {analysis.strategicAdvice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3 animate-fade-in" id="swot-advice-card">
          <div className="flex items-center gap-2 text-orange-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">SWOT-Based Strategic Actions</span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
            {analysis.strategicAdvice}
          </p>
        </div>
      )}
    </div>
  );
}
