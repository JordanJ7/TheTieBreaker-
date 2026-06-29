/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Scale, 
  Compass, 
  Briefcase, 
  Car, 
  CheckCircle, 
  Clock, 
  Search,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Decision } from "../types";
import { DECISION_TEMPLATES } from "../data/templates";

interface SidebarProps {
  decisions: Decision[];
  activeDecisionId: string | null;
  onSelectDecision: (id: string) => void;
  onCreateDecision: (decision: Omit<Decision, "id" | "createdAt">) => void;
  onDeleteDecision: (id: string) => void;
  onOpenCreateWizard: () => void;
}

export default function Sidebar({
  decisions,
  activeDecisionId,
  onSelectDecision,
  onCreateDecision,
  onDeleteDecision,
  onOpenCreateWizard
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDecisions = decisions.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTemplateIcon = (title: string) => {
    if (title.includes("Chicago") || title.includes("Relocate")) return <Compass className="w-4 h-4 text-orange-400" />;
    if (title.includes("Vehicle") || title.includes("Car")) return <Car className="w-4 h-4 text-orange-400" />;
    if (title.includes("Startup") || title.includes("Career")) return <Briefcase className="w-4 h-4 text-orange-400" />;
    return <Sparkles className="w-4 h-4 text-orange-400" />;
  };

  return (
    <div className="w-80 bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-800 h-screen overflow-hidden" id="sidebar-container">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between" id="sidebar-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-zinc-950 font-black text-lg">
            T
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-base text-white">THE TIEBREAKER</h1>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">AI Decision Engine</p>
          </div>
        </div>
      </div>

      {/* Primary Call to Action */}
      <div className="p-4" id="sidebar-actions">
        <button
          onClick={onOpenCreateWizard}
          className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/5 transition-all duration-200 text-xs hover:translate-y-[-1px] cursor-pointer"
          id="btn-new-decision"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          NEW DECISION
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-2" id="sidebar-search">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            id="sidebar-search-input"
          />
        </div>
      </div>

      {/* Decision Lists */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 py-2" id="sidebar-lists">
        {/* Active/History List */}
        <div>
          <span className="px-3 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">My Decisions</span>
          <div className="mt-2 space-y-1">
            {filteredDecisions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-500 text-center italic">
                {searchQuery ? "No matching decisions" : "No decisions yet. Tap 'New Decision' or select a template below!"}
              </div>
            ) : (
              filteredDecisions.map((decision) => {
                const isActive = decision.id === activeDecisionId;
                return (
                  <div
                    key={decision.id}
                    onClick={() => onSelectDecision(decision.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? "bg-zinc-900 border border-zinc-800 text-white shadow-md shadow-black/20"
                        : "hover:bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white"
                    }`}
                    id={`decision-item-${decision.id}`}
                  >
                    <div className="flex flex-col gap-1 pr-6 overflow-hidden">
                      <span className={`text-xs font-semibold truncate leading-tight ${isActive ? "text-orange-400" : ""}`}>
                        {decision.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        {decision.status === "resolved" ? (
                          <span className="flex items-center gap-1 text-orange-400 font-medium">
                            <CheckCircle className="w-3 h-3" /> Resolved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-400 font-medium">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(decision.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDecision(decision.id);
                      }}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete decision"
                      id={`delete-${decision.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Templates List */}
        <div className="border-t border-zinc-800 pt-4">
          <span className="px-3 text-[9px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" /> Choose a Template
          </span>
          <div className="mt-2 space-y-1">
            {DECISION_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => onCreateDecision(template)}
                className="w-full text-left p-2.5 hover:bg-zinc-900/40 rounded-lg text-xs text-zinc-400 hover:text-white flex items-center gap-3 transition-colors group cursor-pointer"
                id={`template-item-${idx}`}
              >
                <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-colors">
                  {getTemplateIcon(template.title)}
                </div>
                <div className="flex-1 truncate">
                  <div className="font-semibold text-[11px] truncate">{template.title}</div>
                  <div className="text-[9px] text-zinc-500 truncate">{template.options.length} Options • {template.criteria.length} Criteria</div>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Info */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-center" id="sidebar-footer">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
          AI Engine Active
        </p>
      </div>
    </div>
  );
}
