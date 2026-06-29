/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Decision } from "../types";

export const DECISION_TEMPLATES: Omit<Decision, "id" | "createdAt">[] = [
  {
    title: "Relocate to Chicago for the New Job Offer",
    description: "Comparing whether to accept the senior engineering offer in Chicago which requires full relocation, or remain in San Francisco with my current employer.",
    status: "pending",
    options: [
      { id: "opt-chicago", name: "Relocate to Chicago", description: "Accept the new offer, relocate, work hybrid 3 days a week." },
      { id: "opt-sf", name: "Stay in San Francisco", description: "Stay at current company, remain in San Francisco rent-controlled apartment." }
    ],
    criteria: [
      { id: "crit-career", name: "Career & Tech Stack Growth", weight: 5 },
      { id: "crit-cost", name: "Cost of Living & Savings", weight: 4 },
      { id: "crit-weather", name: "Weather & Outdoor Activities", weight: 3 },
      { id: "crit-social", name: "Social Circle & Proximity to Family", weight: 4 },
      { id: "crit-happiness", name: "Workplace Culture & Happiness", weight: 5 }
    ]
  },
  {
    title: "Choose Next Vehicle: EV vs. Hybrid SUV",
    description: "Evaluating the transition to a pure Electric Vehicle compared to a reliable Hybrid SUV for a family of four.",
    status: "pending",
    options: [
      { id: "opt-ev", name: "All-Electric SUV", description: "Buy a new high-range EV. Requires installing home charger." },
      { id: "opt-hybrid", name: "Plug-in Hybrid SUV", description: "Buy a Hybrid SUV. Combines gas convenience with 40-mile pure EV range." }
    ],
    criteria: [
      { id: "crit-upfront", name: "Upfront Cost & Incentives", weight: 4 },
      { id: "crit-running", name: "Fuel & Charging Savings", weight: 5 },
      { id: "crit-env", name: "Environmental Footprint", weight: 5 },
      { id: "crit-convenience", name: "Road-trip Convenience", weight: 4 },
      { id: "crit-maintenance", name: "Maintenance & Longevity", weight: 3 }
    ]
  },
  {
    title: "Career Pivot: Startup vs. Big Tech",
    description: "Deciding between joining an early-stage Series A startup with equity upside, or a stable Big Tech role with robust benefits.",
    status: "pending",
    options: [
      { id: "opt-startup", name: "Join Series A Startup", description: "Join as Employee #15. Fast pace, high equity, broad responsibility, potential cash crunch." },
      { id: "opt-bigtech", name: "Stay/Join Big Tech", description: "Secure salary, stock refreshes, slow career ladders, high specialization, stable hours." }
    ],
    criteria: [
      { id: "crit-comp", name: "Direct Compensation (Salary/Liquid Equity)", weight: 4 },
      { id: "crit-wlb", name: "Work-Life Balance", weight: 4 },
      { id: "crit-upside", name: "Financial Equity Upside", weight: 5 },
      { id: "crit-learning", name: "Skill Acquisition & Ownership", weight: 5 },
      { id: "crit-security", name: "Job Security & Stability", weight: 3 }
    ]
  }
];
