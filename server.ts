/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client with proper User-Agent header for telemetry
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Middleware to verify the API key is present
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: "GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets.",
    });
    return;
  }
  next();
};

// Helper function to call generateContent with retry and fallback model
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
  const maxRetries = 2; // Retries per model
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Calling Gemini API using model ${model}, attempt ${attempt}...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini API Error on ${model} (attempt ${attempt}/${maxRetries}):`, error);

        // Check if error is a 503, 429, or UNAVAILABLE
        const isTemporary = 
          error.status === "UNAVAILABLE" || 
          error.code === 503 ||
          error.status === "RESOURCE_EXHAUSTED" ||
          error.code === 429 ||
          (error.message && (
            error.message.includes("high demand") || 
            error.message.includes("temporary") || 
            error.message.includes("unavailable") ||
            error.message.includes("quota") ||
            error.message.includes("limit")
          ));

        if (isTemporary && attempt < maxRetries) {
          const delay = attempt * 1500; // Exponential-like backoff
          console.log(`Temporary error detected. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after retries and fallback.");
}

// 1. Pros & Cons Analysis Endpoint
app.post("/api/decide/proscons", checkApiKey, async (req, res) => {
  try {
    const { title, description, options, criteria } = req.body;

    const optionsStr = options.map((o: any) => `- Option [${o.id}]: ${o.name} - Description: ${o.description}`).join("\n");
    const criteriaStr = criteria.map((c: any) => `- Criteria: ${c.name} (Weight: ${c.weight}/5)`).join("\n");

    const prompt = `Perform a comprehensive, objective, and deeply analytical Pros and Cons comparison for the following decision:

Decision: "${title}"
Context: ${description}

Options to analyze:
${optionsStr}

Consider these evaluation criteria:
${criteriaStr}

For EACH option, generate a balanced list of exactly 4 pros and 4 cons. Each pro/con must include:
1. id: A unique string id (e.g. pc-opt1-1, pc-opt1-2)
2. text: A concise summary of the pro or con.
3. impact: Weighting from 1 to 5 (how important this factor is).
4. isPro: true if it is a pro, false if it is a con.
5. category: A short category (e.g., Financial, Career, Well-being, Personal, Risk, Complexity).
6. rationale: A short, insightful explanation of why this item applies specifically to this option.

Also, calculate an aggregate score for each option based on: (Sum of Pro impacts) - (Sum of Con impacts).
Provide an overall comparative recommendation explaining which option is stronger and why.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optionsAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  optionId: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        impact: { type: Type.INTEGER },
                        isPro: { type: Type.BOOLEAN },
                        category: { type: Type.STRING },
                        rationale: { type: Type.STRING }
                      },
                      required: ["id", "text", "impact", "isPro", "category", "rationale"]
                    }
                  },
                  score: { type: Type.INTEGER }
                },
                required: ["optionId", "items", "score"]
              }
            },
            overallRecommendation: { type: Type.STRING }
          },
          required: ["optionsAnalysis", "overallRecommendation"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("ProsCons Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during pros & cons generation." });
  }
});

// 2. Comparison Matrix Endpoint
app.post("/api/decide/comparison", checkApiKey, async (req, res) => {
  try {
    const { title, description, options, criteria } = req.body;

    const optionsStr = options.map((o: any) => `- Option [${o.id}]: ${o.name} - Description: ${o.description}`).join("\n");
    const criteriaStr = criteria.map((c: any) => `- Criteria: ${c.name} (Weight: ${c.weight}/5)`).join("\n");

    const prompt = `Perform a rigorous Multi-Criteria Decision Analysis (MCDA) comparison matrix for the following decision:

Decision: "${title}"
Context: ${description}

Options to compare:
${optionsStr}

Criteria to grade:
${criteriaStr}

Analyze how each option performs against EACH criteria. Assign a numeric score from 1 (poor) to 10 (excellent) for how well the option meets that specific criteria. Provide a crisp rationale explaining the score.
Ensure that standard dimensions (e.g., Joy/Satisfaction, Cost/Effort, Risk/Reliability, Future Growth) are factored in.

Provide a high-quality analysis summary explaining the strengths and trade-offs of each option, and conclude with a definitive, weighted recommendation.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criteriaName: { type: Type.STRING },
                  criteriaWeight: { type: Type.INTEGER },
                  evaluations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        optionId: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                        rationale: { type: Type.STRING }
                      },
                      required: ["optionId", "score", "rationale"]
                    }
                  }
                },
                required: ["criteriaName", "criteriaWeight", "evaluations"]
              }
            },
            summary: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["rows", "summary", "recommendation"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Comparison Matrix Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during comparison matrix generation." });
  }
});

