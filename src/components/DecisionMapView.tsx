/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  Activity, 
  RotateCcw,
  Network,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle
} from "lucide-react";
import { Decision, DecisionMap, MapNode } from "../types";

interface DecisionMapViewProps {
  decision: Decision;
  onUpdateDecision: (updated: Decision) => void;
  onTriggerAI: () => void;
  isGenerating: boolean;
  showNotification: (message: string, type: "error" | "success" | "info") => void;
}

export default function DecisionMapView({
  decision,
  onUpdateDecision,
  onTriggerAI,
  isGenerating,
  showNotification
}: DecisionMapViewProps) {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Custom Node Form States
  const [showAddFormUnder, setShowAddFormUnder] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<'consequence_positive' | 'consequence_negative' | 'risk' | 'mitigation'>('consequence_positive');
  const [newProb, setNewProb] = useState<string>("Medium");
  const [newImpact, setNewImpact] = useState<number>(3);

  const decisionMap = decision.decisionMap;

  if (!decisionMap) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4 animate-fade-in" id="map-no-analysis-state">
        <div className="p-4 bg-zinc-800 text-orange-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <Network className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-sans font-bold text-lg text-white">Consequence Map Not Built</h3>
        <p className="text-zinc-400 text-sm">
          Construct an interactive decision map. Gemini will branch your options into immediate positive/negative consequences, long-term risks, and strategic mitigation plans.
        </p>
        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-lg text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-orange-500/10"
          id="btn-gen-map-tab"
        >
          {isGenerating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Mapping Branches...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Build Decision Map
            </>
          )}
        </button>
      </div>
    );
  }

  // Toggle Collapse
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Select Node for detail panel
  const selectNode = (node: MapNode) => {
    setSelectedNode(node);
  };

  // Helper function to recursively find a node and append a child
  const addChildNode = (root: MapNode, parentId: string, newNode: MapNode): boolean => {
    if (root.id === parentId) {
      if (!root.children) root.children = [];
      root.children.push(newNode);
      return true;
    }
    if (root.children) {
      for (let child of root.children) {
        if (addChildNode(child, parentId, newNode)) {
          return true;
        }
      }
    }
    return false;
  };

  // Handle adding custom child branch
  const handleAddChild = (parentId: string) => {
    if (!newLabel.trim()) return;

    const newNode: MapNode = {
      id: `node-custom-${Date.now()}`,
      label: newLabel.trim(),
      type: newType,
      description: newDesc.trim() || "User defined scenario consequence.",
      probability: newProb,
      impact: newImpact,
      children: []
    };

    const mapCopy = JSON.parse(JSON.stringify(decisionMap));
    const success = addChildNode(mapCopy.root, parentId, newNode);

    if (success) {
      onUpdateDecision({
        ...decision,
        decisionMap: mapCopy
      });
      // Automatically expand parent node to show the newly added branch
      setExpandedNodes((prev) => ({ ...prev, [parentId]: true }));
    }

    setNewLabel("");
    setNewDesc("");
    setShowAddFormUnder(null);
  };

  // Helper function to recursively delete a node from the tree
  const removeChildNode = (parent: MapNode, targetId: string): boolean => {
    if (parent.children) {
      const initialLength = parent.children.length;
      parent.children = parent.children.filter(child => child.id !== targetId);
      if (parent.children.length < initialLength) {
        return true;
      }
      for (let child of parent.children) {
        if (removeChildNode(child, targetId)) {
          return true;
        }
      }
    }
    return false;
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === decisionMap.root.id) {
      showNotification("Cannot delete the root decision!", "error");
      return;
    }
    const mapCopy = JSON.parse(JSON.stringify(decisionMap));
    const success = removeChildNode(mapCopy.root, nodeId);

    if (success) {
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
      onUpdateDecision({
        ...decision,
        decisionMap: mapCopy
      });
    }
  };

  // Recursively update node properties
  const updateNodeProperties = (root: MapNode, targetId: string, fields: Partial<MapNode>): boolean => {
    if (root.id === targetId) {
      Object.assign(root, fields);
      return true;
    }
    if (root.children) {
      for (let child of root.children) {
        if (updateNodeProperties(child, targetId, fields)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleUpdateNode = (nodeId: string, fields: Partial<MapNode>) => {
    const mapCopy = JSON.parse(JSON.stringify(decisionMap));
    const success = updateNodeProperties(mapCopy.root, nodeId, fields);
    if (success) {
      onUpdateDecision({
        ...decision,
        decisionMap: mapCopy
      });
      // Sync selected node view if it's the one being updated
      if (selectedNode?.id === nodeId) {
        setSelectedNode({ ...selectedNode, ...fields });
      }
    }
  };

  // Get Styling Class for different types of nodes
  const getNodeStyles = (type: string, isSelected: boolean) => {
    let base = "p-3 rounded-lg border text-left transition-all relative cursor-pointer group flex items-start gap-2 select-none ";
    if (isSelected) {
      base += "ring-2 ring-orange-500/80 shadow-md ";
    } else {
      base += "shadow-sm hover:shadow-md hover:-translate-y-[1px] ";
    }

    switch (type) {
      case "decision":
        return base + "bg-zinc-900 border-zinc-800 hover:bg-zinc-850";
      case "option":
        return base + "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850";
      case "consequence_positive":
        return base + "bg-orange-950/10 border-orange-900/20 hover:bg-orange-950/20";
      case "consequence_negative":
        return base + "bg-rose-950/10 border-rose-900/20 hover:bg-rose-950/20";
      case "risk":
        return base + "bg-indigo-950/10 border-indigo-900/20 hover:bg-indigo-950/20";
      case "mitigation":
        return base + "bg-teal-950/10 border-teal-900/20 hover:bg-teal-950/20";
      default:
        return base + "bg-zinc-900 border-zinc-800 hover:bg-zinc-850";
    }
  };

  // Get icons for nodes
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "decision":
        return <Network className="w-4 h-4 text-orange-400 mt-0.5" />;
      case "option":
        return <Sliders className="w-4 h-4 text-blue-400 mt-0.5" />;
      case "consequence_positive":
        return <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5" />;
      case "consequence_negative":
        return <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5" />;
      case "risk":
        return <AlertTriangle className="w-4 h-4 text-indigo-400 mt-0.5" />;
      case "mitigation":
        return <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-500 mt-0.5" />;
    }
  };

  // Recursive Tree Node Renderer
  const renderNode = (node: MapNode, depth: number = 0) => {
    const isExpanded = expandedNodes[node.id] !== false; // default expanded
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="relative flex flex-col pl-4 md:pl-6" id={`node-wrapper-${node.id}`}>
        {/* Connection guide line */}
        {depth > 0 && (
          <div className="absolute left-1.5 md:left-2 top-[-10px] bottom-0 w-px bg-zinc-800 pointer-events-none" />
        )}
        
        <div className="flex items-start gap-2 relative mt-3">
          {/* horizontal connector line */}
          {depth > 0 && (
            <div className="absolute left-[-16px] md:left-[-24px] top-5 w-4 md:w-6 h-px bg-zinc-800 pointer-events-none" />
          )}

          {/* Toggle Expand Icon */}
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 mt-2.5 cursor-pointer z-10"
              id={`toggle-expand-${node.id}`}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Actual Card */}
          <div 
            onClick={() => selectNode(node)}
            className={`${getNodeStyles(node.type, isSelected)} flex-1 max-w-xl`}
            id={`node-card-${node.id}`}
          >
            {getNodeIcon(node.type)}
            
            <div className="flex-1 space-y-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-zinc-200 truncate pr-4">
                  {node.label}
                </span>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {node.probability && (
                    <span className="text-[9px] font-bold bg-zinc-850 text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                      {node.probability} Prob
                    </span>
                  )}
                  {node.impact !== undefined && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      node.impact >= 0 ? "bg-orange-500/10 text-orange-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      Impact: {node.impact >= 0 ? `+${node.impact}` : node.impact}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {node.description}
              </p>
            </div>

            {/* Quick Actions overlay */}
            <div className="absolute right-2 bottom-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddFormUnder(showAddFormUnder === node.id ? null : node.id);
                }}
                className="p-1 hover:bg-zinc-800 rounded text-orange-400 cursor-pointer"
                title="Add branch"
                id={`btn-add-branch-node-${node.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {depth > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNode(node.id);
                  }}
                  className="p-1 hover:bg-zinc-800 rounded text-rose-455 cursor-pointer"
                  title="Remove node"
                  id={`btn-delete-node-${node.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Node Inline Addition Form */}
        {showAddFormUnder === node.id && (
          <div className="mt-2 ml-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg max-w-xl space-y-3 z-10" id={`form-add-under-${node.id}`}>
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Branch custom consequence</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Branch Label (e.g. Talent Retention)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="col-span-2 bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500 placeholder-zinc-600"
                required
                id="add-node-label"
              />
              <textarea
                placeholder="Detailed explanation of this consequence..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="col-span-2 bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 text-xs h-12 focus:outline-none resize-none focus:border-orange-500 placeholder-zinc-600"
                id="add-node-desc"
              />
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs focus:outline-none font-bold"
                  id="add-node-type"
                >
                  <option value="consequence_positive">Positive Out</option>
                  <option value="consequence_negative">Negative Out</option>
                  <option value="risk">Risk / Trap</option>
                  <option value="mitigation">Mitigation</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Probability</label>
                <select
                  value={newProb}
                  onChange={(e) => setNewProb(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs focus:outline-none font-bold"
                  id="add-node-probability"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center justify-between border-t border-zinc-800 pt-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Impact weight (-5 to +5):</span>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    value={newImpact}
                    onChange={(e) => setNewImpact(parseInt(e.target.value))}
                    className="w-24 accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    id="add-node-impact"
                  />
                  <span className="text-xs font-black text-white">{newImpact >= 0 ? `+${newImpact}` : newImpact}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setShowAddFormUnder(null)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded cursor-pointer border border-zinc-700/50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAddChild(node.id)}
                    className="px-3 py-1 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-[10px] font-bold rounded shadow cursor-pointer"
                    id="btn-submit-add-node"
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col gap-1 border-l border-zinc-800 ml-1.5 md:ml-2">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" id="map-view-root">
      {/* Ribbon Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="map-ribbon">
        <div className="flex items-center gap-2 text-zinc-450">
          <Info className="w-4 h-4 text-orange-400" />
          <span className="text-xs">Click on any node card to expand details, edit values, or branch custom consequence scenarios.</span>
        </div>
        <button
          onClick={onTriggerAI}
          disabled={isGenerating}
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-zinc-850 border border-zinc-700 px-3 py-2 rounded-lg cursor-pointer ml-auto"
          id="btn-re-gen-map"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Re-Map with AI
        </button>
      </div>

      {/* Main Layout: Left tree map, Right detail side-panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="map-dashboard-grid">
        {/* Map Tree */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 shadow-sm overflow-hidden" id="tree-container">
          <div className="overflow-x-auto min-w-[320px]">
            <h3 className="font-sans font-bold text-sm text-zinc-200 border-b border-zinc-850 pb-3 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-orange-400" />
              Interactive Consequence Node Tree
            </h3>
            
            <div className="relative pb-6" id="nodes-tree-wrapper">
              {renderNode(decisionMap.root)}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-4 space-y-6" id="detail-panel-column">
          {selectedNode ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 sticky top-6 animate-fade-in" id="detail-panel">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Selected Node Profile</span>
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                  selectedNode.type === "decision" ? "bg-zinc-800 border-zinc-700 text-white" :
                  selectedNode.type === "option" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                  selectedNode.type === "consequence_positive" ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                  selectedNode.type === "consequence_negative" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                }`}>
                  {selectedNode.type.replace("_", " ")}
                </span>
              </div>

              {/* Title & Info */}
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-white leading-tight">
                  {selectedNode.label}
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Property Modifiers */}
              {selectedNode.type !== "decision" && selectedNode.type !== "option" && (
                <div className="border-t border-zinc-800/80 pt-4 space-y-4">
                  <h5 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Tweak Node Properties</h5>
                  
                  {/* Probability */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">Likelihood</label>
                    <div className="flex gap-1">
                      {["Low", "Medium", "High"].map((prob) => (
                        <button
                          key={prob}
                          onClick={() => handleUpdateNode(selectedNode.id, { probability: prob })}
                          className={`flex-1 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                            selectedNode.probability === prob
                              ? "bg-orange-500 border-orange-500 text-zinc-950 font-bold"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                          }`}
                          id={`btn-prob-${prob}`}
                        >
                          {prob}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Impact Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                      <span>Impact Severity</span>
                      <span className="text-xs font-black text-white">{selectedNode.impact !== undefined && selectedNode.impact >= 0 ? `+${selectedNode.impact}` : selectedNode.impact}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-rose-400 font-bold">-5</span>
                      <input
                        type="range"
                        min="-5"
                        max="5"
                        value={selectedNode.impact ?? 0}
                        onChange={(e) => handleUpdateNode(selectedNode.id, { impact: parseInt(e.target.value) })}
                        className="flex-1 accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        id="update-node-impact-range"
                      />
                      <span className="text-[10px] text-orange-400 font-bold">+5</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Inline delete for children */}
              {selectedNode.type !== "decision" && (
                <div className="border-t border-zinc-850 pt-4">
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="w-full py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    id="btn-delete-active-node"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Consequence Node
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-6 text-center text-zinc-500 text-xs py-12" id="detail-panel-empty">
              <Network className="w-8 h-8 mx-auto mb-2 opacity-50 text-orange-500/55" />
              Select any branching card to explore detail descriptions, change probability weights, adjust consequence impact severities, or prune branches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
