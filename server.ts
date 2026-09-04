import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API client if key is available
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory cache for explanations & rate-limiting guard
const explanationCache = new Map<string, string>();
let rateLimitBackoffUntil = 0;

function callWithTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), ms))
  ]);
}

/**
 * Resilient content generator with model fallback (gemini-3.8-flash -> gemini-2.5-flash)
 */
async function generateWithModelFallback(
  ai: GoogleGenAI,
  prompt: string,
  config: any,
  timeoutMs = 8000
): Promise<string> {
  const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config,
        }),
        timeoutMs
      );
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err);
      // Fall through to next model if model is busy, unavailable, or times out
      if (
        errStr.includes('503') || 
        errStr.includes('UNAVAILABLE') || 
        errStr.includes('high demand') || 
        errStr.includes('429') || 
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('timeout')
      ) {
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("AI generation unavailable across models");
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    product: "Agent Spend Guardian",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    mode: process.env.GEMINI_API_KEY ? "HYBRID_AI_DETERMINISTIC" : "ZERO_KEY_DEMO_MODE",
    timestamp: new Date().toISOString()
  });
});

/**
 * Fallback Natural Language Policy Parser
 * Used when no AI key is present or AI service is unavailable.
 */
function deterministicPolicyParser(prompt: string) {
  const text = prompt.toLowerCase();

  // Extract daily limit
  let dailyLimit = 5000;
  const dailyMatch = text.match(/(?:daily|per day|day)[^\d]*?(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:l|lakh|k)?/i) ||
                     text.match(/(?:spend up to|limit of|cap of)[^\d]*?(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:l|lakh|k)?/i);
  if (dailyMatch) {
    let raw = dailyMatch[1].replace(/,/g, '');
    let val = parseFloat(raw);
    if (text.includes('lakh') || text.includes('1,00,000') || text.includes('100000')) {
      val = Math.max(val, 100000);
    }
    if (val > 0) dailyLimit = val;
  }

  // Extract per-transaction limit
  let perTransactionLimit = Math.min(dailyLimit * 0.4, 2000);
  const txMatch = text.match(/(?:per[\s-]transaction|single|transaction[s]? above|each transaction)[^\d]*?(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i);
  if (txMatch) {
    let val = parseFloat(txMatch[1].replace(/,/g, ''));
    if (val > 0) perTransactionLimit = val;
  }

  // Extract new merchant action
  let newMerchantAction: 'approval_required' | 'block' = 'approval_required';
  if (text.includes('block new merchant') || text.includes('forbid new merchant') || text.includes('ban unknown')) {
    newMerchantAction = 'block';
  }

  // Extract categories
  const categoryKeywords = [
    { word: 'food', cat: 'Food & Grocery' },
    { word: 'grocery', cat: 'Food & Grocery' },
    { word: 'meal', cat: 'Food & Grocery' },
    { word: 'flight', cat: 'Flights & Hotels' },
    { word: 'hotel', cat: 'Flights & Hotels' },
    { word: 'travel', cat: 'Flights & Hotels' },
    { word: 'software', cat: 'Office Supplies & Software' },
    { word: 'office', cat: 'Office Supplies & Software' },
    { word: 'supplies', cat: 'Office Supplies & Software' },
    { word: 'hardware', cat: 'Office Supplies & Software' },
    { word: 'cloud', cat: 'Office Supplies & Software' },
    { word: 'rides', cat: 'Transport & Commute' },
    { word: 'cab', cat: 'Transport & Commute' },
  ];

  const matchedCategories = new Set<string>();
  for (const item of categoryKeywords) {
    if (text.includes(item.word)) {
      matchedCategories.add(item.cat);
    }
  }

  const allowedCategories = matchedCategories.size > 0 
    ? Array.from(matchedCategories) 
    : ['Food & Grocery'];

  return {
    allowedCategories,
    dailyLimit,
    perTransactionLimit,
    newMerchantAction,
    source: 'DETERMINISTIC_PARSER',
  };
}

/**
 * POST /api/policy/parse
 * Natural-language policy -> Structured JSON rules
 */
app.post("/api/policy/parse", async (req, res) => {
  try {
    const { naturalLanguagePolicy } = req.body;
    if (!naturalLanguagePolicy || typeof naturalLanguagePolicy !== "string" || naturalLanguagePolicy.trim().length === 0) {
      return res.status(400).json({ error: "naturalLanguagePolicy must be a non-empty string" });
    }
    if (naturalLanguagePolicy.length > 10000) {
      return res.status(400).json({ error: "naturalLanguagePolicy exceeds maximum allowed length (10,000 characters)" });
    }

    const ai = getAIClient();
    if (!ai) {
      // Fallback deterministic parsing
      const parsed = deterministicPolicyParser(naturalLanguagePolicy);
      return res.json({
        ...parsed,
        source: "ZERO_KEY_DETERMINISTIC_PARSER"
      });
    }

    // Call Gemini API to parse natural language policy
    const prompt = `You are a financial governance policy compiler for AI payment agents.
Parse the following natural language spending policy into a strict JSON object.

Allowed Fields:
- "allowedCategories": Array of strings (e.g. ["Food & Grocery", "Flights & Hotels", "Office Supplies & Software", "SaaS Subscriptions"])
- "dailyLimit": number (in Indian Rupees INR, e.g. 5000, 50000, 100000)
- "perTransactionLimit": number (in Indian Rupees INR, e.g. 2000, 20000, 25000)
- "newMerchantAction": "approval_required" or "block"
- "unusualTimeCheck": boolean (true if time bounds should be enforced, default true)

Input Policy Text:
"${naturalLanguagePolicy}"

Output strictly ONLY valid JSON, with no markdown formatting, no code blocks, no backticks, no extra text.`;

    try {
      const rawText = await generateWithModelFallback(
        ai,
        prompt,
        {
          responseMimeType: "application/json",
          maxOutputTokens: 300,
          temperature: 0.1,
        },
        8000
      );

      // Clean JSON if backticks present
      const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsedData = JSON.parse(cleanJson);

      // Validate required fields
      const dailyLimit = Number(parsedData.dailyLimit) || 5000;
      const perTransactionLimit = Number(parsedData.perTransactionLimit) || Math.min(dailyLimit, 2000);
      const allowedCategories = Array.isArray(parsedData.allowedCategories) && parsedData.allowedCategories.length > 0 
        ? parsedData.allowedCategories 
        : ['Food & Grocery'];
      const newMerchantAction = parsedData.newMerchantAction === 'block' ? 'block' : 'approval_required';

      return res.json({
        allowedCategories,
        dailyLimit,
        perTransactionLimit,
        newMerchantAction,
        unusualTimeCheck: true,
        source: "AI_PARSER"
      });
    } catch (aiErr: any) {
      const errStr = String(aiErr?.message || aiErr);
      const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
      const isHighDemand = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');
      if (isHighDemand || isQuota) {
        console.info("[AI Policy Parser] Model capacity limit or spike; applying deterministic compiler seamlessly.");
      } else {
        console.info("[AI Policy Parser] Deterministic fallback activated:", aiErr?.message || aiErr);
      }
      const fallback = deterministicPolicyParser(naturalLanguagePolicy);
      return res.json(fallback);
    }
  } catch (err: any) {
    console.error("Policy parse route error:", err);
    res.status(500).json({ error: err.message || "Failed to parse policy" });
  }
});

const KNOWN_CONFIGURED_AGENT_IDS = new Set([
  'foodbot',
  'cloudinfrabot',
  'marketingbot',
  'travelbot',
  'procurementbot'
]);

function isValidAgentId(id: unknown): boolean {
  if (typeof id !== 'string' || !id.trim()) return false;
  return KNOWN_CONFIGURED_AGENT_IDS.has(id.trim().toLowerCase());
}

/**
 * POST /api/explain
 * Structured deterministic decision reasons -> 1-2 sentence human explanation
 */
app.post("/api/explain", async (req, res) => {
  try {
    const { agentId, agentName, decision, riskScore, reasons, merchant, amount, isCompromise } = req.body;

    // Guard clauses: Validate required inputs with standard responses
    if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
    if (agentId !== undefined && !isValidAgentId(agentId)) {
      return res.status(400).json({ error: "Unknown agentId." });
    }
    if (!agentName || typeof agentName !== "string" || agentName.trim().length === 0) {
      return res.status(400).json({ error: "agentName must be a non-empty string" });
    }
    if (!decision || !['ALLOW', 'APPROVAL_REQUIRED', 'BLOCK'].includes(decision)) {
      return res.status(400).json({ error: "decision must be one of 'ALLOW', 'APPROVAL_REQUIRED', or 'BLOCK'" });
    }
    if (!merchant || typeof merchant !== "string" || merchant.trim().length === 0) {
      return res.status(400).json({ error: "merchant must be a non-empty string" });
    }
    if (riskScore !== undefined && (typeof riskScore !== "number" || isNaN(riskScore) || riskScore < 0 || riskScore > 100)) {
      return res.status(400).json({ error: "riskScore must be a number between 0 and 100" });
    }
    if (reasons !== undefined && !Array.isArray(reasons)) {
      return res.status(400).json({ error: "reasons must be an array of strings" });
    }

    const numAmount = Number(amount);
    const formattedAmount = `₹${numAmount.toLocaleString('en-IN')}`;
    const safeReasons = Array.isArray(reasons) ? reasons : [];

    // Helper for deterministic fallback text
    const getDeterministicExplanation = () => {
      if (isCompromise) {
        return `🚨 Critical compromise alert: ${agentName}'s attempt of ${formattedAmount} at ${merchant} was hard-blocked due to concurrent category violations, velocity burst, and off-hour anomaly.`;
      }
      if (decision === 'BLOCK') {
        return `${agentName}'s payment of ${formattedAmount} to ${merchant} was blocked because of ${safeReasons.slice(0, 2).join(' and ').toLowerCase() || 'policy violations'}.`;
      }
      if (decision === 'APPROVAL_REQUIRED') {
        return `${agentName}'s payment of ${formattedAmount} to ${merchant} requires human review due to ${safeReasons.slice(0, 2).join(' and ').toLowerCase() || 'unverified merchant and risk checks'}.`;
      }
      return `${agentName}'s payment of ${formattedAmount} to ${merchant} was authorized as it fully complies with authorized spending policy and behavioral baselines.`;
    };

    // Cache key based on semantic inputs
    const cacheKey = `${agentName}|${decision}|${merchant}|${numAmount}|${safeReasons.join(';')}|${isCompromise ? '1' : '0'}`;
    const cached = explanationCache.get(cacheKey);
    if (cached) {
      return res.json({
        explanation: cached,
        source: "CACHED_EXPLANATION"
      });
    }

    const ai = getAIClient();
    // If no client or if currently in 429 rate-limit backoff window, serve deterministic immediately
    if (!ai || Date.now() < rateLimitBackoffUntil) {
      const fallback = getDeterministicExplanation();
      return res.json({
        explanation: fallback,
        source: "ZERO_KEY_DETERMINISTIC"
      });
    }

    // Call Gemini API to generate explanation strictly grounded in deterministic reasons
    const prompt = `You are the explainability engine of Agent Spend Guardian.
A deterministic security rule engine evaluated a transaction attempt with the following facts:

- Agent: ${agentName}
- Attempted Amount: ${formattedAmount}
- Merchant: ${merchant}
- Final Decision: ${decision} (DO NOT change or question this decision)
- Risk Score: ${riskScore} / 100
- Specific Deterministic Reasons:
${safeReasons.map((r: string) => `  * ${r}`).join('\n')}
- Compromise Flag: ${isCompromise ? 'YES' : 'NO'}

Rules:
1. Write exactly 1 to 2 concise, clear sentences explaining why this decision was made.
2. Rely ONLY on the provided deterministic reasons. Do NOT invent new facts or signals.
3. If decision is BLOCK, explain what violated policy.
4. If decision is APPROVAL_REQUIRED, explain why human confirmation is needed.
5. If decision is ALLOW, explain that it complies with policy.
6. Output raw text only, no quotes, no markdown wrappers.`;

    try {
      const explanation = await generateWithModelFallback(
        ai,
        prompt,
        {
          maxOutputTokens: 120,
          temperature: 0.2,
        },
        8000
      );

      const finalExp = explanation || getDeterministicExplanation();
      
      // Store in memory cache (cap size to 150)
      if (explanationCache.size > 150) {
        const firstKey = explanationCache.keys().next().value;
        if (firstKey) explanationCache.delete(firstKey);
      }
      explanationCache.set(cacheKey, finalExp);

      return res.json({
        explanation: finalExp,
        source: "AI_EXPLANATION"
      });
    } catch (aiErr: any) {
      const errStr = String(aiErr?.message || aiErr);
      const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
      const isHighDemand = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');
      const isTimeout = errStr.includes('timeout');

      if (isHighDemand) {
        // Enforce a brief quiet backoff for model spike
        rateLimitBackoffUntil = Date.now() + 8000;
        console.info("[AI Explain] Model experiencing high demand (503). Serving deterministic explanation smoothly.");
      } else if (isQuota) {
        rateLimitBackoffUntil = Date.now() + 10000;
        console.info("[AI Explain] Gemini rate-limit active (429). Serving deterministic explanation.");
      } else if (isTimeout) {
        console.info("[AI Explain] Latency limit reached, served deterministic explanation smoothly.");
      } else {
        console.info("[AI Explain] Fallback applied:", aiErr?.message || aiErr);
      }

      const fallback = getDeterministicExplanation();
      return res.json({
        explanation: fallback,
        source: "ZERO_KEY_DETERMINISTIC"
      });
    }
  } catch (err: any) {
    console.error("Explain route error:", err);
    res.status(500).json({ error: err.message || "Failed to generate explanation" });
  }
});

/**
 * POST /api/incident/explain
 * Generates an executive incident briefing from pre-computed deterministic facts.
 * Gemini never calculates risk or authorization; it only summarizes already-computed facts.
 */
app.post("/api/incident/explain", async (req, res) => {
  try {
    const { 
      incidentId, 
      agentId, 
      agentName, 
      merchant, 
      amount, 
      category, 
      decision, 
      riskScore, 
      trustScore, 
      securityState, 
      triggeredSignals, 
      actionTaken, 
      amountProtected 
    } = req.body;

    // Guard clauses: Validate required inputs with standard responses
    if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
    if (agentId !== undefined && !isValidAgentId(agentId)) {
      return res.status(400).json({ error: "Unknown agentId." });
    }
    if (!incidentId || typeof incidentId !== "string") {
      return res.status(400).json({ error: "incidentId must be a valid string." });
    }

    const formattedAmount = `₹${Number(amount).toLocaleString('en-IN')}`;
    const formattedProtected = `₹${Number(amountProtected || amount).toLocaleString('en-IN')}`;
    const safeSignals = Array.isArray(triggeredSignals) ? triggeredSignals : [];

    // Deterministic fallback summary
    const fallbackSummary = `Incident ${incidentId}: ${agentName || 'Agent'} attempted an unauthorized transaction of ${formattedAmount} at ${merchant} (Risk Score: ${riskScore}/100, Trust: ${trustScore}). SpendGuardian intervened with ${decision}, placing the agent in ${securityState} state and protecting ${formattedProtected} in corporate funds.`;

    const ai = getAIClient();
    if (!ai) {
      return res.json({
        summary: fallbackSummary,
        source: "ZERO_KEY_DETERMINISTIC"
      });
    }

    const prompt = `You are the chief security compliance auditor for Agent Spend Guardian.
A security incident was generated from deterministic system telemetry:

- Incident ID: ${incidentId}
- Agent: ${agentName} (${agentId})
- Attempted Amount: ${formattedAmount}
- Merchant: ${merchant} (Category: ${category})
- Deterministic Decision: ${decision}
- Risk Score: ${riskScore} / 100
- Trust Score: ${trustScore} / 100
- Adaptive Security State: ${securityState}
- Signals Triggered: ${safeSignals.join(', ') || 'Policy breach'}
- Action Taken: ${actionTaken}
- Amount Protected: ${formattedProtected}

Write a professional, concise 2 to 3 sentence executive incident briefing for the CFO / Security Director.
RULES:
1. Ground your response STRICTLY in the facts above.
2. DO NOT question or alter any scores, decisions, or states.
3. State what happened, the intervention taken, and the financial impact protected.
4. Output raw clean text only, no quotes, no markdown wrappers.`;

    try {
      const summary = await generateWithModelFallback(
        ai,
        prompt,
        {
          maxOutputTokens: 160,
          temperature: 0.2,
        },
        8000
      );

      return res.json({
        summary: summary || fallbackSummary,
        source: "AI_EXECUTIVE_BRIEFING"
      });
    } catch (aiErr: any) {
      return res.json({
        summary: fallbackSummary,
        source: "DETERMINISTIC_FALLBACK"
      });
    }
  } catch (err: any) {
    console.error("Incident explain error:", err);
    res.status(500).json({ error: err.message || "Failed to generate incident briefing" });
  }
});

/**
 * POST /api/razorpay/test-payment
 * Evaluates payment processing with integrity:
 * - If RAZORPAY_KEY_ID & SECRET are configured: invokes Razorpay Orders API for genuine test payment order.
 * - If keys are NOT configured: honestly marks response as SIMULATED_DEMO_MODE (never claims to be live API).
 */
app.post("/api/razorpay/test-payment", async (req, res) => {
  try {
    const { amount, merchant, agentId } = req.body;

    // Guard clauses: Validate required inputs with standard responses
    if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
    if (!agentId || typeof agentId !== "string" || !isValidAgentId(agentId)) {
      return res.status(400).json({ error: "Unknown agentId." });
    }
    const numAmount = Number(amount);
    if (!merchant || typeof merchant !== "string" || merchant.trim().length === 0) {
      return res.status(400).json({ error: "merchant must be a non-empty string" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const hasKeys = Boolean(keyId && keySecret);

    if (hasKeys) {
      try {
        // Live call to Razorpay Orders API
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
        const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(numAmount * 100), // amount in paise
            currency: "INR",
            receipt: `rcpt_${agentId.slice(0, 10)}_${Date.now()}`,
            notes: {
              agentId,
              merchant,
              governance: "Agent Spend Guardian",
            },
          }),
        });

        if (rzpResponse.ok) {
          const orderData = (await rzpResponse.json()) as { id: string; status: string };
          return res.json({
            status: "success",
            paymentId: orderData.id,
            mode: "RAZORPAY_TEST_ORDERS_API",
            gatewayCalled: true,
            isSimulated: false,
            amount: numAmount,
            currency: "INR",
            merchant,
            agentId,
            note: "Verified order created via Razorpay Orders API.",
            timestamp: new Date().toISOString(),
          });
        } else {
          const errData = await rzpResponse.text();
          console.warn("Razorpay API returned non-OK status:", rzpResponse.status, errData);
          return res.status(502).json({
            error: "Razorpay API error",
            status: rzpResponse.status,
            details: errData,
          });
        }
      } catch (callErr: any) {
        console.warn("Failed to contact Razorpay API:", callErr);
        return res.status(502).json({
          error: "Failed to communicate with Razorpay API",
          details: callErr.message || String(callErr),
        });
      }
    }

    // Keys not configured: honest, transparent simulated response with cryptographically secure UUID
    const simPaymentId = `sim_pay_${crypto.randomUUID()}`;
    return res.json({
      status: "success",
      paymentId: simPaymentId,
      mode: "SIMULATED_DEMO_MODE",
      gatewayCalled: false,
      isSimulated: true,
      amount: numAmount,
      currency: "INR",
      merchant,
      agentId,
      note: "Simulated sandbox execution; live Razorpay API was not invoked.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Test payment endpoint error:", err);
    res.status(500).json({ error: err.message || "Failed to process payment request" });
  }
});

// Setup Vite development middleware or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Agent Spend Guardian running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
