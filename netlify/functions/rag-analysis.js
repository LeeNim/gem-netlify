// File: netlify/functions/rag-analysis.js - Advanced Data Analysis Logic
// 1. IMPORT AND INITIALIZE
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});
// 2. PASTE YOUR STRUCTURED DATA HERE (Simulating Odoo Export)
const BUSINESS_DATA = ` 
[START BUSINESS DATA LOGS] 
// PASTE YOUR STRUCTURED DATA FROM STEP 2 HERE! 
## 1. MARKETING CAMPAIGN LOGS (Q4/2025) ## 
...  
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
