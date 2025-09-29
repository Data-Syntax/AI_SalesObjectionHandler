# Developer FAQ

This document contains frequently asked questions that come up during development.

---

### **Q: How do I set up the environment?**

**A:** Refer to the `README.md` file. You will need to have an environment (like Google AI Studio) that provides the `API_KEY` for the Google Gemini service as an environment variable. No server setup is required.

### **Q: The AI response is not formatted correctly. What should I do?**

**A:**
1.  **Check the Browser Console:** Look for errors from the Gemini API or the client-side logic in `index.tsx`.
2.  **Inspect the Prompt:** The `BASE_SYSTEM_INSTRUCTION` in `index.tsx` is critical. Ensure it correctly instructs the AI to follow the 3-part structure. Minor changes to this prompt can significantly affect the output.
3.  **Review Frontend Parsing:** The `renderFormattedResponse` function in `index.tsx` uses regular expressions to parse the AI's text response. If the AI changes its output format slightly, these regex patterns may fail. Check the raw response in the browser console to see if it matches the expected pattern.

### **Q: How does the file upload and context work?**

**A:**
1.  The user selects a file on the frontend (`index.tsx`). The `mammoth.js` library for DOCX parsing is loaded via a `<script>` tag in `index.html`.
2.  On submission, the `handleObjection` function calls `parseDocument`.
3.  The `parseDocument` function uses the browser's `FileReader` API to read the file into an `ArrayBuffer`.
4.  Based on the file's MIME type, it uses client-side libraries (`pdf.js` for PDFs, `mammoth.js` for .docx) to extract raw text directly in the browser.
5.  This extracted text is appended to the `systemInstruction` sent to the Gemini API, providing it with custom context for the response. No server is involved.

### **Q: How is the main page layout structured?**

**A:** The layout is a responsive three-column design managed by CSS Grid in `index.css`.
*   **On large screens (1024px and wider):** It displays three vertical columns:
    1.  **Left Sidebar (`.info-sidebar`):** Contains the static "Objection Handling Framework" for reference.
    2.  **Center Column (`.app-main-column`):** Contains the primary interactive elements, the objection input and the response output areas.
    3.  **Right Sidebar (`.actions-sidebar`):** Contains secondary actions, including "Try an Example" and the "Your Sales Playbook" file upload.
*   **On smaller screens (below 1024px):** The layout gracefully collapses into a single column, stacking the sidebars and main content vertically for optimal viewing on tablets and mobile devices.

The HTML structure for this layout is in `index.html` within the `<div class="main-content-wrapper">` element.