// 3. SWOT Analysis Endpoint
app.post("/api/decide/swot", checkApiKey, async (req, res) => {
  try {
    const { title, description, options, criteria } = req.body;

    const optionsStr = options.map((o: any) => `- Option [${o.id}]: ${o.name} - Description: ${o.description}`).join("\n");

    const prompt = `Perform an in-depth SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) for EACH option in the following decision:

Decision: "${title}"
Context: ${description}

Options to analyze:
${optionsStr}

For EACH option, provide:
- Strengths: What internal advantages does this option have? (exactly 4 points)
- Weaknesses: What internal disadvantages or limitations does it have? (exactly 4 points)
- Opportunities: What external opportunities or future positive possibilities could result? (exactly 4 points)
- Threats: What external risks, pitfalls, or negative trends could threaten success? (exactly 4 points)

Conclude with strategic advice on how to leverage the strengths, address the weaknesses, capture opportunities, and mitigate the threats.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optionsSWOT: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  optionId: { type: Type.STRING },
                  swot: {
                    type: Type.OBJECT,
                    properties: {
                      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                      opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                      threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["strengths", "weaknesses", "opportunities", "threats"]
                  }
                },
                required: ["optionId", "swot"]
              }
            },
            strategicAdvice: { type: Type.STRING }
          },
          required: ["optionsSWOT", "strategicAdvice"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("SWOT Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during SWOT generation." });
  }
});

// 4. Decision Mapping Endpoint
app.post("/api/decide/map", checkApiKey, async (req, res) => {
  try {
    const { title, description, options, criteria } = req.body;

    const optionsStr = options.map((o: any) => `- Option [${o.id}]: ${o.name} - Description: ${o.description}`).join("\n");

    const prompt = `Create an interactive decision tree / consequence map for the following complex decision:

Decision: "${title}"
Context: ${description}

Options to map:
${optionsStr}

Construct a logical branching tree structure starting from the decision root.
The tree MUST expand exactly as follows:
- Level 0 (Root): The core decision itself (type: 'decision').
- Level 1 (Children of Root): The options (type: 'option').
- Level 2 (Children of each Option): Immediate consequences. Provide exactly 2 consequences for each Option: one positive (type: 'consequence_positive') and one negative (type: 'consequence_negative'). Give each a probability ("High", "Medium", "Low") and an impact rating from -5 to +5.
- Level 3 (Children of each Consequence): Risks or Mitigations. Provide exactly 2 items for each consequence:
  - For a positive consequence, provide a risk/downside (type: 'risk') and a mitigation/acceleration tactic (type: 'mitigation').
  - For a negative consequence, provide a secondary risk (type: 'risk') and a mitigation tactic (type: 'mitigation').

Ensure every single node has a unique id, a clear and descriptive label, a longer description of the consequence or risk/mitigation, and realistic probability/impact scores. Avoid deep nesting beyond these levels. Make the map highly insightful, realistic, and practical.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            root: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING },
                      description: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            type: { type: Type.STRING },
                            description: { type: Type.STRING },
                            probability: { type: Type.STRING },
                            impact: { type: Type.INTEGER },
                            children: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  label: { type: Type.STRING },
                                  type: { type: Type.STRING },
                                  description: { type: Type.STRING },
                                  probability: { type: Type.STRING },
                                  impact: { type: Type.INTEGER }
                                },
                                required: ["id", "label", "type", "description"]
                              }
                            }
                          },
                          required: ["id", "label", "type", "description", "probability", "impact", "children"]
                        }
                      }
                    },
                    required: ["id", "label", "type", "description", "children"]
                  }
                }
              },
              required: ["id", "label", "type", "description", "children"]
            }
          },
          required: ["root"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Decision Map Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during decision map generation." });
  }
});

// Start the server and configure Vite middleware or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
