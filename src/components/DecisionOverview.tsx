/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Info,
  Sliders,
  Award
} from "lucide-react";
import { Decision, DecisionOption, DecisionCriteria } from "../types";

interface DecisionOverviewProps {
  decision: Decision;
  onUpdateDecision: (updated: Decision) => void;
  onTriggerAI: (type: "proscons" | "comparison" | "swot" | "map") => void;
  isGenerating: boolean;
  showNotification: (message: string, type: "error" | "success" | "info") => void;
}

export default function DecisionOverview({
  decision,
  onUpdateDecision,
  onTriggerAI,
  isGenerating,
  showNotification
}: DecisionOverviewProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionDesc, setNewOptionDesc] = useState("");
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaWeight, setNewCriteriaWeight] = useState(3);

  // Add Option
  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const newOption: DecisionOption = {
      id: `opt-${Date.now()}`,
      name: newOptionName.trim(),
      description: newOptionDesc.trim() || "No description provided."
    };

    onUpdateDecision({
      ...decision,
      options: [...decision.options, newOption]
    });

    setNewOptionName("");
    setNewOptionDesc("");
  };

  // Delete Option
  const handleDeleteOption = (id: string) => {
    if (decision.options.length <= 2) {
      showNotification("A comparison requires at least 2 options!", "error");
      return;
    }
    onUpdateDecision({
      ...decision,
      options: decision.options.filter((o) => o.id !== id),
      resolvedOptionId: decision.resolvedOptionId === id ? undefined : decision.resolvedOptionId
    });
  };

  // Add Criteria
  const handleAddCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriteriaName.trim()) return;

    const newCrit: DecisionCriteria = {
      id: `crit-${Date.now()}`,
      name: newCriteriaName.trim(),
      weight: newCriteriaWeight
    };

    onUpdateDecision({
      ...decision,
      criteria: [...decision.criteria, newCrit]
    });

    setNewCriteriaName("");
    setNewCriteriaWeight(3);
  };

  // Delete Criteria
  const handleDeleteCriteria = (id: string) => {
    onUpdateDecision({
      ...decision,
      criteria: decision.criteria.filter((c) => c.id !== id)
    });
  };

  // Update Criteria Weight
  const handleWeightChange = (id: string, weight: number) => {
    onUpdateDecision({
      ...decision,
      criteria: decision.criteria.map((c) => c.id === id ? { ...c, weight } : c)
    });
  };

  // Resolve Decision
  const handleResolve = (optionId: string) => {
    onUpdateDecision({
      ...decision,
      status: "resolved",
      resolvedOptionId: optionId
    });
  };

  // Reopen Decision
  const handleReopen = () => {
    onUpdateDecision({
      ...decision,
      status: "pending",
      resolvedOptionId: undefined
    });
  };

  return (
    <div className="space-y-6" id="decision-overview-root">
      {/* Decision Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden" id="overview-header-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                decision.status === "resolved" 
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`} id="decision-status-badge">
                {decision.status === "resolved" ? "Resolved" : "Pending Evaluation"}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                Created {new Date(decision.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="font-sans font-semibold text-2xl text-white leading-tight">
              {decision.title}
            </h2>
            <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
              {decision.description || "Define context or description to assist Gemini AI in analyzing your choice."}
            </p>
          </div>

          {decision.status === "resolved" && (
            <div className="flex items-center gap-3 bg-orange-950/20 border border-orange-800/40 p-4 rounded-xl shadow-inner animate-fade-in" id="resolution-status-box">
              <div className="p-2 bg-orange-500 rounded-full text-zinc-950">
                <CheckCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Final Decision</p>
                <p className="text-sm font-bold text-white">
                  {decision.options.find(o => o.id === decision.resolvedOptionId)?.name || "Resolved"}
                </p>
                <button 
                  onClick={handleReopen}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold underline mt-1 cursor-pointer block"
                >
                  Change Decision / Reopen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Options & Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="overview-options-criteria-grid">
        {/* Comparison Options */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="options-card">
          <div>
            <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              1. Options to Compare
            </h3>
            
            <div className="space-y-3 mb-6" id="options-list">
              {decision.options.map((option, index) => (
                <div 
                  key={option.id}
                  className="p-4 bg-zinc-950 hover:bg-zinc-950 border border-zinc-800/60 rounded-lg flex items-start justify-between gap-3 group transition-colors"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 flex items-center justify-center">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <h4 className="font-semibold text-xs text-white leading-none">
                        {option.name}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 pl-7 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {decision.status !== "resolved" && (
                      <button
                        onClick={() => handleResolve(option.id)}
                        className="py-1 px-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        id={`btn-resolve-${option.id}`}
                      >
                        Choose
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteOption(option.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                      title="Remove option"
                      id={`btn-delete-opt-${option.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Option Form */}
          <form onSubmit={handleAddOption} className="space-y-3 border-t border-zinc-800 pt-4" id="add-option-form">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Add custom option</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Option name (e.g., Learn Rust)"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-zinc-200 placeholder-zinc-600"
                required
                id="add-opt-name"
              />
              <input
                type="text"
                placeholder="Brief description / context"
                value={newOptionDesc}
                onChange={(e) => setNewOptionDesc(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-zinc-200 placeholder-zinc-600"
                id="add-opt-desc"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              id="btn-submit-add-opt"
            >
              <Plus className="w-3.5 h-3.5" /> Add Option
            </button>
          </form>
        </div>

        {/* Evaluation Criteria */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="criteria-card">
          <div>
            <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              2. Criteria & Importance
            </h3>

            {decision.criteria.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic" id="empty-criteria-message">
                No custom criteria added yet. Add criteria to assign weight values and direct the mathematical and AI models.
              </div>
            ) : (
              <div className="space-y-4 mb-6" id="criteria-list">
                {decision.criteria.map((criteriaItem) => (
                  <div key={criteriaItem.id} className="p-3 bg-zinc-950 border border-zinc-800/60 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-200">{criteriaItem.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold bg-zinc-900 text-orange-400 px-2 py-0.5 rounded border border-zinc-800">
                          Weight: {criteriaItem.weight}/5
                        </span>
                        <button
                          onClick={() => handleDeleteCriteria(criteriaItem.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Remove criteria"
                          id={`btn-delete-crit-${criteriaItem.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 font-semibold">Low</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={criteriaItem.weight}
                        onChange={(e) => handleWeightChange(criteriaItem.id, parseInt(e.target.value))}
                        className="flex-1 accent-orange-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        id={`crit-range-${criteriaItem.id}`}
                      />
                      <span className="text-[10px] text-zinc-500 font-semibold">Critical</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Criteria Form */}
          <form onSubmit={handleAddCriteria} className="space-y-3 border-t border-zinc-800 pt-4" id="add-criteria-form">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Add custom evaluation factor</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <input
                type="text"
                placeholder="Factor name (e.g. Performance)"
                value={newCriteriaName}
                onChange={(e) => setNewCriteriaName(e.target.value)}
                className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-zinc-200 placeholder-zinc-600"
                required
                id="add-crit-name"
              />
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="text-zinc-500 text-[10px] font-bold whitespace-nowrap">Weight:</span>
                <select
                  value={newCriteriaWeight}
                  onChange={(e) => setNewCriteriaWeight(parseInt(e.target.value))}
                  className="bg-transparent text-xs text-zinc-300 focus:outline-none w-full font-bold cursor-pointer"
                  id="add-crit-weight"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Minor</option>
                  <option value={3}>3 - Med</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Crit</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              id="btn-submit-add-crit"
            >
              <Plus className="w-3.5 h-3.5" /> Add Factor
            </button>
          </form>
        </div>
      </div>

      {/* AI Intelligence Activation Section */}
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl p-6 shadow-md relative overflow-hidden animate-fade-in" id="ai-intelligence-deck">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Tiebreaker Intelligence Hub</span>
            </div>
            <h3 className="font-sans font-bold text-lg text-white">Generate Rich AI Analytical Models</h3>
            <p className="text-zinc-400 text-xs max-w-xl leading-relaxed">
              Unlock strategic reasoning with Gemini. Our models synthesize comprehensive SWOT grids, build weighted criteria evaluations, outline full pros/cons matrices, and plot out recursive risk-consequence decision trees.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto" id="ai-model-buttons">
            <button
              onClick={() => onTriggerAI("proscons")}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              id="btn-ai-proscons"
            >
              <Award className="w-3.5 h-3.5" /> Pros & Cons
            </button>
            <button
              onClick={() => onTriggerAI("comparison")}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              id="btn-ai-matrix"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Compare Matrix
            </button>
            <button
              onClick={() => onTriggerAI("swot")}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              id="btn-ai-swot"
            >
              <Info className="w-3.5 h-3.5" /> SWOT Analysis
            </button>
            <button
              onClick={() => onTriggerAI("map")}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              id="btn-ai-map"
            >
              <Sliders className="w-3.5 h-3.5" /> Consequence Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
