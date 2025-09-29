# Sales Objection Handler

### One-Liner
An AI-powered web app that helps sales teams generate instant, structured rebuttals to customer objections, tailored by their own sales playbook.

### Problem & Solution
**The Problem:** Salespeople frequently encounter customer objections related to budget, authority, need, and timing. Crafting a consistent, effective, and on-brand response in real-time can be challenging, leading to stalled conversations and lost opportunities.

**Our Solution:** The Sales Objection Handler leverages the power of the Google Gemini API to provide instant, expert-level responses. By entering a customer's objection, a salesperson receives a rebuttal structured according to a proven 3-step framework: Acknowledge, Pivot, and Solve. Crucially, users can upload their own sales playbook or product documentation, allowing the AI to generate responses that are perfectly tailored to their specific offerings and messaging.

### Target Audience
This application is designed for sales professionals, sales managers, and sales enablement teams who want to improve their objection handling skills, standardize their sales messaging, and leverage their existing documentation to power AI-driven coaching.

### Key Features
*   **AI-Powered Rebuttals:** Get instant, relevant responses to any customer objection using the Google Gemini API.
*   **Custom Context via Document Upload:** Upload a PDF, DOC, or DOCX file containing your sales playbook or product info, and the AI will use this context to generate highly tailored responses.
*   **Structured Response Framework:** All suggestions follow a clear three-part structure (Acknowledge, Pivot, Solve) that is easy to apply in live conversations.
*   **Streaming for Speed:** Responses are streamed directly from the Gemini API to the user's browser, delivering a fast and interactive user experience.

---

### Technical Details

**Lines of Code:** ~1150 (recalculated to reflect current project state, up from ~1030)

**Technology Stack**
*   **Frontend:** HTML, CSS, TypeScript
*   **Document Parsing:** [mammoth.js](https://github.com/mwilliamson/mammoth.js) (for .docx), [pdf.js](https://mozilla.github.io/pdf.js/) (for .pdf)
*   **Database:** N/A
*   **Styling:** CSS
*   **APIs / Services:** Google Gemini API (@google/genai)
*   **Deployment / Hosting:** Any static web hosting environment (e.g., Google AI Studio)

---

### System Architecture Overview
This is a fully client-side application that runs entirely in the user's browser. It uses HTML, CSS, and TypeScript for the user interface. When a user submits an objection (and optionally, a document), the frontend JavaScript directly handles the file parsing using the `mammoth.js` and `pdf.js` libraries. It then constructs a prompt with the objection and extracted document text, and makes a direct streaming call to the Google Gemini API using the `@google/genai` SDK. The AI's response is streamed back and displayed in real-time.

### 🤖 AI Prompt
**Instructions for AI:** Based on all the information provided above in this document, please generate two distinct summaries of the application:

1.  **Non-Technical Summary:** Write a simple, easy-to-understand summary for a general audience. Focus on what the app does, the problem it solves, and who would find it useful. Do not use any technical terms from the "Technology Stack" or "System Architecture" sections. Keep this within 2-5 sentences.

    The Sales Objection Handler is a tool for sales professionals facing difficult customer questions. Users can type in a customer's objection, like "your price is too high," and instantly get a suggested three-step response to guide the conversation. For even better results, salespeople can upload their own sales playbook, and the AI will use it to create perfectly tailored answers for their specific product. This helps sales teams respond consistently and effectively, turning challenges into opportunities.

2.  **Technical Summary:** Write a concise summary for a developer or technical project manager. Briefly explain the application's purpose and then detail its architecture and the key technologies used to build it. Keep this within 2-5 sentences.

    This application is a client-side web app designed to assist sales teams by generating AI-powered responses to customer objections. The frontend is built with HTML, CSS, and TypeScript, and it communicates directly with the Google Gemini API using the `@google/genai` SDK. Client-side libraries (mammoth.js, pdf.js) are used to parse optional user-uploaded documents (DOCX, PDF) to provide context for the AI, with the generated response streamed directly to the UI for a real-time user experience.