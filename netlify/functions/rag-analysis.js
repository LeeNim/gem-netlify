// File: netlify/functions/rag-analysis.js - Advanced Data Analysis Logic
// 1. IMPORT AND INITIALIZE
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});
// 2. PASTE YOUR STRUCTURED DATA HERE (Simulating Odoo Export)
const BUSINESS_DATA = ` 
[START BUSINESS DATA LOGS] 

## 1. SALES PERFORMANCE (Q4 2025) ##
- Period: October 2025 - November 2025.
- Top Selling Products: Adobe Creative Cloud (High Value), Canva Pro, Zoom AI Companion, Murf AI, Wolfram.
- Key Customers: "danim-store" (Frequent small orders), FPT Corporation (Bulk software licenses), Porsche Lauzon (VPN services - 291M VND).
- Top Salesperson: Niem Le (Dominates transaction volume).
- Trends: High volume of digital license sales (SaaS) occurring in late November (Nov 24-30).

## 2. CRM & OPPORTUNITIES SNAPSHOT ##
- Major Wins: Porsche Lauzon (265M), Magna International (50M), VNU-HCM University of Science (45M), West Coast Scent Works.
- High Value Lost Opportunities: Zalo Platforms (1B), Amazon D (400M), Clearbanc (200M), FPT (171M).
- Active Pipeline (New/Negotiation): High interest from Education sector (Hanoi Uni of Science, Hue University, Vinhomes).
- Sales Team: Niem Le handles the majority of high-value leads; vankhai24904 and duc281004 handle mid-range opportunities.

## 3. MARKETING CAMPAIGN LOGS (Nov 2025) ##
- Campaign: "Black Fried Day promotion" (Nov 29, 2025).
  - Status: Mixed. High volume of "Processed" contacts (e.g., Unilever, TechcomBank), but significant "Cancelled" status for internal/test contacts (danim, leniem).
- Campaign: "Sign Up For Membership".
  - Status: High activity in late October/November. Many "Scheduled" and "Processed" states.
  - Issues: High cancellation rate on Nov 29 for mass sign-ups (potential spam filter or manual stop).
- Campaign: "Mailing Offers".
  - Performance: High "Rejected" rate for leads like Lead Generation Bot, Zalo Platforms, and VNGGames (Oct 27 & Nov 10).

## 4. INVENTORY & STOCK MOVEMENTS (Sept - Dec 2025) ##
- Manufacturing: Massive output in September 2025 (11,890 units processed).
- Outgoing Delivery: Steady flow. October (812 units), November (108 units).
- Incoming Receipts: Spiked in November 2025 (3,000 units).
- Bottleneck: Very low manufacturing activity in Nov/Dec compared to September peak.

## 5. PURCHASE & PROCUREMENT ANALYSIS ##
- Total Spend: ~322,382,500 VND (Untaxed: ~293M).
- Key Purchase Orders: 
  - P00009 (136.9M VND) - Largest single procurement.
  - P00008 (135.8M VND) - Second largest.
  - P00006 (33M VND).
- Vendor Strategy: High concentration of spending on 2 major orders (P00009, P00008) accounting for >80% of total procurement cost.

[END BUSINESS DATA LOGS]
`;
// 3. MAIN HANDLER
exports.handler = async (event) => {
  // === Handle CORS Preflight (OPTIONS) Request ===
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { user_query } = JSON.parse(event.body);

    // 4. DEFINE ROLE AND PROMPT FOR INSIGHTS
    const system_prompt = `You are a Senior Business Analyst. Your role 
is to analyze the provided raw data (Marketing and Helpdesk logs) and provide 
strategic insights. You must answer the user's question, summarize trends, 
and propose actionable solutions. Respond professionally and strictly based 
on the data provided.`;

    const full_prompt = `${system_prompt}\n\n${BUSINESS_DATA}\n\nAnalysis 
Question: ${user_query}`;

    // 5. CALL GEMINI API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: full_prompt,
      config: {
        temperature: 0.2,
      },
    });

    const bot_answer = response.text.trim();

    // 6. SUCCESS RESPONSE (Includes CORS headers)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        answer: bot_answer,
      }),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);

    // 7. ERROR RESPONSE (Includes CORS headers)
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error:
          "AI Internal Error. Please check GEMINI_API_KEY/Credit on Netlify.",
      }),
    };
  }
};
