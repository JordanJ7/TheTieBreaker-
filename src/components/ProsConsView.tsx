/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Plus, 
  Trash2, 
  Activity, 
  Scale,
  Check,
  RotateCcw
} from "lucide-react";
import { Decision, OptionProsCons, ProConItem } from "../types";

interface ProsConsViewProps {
  decision: Decision;
  onUpdateDecision: (updated: Decision) => void;
  onTriggerAI: () => void;
  isGenerating: boolean;
}

export default function ProsConsView({
  decision,
  onUpdateDecision,
  onTriggerAI,
  isGenerating
}: ProsConsViewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    decision.options[0]?.id || ""
  );

  // Form states for manual additions
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("General");
  const [newItemImpact, setNewItemImpact] = useState(3);
  const [newItemIsPro, setNewItemIsPro] = useState(true);

  const analysis = decision.prosConsAnalysis;

  if (!analysis) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4 animate-fade-in" id="pc-no-analysis-state">
        <div className="p-4 bg-zinc-800 text-orange-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <Scale className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-sans font-bold text-lg text-white">Pros & Cons List Not Generated</h3>
        <p className="text-zinc-400 text-sm">
          Generate an AI-driven, weighted Pros & Cons analysis. Gemini will evaluate financial, social, and logistical outcomes for each of your options.
        </p>
        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-lg text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-orange-500/10"
          id="btn-gen-proscons-tab"
        >
          {isGenerating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Generating Analysis...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Pros & Cons
            </>
          )}
        </button>
      </div>
    );
  }

  // Find the selected option analysis
  const currentOptionAnalysis = analysis.optionsAnalysis.find(
    (oa) => oa.optionId === selectedOptionId
  ) || analysis.optionsAnalysis[0];

  const currentOptionName = decision.options.find(
    (o) => o.id === selectedOptionId
  )?.name || "Selected Option";

  // Handle adding custom pro/con
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !currentOptionAnalysis) return;

    const newItem: ProConItem = {
      id: `pc-manual-${Date.now()}`,
      text: newItemText.trim(),
      impact: newItemImpact,
      isPro: newItemIsPro,
      category: newItemCategory,
      rationale: "Added manually by the decider."
    };

    const updatedOptionsAnalysis = analysis.optionsAnalysis.map((oa) => {
      if (oa.optionId === selectedOptionId) {
        const newItems = [...oa.items, newItem];
        // Re-calculate balance score
        const prosWeight = newItems.filter((i) => i.isPro).reduce((acc, i) => acc + i.impact, 0);
        const consWeight = newItems.filter((i) => !i.isPro).reduce((acc, i) => acc + i.impact, 0);
        return {
          ...oa,
          items: newItems,
          score: prosWeight - consWeight
        };
      }
      return oa;
    });

    onUpdateDecision({
      ...decision,
      prosConsAnalysis: {
        ...analysis,
        optionsAnalysis: updatedOptionsAnalysis
      }
    });

    setNewItemText("");
    setNewItemImpact(3);
  };

  // Delete an item
  const handleDeleteItem = (itemId: string) => {
    if (!currentOptionAnalysis) return;

    const updatedOptionsAnalysis = analysis.optionsAnalysis.map((oa) => {
      if (oa.optionId === selectedOptionId) {
        const newItems = oa.items.filter((i) => i.id !== itemId);
        const prosWeight = newItems.filter((i) => i.isPro).reduce((acc, i) => acc + i.impact, 0);
        const consWeight = newItems.filter((i) => !i.isPro).reduce((acc, i) => acc + i.impact, 0);
        return {
          ...oa,
          items: newItems,
          score: prosWeight - consWeight
        };
      }
      return oa;
    });

    onUpdateDecision({
      ...decision,
      prosConsAnalysis: {
        ...analysis,
        optionsAnalysis: updatedOptionsAnalysis
      }
    });
  };

  const pros = currentOptionAnalysis?.items.filter((item) => item.isPro) || [];
  const cons = currentOptionAnalysis?.items.filter((item) => !item.isPro) || [];

  const totalProsWeight = pros.reduce((acc, p) => acc + p.impact, 0);
  const totalConsWeight = cons.reduce((acc, c) => acc + c.impact, 0);
  const rawBalanceScore = totalProsWeight - totalConsWeight;

  return (
    <div className="space-y-6" id="proscons-view-root">
      {/* Overview Ribbon / Selection */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="pc-ribbon">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Option:</span>
          <div className="flex gap-2" id="pc-option-selector">
            {decision.options.map((opt) => {
              const score = analysis.optionsAnalysis.find((oa) => oa.optionId === opt.id)?.score ?? 0;
              const isSelected = opt.id === selectedOptionId;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 border-zinc-700 text-white shadow-sm"
                      : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800/80 text-zinc-400"
                  }`}
                  id={`btn-pc-select-${opt.id}`}
                >
                  {opt.name}
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    score >= 0 
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {score >= 0 ? `+${score}` : score}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-zinc-850 border border-zinc-700 px-3 py-2 rounded-lg cursor-pointer"
          id="btn-re-gen-pc"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Re-Analyze with AI
        </button>
      </div>

      {/* Balance Indicator Widget */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-300 p-6 rounded-xl border border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md" id="balance-meter">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Balance Engine Evaluator</p>
          <h4 className="font-sans font-semibold text-xl text-white italic tracking-tight">
            Score Card for "{currentOptionName}"
          </h4>
          <p className="text-zinc-400 text-xs max-w-xl">
            Calculated score balances the positive impacts of Pros against the severity of Cons. A positive balance score indicates structural benefits.
          </p>
        </div>

        <div className="flex items-center gap-6" id="scores-container">
          <div className="text-center">
            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-widest block">Pros impact</span>
            <span className="text-2xl font-black text-orange-400">+{totalProsWeight}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center">
            <span className="text-[9px] text-rose-400 font-bold uppercase tracking-widest block">Cons impact</span>
            <span className="text-2xl font-black text-rose-400">-{totalConsWeight}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-center bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Net score</span>
            <span className={`text-2xl font-black ${rawBalanceScore >= 0 ? "text-orange-400" : "text-rose-400"}`}>
              {rawBalanceScore >= 0 ? `+${rawBalanceScore}` : rawBalanceScore}
            </span>
          </div>
        </div>
      </div>

      {/* Pros & Cons Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="columns-grid">
        {/* Pros Column */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4" id="pros-column">
          <h3 className="font-sans font-bold text-sm text-orange-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-3">
            <ArrowUpRight className="w-5 h-5" />
            Pros / Advantages
          </h3>

          <div className="space-y-3" id="pros-list">
            {pros.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                No positive factors listed. Use the helper form below to add a custom pro!
              </div>
            ) : (
              pros.map((item) => (
                <div key={item.id} className="p-4 bg-orange-950/10 border border-orange-900/20 rounded-lg space-y-2 group relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded border border-orange-800/30 uppercase tracking-wide">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-orange-400">Impact: {item.impact}/5</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-900/50 transition-all cursor-pointer"
                        title="Delete factor"
                        id={`btn-delete-pc-${item.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-sm font-semibold leading-snug">{item.text}</p>
                  <p className="text-zinc-400 text-xs italic">{item.rationale}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cons Column */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4" id="cons-column">
          <h3 className="font-sans font-bold text-sm text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-3">
            <ArrowDownRight className="w-5 h-5" />
            Cons / Drawbacks
          </h3>

          <div className="space-y-3" id="cons-list">
            {cons.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                No drawbacks listed. Add custom warnings or cons below.
              </div>
            ) : (
              cons.map((item) => (
                <div key={item.id} className="p-4 bg-rose-950/10 border border-rose-900/20 rounded-lg space-y-2 group relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-900/20 px-2 py-0.5 rounded border border-rose-800/30 uppercase tracking-wide">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-rose-400">Impact: {item.impact}/5</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-900/50 transition-all cursor-pointer"
                        title="Delete factor"
                        id={`btn-delete-pc-${item.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-sm font-semibold leading-snug">{item.text}</p>
                  <p className="text-zinc-400 text-xs italic">{item.rationale}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Manual Pro/Con Insertion Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm" id="pc-addition-form-container">
        <h3 className="font-sans font-bold text-xs text-zinc-400 mb-4 uppercase tracking-widest">Add Custom Pro / Con to "{currentOptionName}"</h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-3" id="add-pc-item-form">
          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="Description of the factor..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 placeholder-zinc-650"
              required
              id="add-pc-text"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Category (e.g. Finance)"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 placeholder-zinc-650"
              id="add-pc-category"
            />
          </div>
          <div className="md:col-span-2">
            <select
              value={newItemImpact}
              onChange={(e) => setNewItemImpact(parseInt(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              id="add-pc-impact"
            >
              <option value={1}>1 - Negligible</option>
              <option value={2}>2 - Low</option>
              <option value={3}>3 - Moderate</option>
              <option value={4}>4 - Heavy</option>
              <option value={5}>5 - Crucial</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={newItemIsPro ? "true" : "false"}
              onChange={(e) => setNewItemIsPro(e.target.value === "true")}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none font-bold cursor-pointer"
              id="add-pc-ispro"
            >
              <option value="true">Pro (Benefit)</option>
              <option value="false">Con (Drawback)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              id="btn-submit-pc"
            >
              <Plus className="w-3.5 h-3.5" /> Inject
            </button>
          </div>
        </form>
      </div>

      {/* Strategic Recommendation Box */}
      {analysis.overallRecommendation && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3 animate-fade-in" id="strategic-recommendation-card">
          <div className="flex items-center gap-2 text-orange-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">AI Overall Recommendation Summary</span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
            {analysis.overallRecommendation}
          </p>
        </div>
      )}
    </div>
  );
}
