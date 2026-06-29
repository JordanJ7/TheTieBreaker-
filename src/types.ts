/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Decision {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'resolved';
  resolvedOptionId?: string;
  options: DecisionOption[];
  criteria: DecisionCriteria[];
  prosConsAnalysis?: ProsConsAnalysis;
  comparisonAnalysis?: ComparisonAnalysis;
  swotAnalysis?: SWOTAnalysis;
  decisionMap?: DecisionMap;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
}

export interface DecisionCriteria {
  id: string;
  name: string;
  weight: number; // 1 to 5
}

// Pros & Cons Analysis
export interface ProConItem {
  id: string;
  text: string;
  impact: number; // 1 to 5 (importance weighting)
  isPro: boolean;
  category: string; // e.g., Financial, Personal, Career, Health
  rationale: string; // Short AI explanation
}

export interface OptionProsCons {
  optionId: string;
  items: ProConItem[];
  score: number; // Calculated score
}

export interface ProsConsAnalysis {
  optionsAnalysis: OptionProsCons[];
  overallRecommendation: string;
}

// Comparison Matrix Analysis
export interface MatrixRow {
  criteriaName: string;
  criteriaWeight: number;
  evaluations: {
    optionId: string;
    score: number; // 1 to 10
    rationale: string;
  }[];
}

export interface ComparisonAnalysis {
  rows: MatrixRow[];
  summary: string;
  recommendation: string;
}

// SWOT Analysis
export interface SWOTQuad {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface SWOTAnalysis {
  optionsSWOT: {
    optionId: string;
    swot: SWOTQuad;
  }[];
  strategicAdvice: string;
}

// Interactive Decision Map (Tree representation)
export interface MapNode {
  id: string;
  label: string;
  type: 'decision' | 'option' | 'consequence_positive' | 'consequence_negative' | 'risk' | 'mitigation';
  description: string;
  probability?: string; // "High" | "Medium" | "Low"
  impact?: number; // -5 (very negative) to +5 (very positive)
  children?: MapNode[];
}

export interface DecisionMap {
  root: MapNode;
}
