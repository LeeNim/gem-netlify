// File: netlify/functions/rag-bot.js

// 1. IMPORT AND INITIALIZE
const { GoogleGenAI } = require("@google/genai");
// The SDK automatically uses the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

// 2. KNOWLEDGE BASE (In-Context Learning Content)
// Students: Paste your structured policy content here.
const POLICY_KNOWLEDGE = `
    [START ODOO PROCEDURES]
    1. General System Usage
    1.1. Navigation & Data
    • Navigation Standard: Users must use internal Breadcrumbs (top-left). Browser 'Back' button is prohibited to prevent data loss.
    • Communication: All client interactions must be recorded via the "Send Message" or "Log Note" feature in the respective document chatter.

    2. HR Standard Procedures
    2.1. Attendance
    • Daily Process: Staff must perform Check-in/Check-out via the main Attendance dashboard immediately upon arrival/departure.
    • Manager Access: Managers use Kiosk Mode for collective timekeeping.
    2.2. Time Off Management
    • Request Flow: Employee submits via "My Time Off" -> Select Type/Dates -> Save.
    • Approval Flow: Manager accesses "Approvals" -> Verify dates -> Approve/Refuse.

    3. Sales Standard Procedures
    3.1. Sales Workflow
    • Quotation: Create New -> Add Customer & Products -> Send by Email (Mandatory before confirmation).
    • Order Confirmation: Status must be converted from Quotation to Sales Order (SO) by clicking "Confirm" after client acceptance.
    3.2. Customer Data (CRM)
    • Data Entry: New contacts must include Name, Phone, and Email.
    • Lookup: Check "Smart Buttons" on partner profile for transaction history before contacting.

    4. Inventory Standard Procedures
    4.1. Incoming Shipments (Receipts)
    • Process: Open Receipt -> Verify physical quantity matches Demand -> Validate.
    • Discrepancy: If quantity differs, create Backorder or Reject based on procurement terms.
    4.2. Outgoing Shipments (Delivery)
    • Flow: Select Delivery Order -> Check Availability -> Input "Done" quantity -> Validate.
    4.3. Stock Accuracy
    • Adjustments: Periodic counts are executed via "Inventory Adjustments" -> Start Inventory -> Input real count -> Apply.
    [END ODOO PROCEDURES]
`;

// 3. MAIN HANDLER
exports.handler = async (event) => {
  // === 3.1. FIX: Handle CORS Preflight (OPTIONS) Request ===
  // This is essential for the browser to allow the Odoo site to communicate with Netlify.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // 204 No Content is standard for a successful preflight
      headers: {
        "Access-Control-Allow-Origin": "*", // Allows access from any domain
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }
  // =======================================================

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { user_query } = JSON.parse(event.body);

    // 3.2. DEFINE ROLE AND CONSTRUCT ICL PROMPT
    const system_prompt = `You are a strict internal policy assistant. 
Answer employee questions ONLY based on the following policy document. If the 
information is not explicitly found in the document, reply with: "Sorry, I 
cannot find this information in the policy document."`;

    const full_prompt = `${system_prompt}\n\n${POLICY_KNOWLEDGE}\n\nQuestion: ${user_query}`;

    // 3.3. CALL GEMINI API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // A fast and cost-effective model suitable for ICL
      contents: full_prompt,
      config: {
        temperature: 0.1, // Low temperature for factual, policy based answers
      },
    });

    const bot_answer = response.text.trim();

    // 3.4. SUCCESS RESPONSE (STATUS 200) - Includes necessary CORS headers
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

    // 3.5. ERROR RESPONSE (STATUS 500) - Includes necessary CORS headers
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
