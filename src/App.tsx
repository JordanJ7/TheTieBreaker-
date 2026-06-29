/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Sparkles, 
  Activity, 
  FileText, 
  Scale, 
  BarChart2, 
  Briefcase, 
  Network,
  X,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

import { Decision, DecisionOption, DecisionCriteria } from "./types";
import { DECISION_TEMPLATES } from "./data/templates";

// Import custom sub-components
import Sidebar from "./components/Sidebar";
import DecisionOverview from "./components/DecisionOverview";
import ProsConsView from "./components/ProsConsView";
import ComparisonMatrixView from "./components/ComparisonMatrixView";
import SwotAnalysisView from "./components/SwotAnalysisView";
import DecisionMapView from "./components/DecisionMapView";

// Default seed decision so the user gets an outstanding experience immediately
const SEED_DECISION: Decision = {
  id: "seed-relocation",
  title: "Relocate to Chicago for the New Job Offer",
  description: "Comparing whether to accept the senior software engineering offer in Chicago which requires full relocation, or remain in San Francisco with my current employer. Settle on a choice based on growth, financial trade-offs, and weather.",
  createdAt: new Date().toISOString(),
  status: "pending",
  options: [
    { id: "opt-chicago", name: "Relocate to Chicago", description: "Accept the new offer with 25% salary bump, relocate, work hybrid 3 days a week." },
    { id: "opt-sf", name: "Stay in San Francisco", description: "Stay at current company, remain in San Francisco rent-controlled apartment." }
  ],
  criteria: [
    { id: "crit-career", name: "Career & Tech Stack Growth", weight: 5 },
    { id: "crit-cost", name: "Cost of Living & Savings", weight: 4 },
    { id: "crit-weather", name: "Weather & Outdoor Activities", weight: 3 },
    { id: "crit-social", name: "Social Circle & Proximity to Family", weight: 4 },
    { id: "crit-happiness", name: "Workplace Culture & Happiness", weight: 5 }
  ]
};

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "proscons" | "matrix" | "swot" | "map">("overview");

  // Notifications State
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "error" | "success" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Wizards and overlays
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");

  // Create wizard form states
  const [wizardTitle, setWizardTitle] = useState("");
  const [wizardDesc, setWizardDesc] = useState("");
  const [wizardOptions, setWizardOptions] = useState<Omit<DecisionOption, "id">[]>([
    { name: "Option A", description: "First path to consider." },
    { name: "Option B", description: "Alternative path." }
  ]);
  const [wizardCriteria, setWizardCriteria] = useState<Omit<DecisionCriteria, "id">[]>([
    { name: "Cost & Value", weight: 4 },
    { name: "Time & Effort", weight: 3 },
    { name: "Satisfaction", weight: 5 }
  ]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tiebreaker_decisions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDecisions(parsed);
          setActiveDecisionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Local storage parse error:", e);
      }
    }

    // Default seed
    setDecisions([SEED_DECISION]);
    setActiveDecisionId(SEED_DECISION.id);
  }, []);

  // Save to local storage on changes
  const saveDecisions = (updatedDecisions: Decision[]) => {
    setDecisions(updatedDecisions);
    localStorage.setItem("tiebreaker_decisions", JSON.stringify(updatedDecisions));
  };

  const activeDecision = decisions.find((d) => d.id === activeDecisionId) || null;

  // Handle selecting a decision
  const handleSelectDecision = (id: string) => {
    setActiveDecisionId(id);
    setActiveTab("overview");
  };

  // Handle template or inline creation
  const handleCreateDecision = (newDecRaw: Omit<Decision, "id" | "createdAt">) => {
    const newDecision: Decision = {
      ...newDecRaw,
      id: `dec-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newDecision, ...decisions];
    saveDecisions(updated);
    setActiveDecisionId(newDecision.id);
    setActiveTab("overview");
    setShowCreateWizard(false);
  };

  // Handle deleting a decision
  const handleDeleteDecision = (id: string) => {
    const updated = decisions.filter((d) => d.id !== id);
    saveDecisions(updated);
    if (activeDecisionId === id) {
      setActiveDecisionId(updated.length > 0 ? updated[0].id : null);
      setActiveTab("overview");
    }
  };

  // Handle updating active decision properties
  const handleUpdateActiveDecision = (updated: Decision) => {
    const updatedDecs = decisions.map((d) => d.id === updated.id ? updated : d);
    saveDecisions(updatedDecs);
  };

  // Trigger Gemini AI generators
  const triggerAIModel = async (type: "proscons" | "comparison" | "swot" | "map") => {
    if (!activeDecision) return;

    // Loading cues
    const messages = {
      proscons: "Gemini is sifting financial, temporal, and emotional trade-offs...",
      comparison: "Computing Multi-Criteria Evaluation Matrix indices...",
      swot: "Mapping Strengths, Weaknesses, Opportunities, and Threats...",
      map: "Constructing recursive risk-consequence decision trees..."
    };

    setIsGenerating(true);
    setGenerationMessage(messages[type]);

    try {
      const response = await fetch(`/api/decide/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDecision.title,
          description: activeDecision.description,
          options: activeDecision.options,
          criteria: activeDecision.criteria
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch AI evaluation of type ${type}`);
      }

      const parsedResult = await response.json();

      let updatedDecision: Decision = { ...activeDecision };

      if (type === "proscons") {
        updatedDecision.prosConsAnalysis = parsedResult;
        setActiveTab("proscons");
      } else if (type === "comparison") {
        updatedDecision.comparisonAnalysis = parsedResult;
        setActiveTab("matrix");
      } else if (type === "swot") {
        updatedDecision.swotAnalysis = parsedResult;
        setActiveTab("swot");
      } else if (type === "map") {
        updatedDecision.decisionMap = parsedResult;
        setActiveTab("map");
      }

      handleUpdateActiveDecision(updatedDecision);
    } catch (error: any) {
      console.error(error);
      showNotification(`AI Analysis Failed: ${error.message || "An unexpected error occurred."}`, "error");
    } finally {
      setIsGenerating(false);
      setGenerationMessage("");
    }
  };

  // Wizard option inputs helpers
  const handleAddWizardOption = () => {
    setWizardOptions([...wizardOptions, { name: "", description: "" }]);
  };
  const handleRemoveWizardOption = (idx: number) => {
    setWizardOptions(wizardOptions.filter((_, i) => i !== idx));
  };
  const handleWizardOptionChange = (idx: number, field: "name" | "description", val: string) => {
    setWizardOptions(
      wizardOptions.map((o, i) => i === idx ? { ...o, [field]: val } : o)
    );
  };

  // Wizard criteria inputs helpers
  const handleAddWizardCriteria = () => {
    setWizardCriteria([...wizardCriteria, { name: "", weight: 3 }]);
  };
  const handleRemoveWizardCriteria = (idx: number) => {
    setWizardCriteria(wizardCriteria.filter((_, i) => i !== idx));
  };
  const handleWizardCriteriaChange = (idx: number, field: "name" | "weight", val: any) => {
    setWizardCriteria(
      wizardCriteria.map((c, i) => i === idx ? { ...c, [field]: val } : c)
    );
  };

  const handleFinishWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardTitle.trim()) return;

    const filteredOptions = wizardOptions
      .filter((o) => o.name.trim())
      .map((o, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        name: o.name.trim(),
        description: o.description.trim() || "No description provided."
      }));

    const filteredCriteria = wizardCriteria
      .filter((c) => c.name.trim())
      .map((c, idx) => ({
        id: `crit-${idx}-${Date.now()}`,
        name: c.name.trim(),
        weight: c.weight
      }));

    if (filteredOptions.length < 2) {
      showNotification("Please define at least 2 comparison options!", "error");
      return;
    }

    handleCreateDecision({
      title: wizardTitle.trim(),
      description: wizardDesc.trim(),
      status: "pending",
      options: filteredOptions,
      criteria: filteredCriteria
    });

    // Reset wizard states
    setWizardTitle("");
    setWizardDesc("");
    setWizardOptions([
      { name: "Option A", description: "First path to consider." },
      { name: "Option B", description: "Alternative path." }
    ]);
    setWizardCriteria([
      { name: "Cost & Value", weight: 4 },
      { name: "Time & Effort", weight: 3 },
      { name: "Satisfaction", weight: 5 }
    ]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans antialiased text-zinc-300" id="app-root">
      {/* Sidebar navigation */}
      <Sidebar
        decisions={decisions}
        activeDecisionId={activeDecisionId}
        onSelectDecision={handleSelectDecision}
        onCreateDecision={handleCreateDecision}
        onDeleteDecision={handleDeleteDecision}
        onOpenCreateWizard={() => setShowCreateWizard(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative" id="workspace-container">
        {activeDecision ? (
          <>
            {/* Top Workspace Header Tab Ribbon */}
            <header className="bg-zinc-950 border-b border-zinc-800 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0" id="workspace-header">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-orange-400 block">Current Comparison Workspace</span>
                <h2 className="font-sans font-semibold text-lg text-white italic tracking-tight truncate max-w-xl">
                  "{activeDecision.title}"
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border border-zinc-800 p-1 bg-zinc-900 rounded-lg self-start md:self-center" id="tabs-ribbon">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700/60 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  id="tab-btn-overview"
                >
                  <Sliders className="w-3.5 h-3.5" /> Overview
                </button>
                <button
                  onClick={() => setActiveTab("proscons")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "proscons"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700/60 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  id="tab-btn-proscons"
                >
                  <Scale className="w-3.5 h-3.5" /> Pros & Cons
                </button>
                <button
                  onClick={() => setActiveTab("matrix")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "matrix"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700/60 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  id="tab-btn-matrix"
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Matrix
                </button>
                <button
                  onClick={() => setActiveTab("swot")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "swot"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700/60 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  id="tab-btn-swot"
                >
                  <Briefcase className="w-3.5 h-3.5" /> SWOT Analysis
                </button>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "map"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700/60 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  id="tab-btn-map"
                >
                  <Network className="w-3.5 h-3.5" /> Decision Map
                </button>
              </div>
            </header>

            {/* Active Tab View Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-zinc-950" id="workspace-body">
              {activeTab === "overview" && (
                <DecisionOverview
                  decision={activeDecision}
                  onUpdateDecision={handleUpdateActiveDecision}
                  onTriggerAI={triggerAIModel}
                  isGenerating={isGenerating}
                  showNotification={showNotification}
                />
              )}
              {activeTab === "proscons" && (
                <ProsConsView
                  decision={activeDecision}
                  onUpdateDecision={handleUpdateActiveDecision}
                  onTriggerAI={() => triggerAIModel("proscons")}
                  isGenerating={isGenerating}
                />
              )}
              {activeTab === "matrix" && (
                <ComparisonMatrixView
                  decision={activeDecision}
                  onTriggerAI={() => triggerAIModel("comparison")}
                  isGenerating={isGenerating}
                />
              )}
              {activeTab === "swot" && (
                <SwotAnalysisView
                  decision={activeDecision}
                  onTriggerAI={() => triggerAIModel("swot")}
                  isGenerating={isGenerating}
                />
              )}
              {activeTab === "map" && (
                <DecisionMapView
                  decision={activeDecision}
                  onUpdateDecision={handleUpdateActiveDecision}
                  onTriggerAI={() => triggerAIModel("map")}
                  isGenerating={isGenerating}
                  showNotification={showNotification}
                />
              )}
            </div>
          </>
        ) : (
          /* Empty Workspace State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-zinc-950" id="empty-workspace-state">
            <div className="p-4 bg-zinc-900 border border-zinc-800 text-orange-400 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <Scale className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="font-sans font-bold text-lg text-white">No active comparisons selected</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              Choose a decision comparison from your sidebar history, tap one of our pre-populated templates, or start a new decision from scratch!
            </p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="py-2.5 px-6 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-lg text-xs font-bold shadow-lg shadow-orange-500/10 flex items-center gap-2 mx-auto cursor-pointer"
              id="empty-state-btn-create"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> START NEW DECISION
            </button>
          </div>
        )}

        {/* Global Floating Asynchronous Loading Screen Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-[3px] z-50 flex items-center justify-center p-6"
              id="ai-loading-overlay"
            >
              <div className="bg-zinc-900 rounded-xl shadow-2xl p-6 text-center max-w-sm border border-zinc-800 flex flex-col items-center space-y-4 animate-fade-in">
                <div className="relative">
                  <Activity className="w-10 h-10 text-orange-400 animate-spin" />
                  <Sparkles className="w-5 h-5 text-orange-500 absolute top-[-5px] right-[-5px] animate-bounce" />
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider">Gemini Reasoning Active</h4>
                  <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wide font-bold">Please wait while the model formulates strategy grids.</p>
                </div>
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full animate-progress-bar w-[60%]" />
                </div>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block bg-zinc-950/60 border border-zinc-800 px-3 py-1 rounded">
                  {generationMessage}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Decision Wizard Modal Dialog */}
        <AnimatePresence>
          {showCreateWizard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-6 overflow-y-auto"
              id="create-wizard-overlay"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full border border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden"
                id="create-wizard-modal"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40" id="wizard-header">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-orange-400">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Formulate Decision Comparison</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Define paths, weights, and evaluation factors to comparison metrics.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCreateWizard(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    id="wizard-close-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleFinishWizard} className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/40" id="wizard-form">
                  {/* Title & Description */}
                  <div className="space-y-3" id="wizard-section-basic">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Decision Question</label>
                      <input
                        type="text"
                        placeholder="Should I start learning Rust or stick with TypeScript?"
                        value={wizardTitle}
                        onChange={(e) => setWizardTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors"
                        required
                        id="wizard-title-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Context / Objectives</label>
                      <textarea
                        placeholder="I have an upcoming system architecture redesign and want to compare tech ecosystem speed versus ecosystem developer velocity..."
                        value={wizardDesc}
                        onChange={(e) => setWizardDesc(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 h-20 resize-none leading-relaxed transition-colors"
                        id="wizard-desc-input"
                      />
                    </div>
                  </div>

                  {/* Options Setup */}
                  <div className="space-y-3" id="wizard-section-options">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Comparison Options (min 2)</label>
                      <button
                        type="button"
                        onClick={handleAddWizardOption}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                        id="btn-add-wizard-option"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Path
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1" id="wizard-options-list">
                      {wizardOptions.map((opt, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Option Name (e.g. Learn Rust)"
                            value={opt.name}
                            onChange={(e) => handleWizardOptionChange(idx, "name", e.target.value)}
                            className="md:col-span-4 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                            required
                            id={`wizard-opt-name-${idx}`}
                          />
                          <input
                            type="text"
                            placeholder="Brief context (e.g. strict safety, high systems engineering learning curve)"
                            value={opt.description}
                            onChange={(e) => handleWizardOptionChange(idx, "description", e.target.value)}
                            className="md:col-span-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                            id={`wizard-opt-desc-${idx}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWizardOption(idx)}
                            className="md:col-span-1 p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors cursor-pointer text-center"
                            title="Remove"
                            id={`btn-remove-wizard-opt-${idx}`}
                          >
                            <X className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Criteria Weighting Setup */}
                  <div className="space-y-3" id="wizard-section-criteria">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Evaluation Factors</label>
                      <button
                        type="button"
                        onClick={handleAddWizardCriteria}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                        id="btn-add-wizard-criteria"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Factor
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1" id="wizard-criteria-list">
                      {wizardCriteria.map((crit, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Factor (e.g. Developer Velocity)"
                            value={crit.name}
                            onChange={(e) => handleWizardCriteriaChange(idx, "name", e.target.value)}
                            className="md:col-span-6 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                            required
                            id={`wizard-crit-name-${idx}`}
                          />
                          <div className="md:col-span-5 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold">Priority:</span>
                            <select
                              value={crit.weight}
                              onChange={(e) => handleWizardCriteriaChange(idx, "weight", parseInt(e.target.value))}
                              className="bg-transparent text-xs text-zinc-200 focus:outline-none font-bold w-full cursor-pointer"
                              id={`wizard-crit-weight-${idx}`}
                            >
                              <option value={1}>1 - Low Priority</option>
                              <option value={2}>2 - Minor Benefit</option>
                              <option value={3}>3 - Balanced</option>
                              <option value={4}>4 - High Value</option>
                              <option value={5}>5 - Absolutely Critical</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveWizardCriteria(idx)}
                            className="md:col-span-1 p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors cursor-pointer text-center"
                            title="Remove"
                            id={`btn-remove-wizard-crit-${idx}`}
                          >
                            <X className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Modal Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-end gap-2.5" id="wizard-footer">
                  <button
                    type="button"
                    onClick={() => setShowCreateWizard(false)}
                    className="py-2 px-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinishWizard}
                    className="py-2 px-5 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-orange-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                    id="btn-wizard-finish"
                  >
                    Assemble Comparison <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Native Floating Toast Notifications */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 flex items-start gap-3"
              id="notification-toast"
            >
              <div className={`p-2 rounded-lg ${
                toast.type === "error" ? "bg-red-500/10 text-red-400" :
                toast.type === "success" ? "bg-orange-500/10 text-orange-400" :
                "bg-blue-500/10 text-blue-400"
              }`}>
                {toast.type === "error" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 space-y-0.5">
                <h5 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                  {toast.type === "error" ? "System Error" : toast.type === "success" ? "Success" : "Notification"}
                </h5>
                <p className="text-zinc-200 text-xs leading-relaxed font-medium">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
