/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
// Import pdf.js from a CDN. The AI Studio environment handles module resolution.
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs";

// Configure pdf.js worker. It's hosted on the same CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs";

// mammoth.js is loaded via a script tag in index.html and attached to the window.
// We declare it here to satisfy TypeScript.
declare const mammoth: any;


const objectionInput = document.getElementById('objection-input') as HTMLTextAreaElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const responseOutput = document.getElementById('response-output') as HTMLDivElement;
const statusMessage = document.getElementById('status-message') as HTMLDivElement;
const docUpload = document.getElementById('doc-upload') as HTMLInputElement;
const fileInfo = document.getElementById('file-info') as HTMLDivElement;

const BASE_SYSTEM_INSTRUCTION = `You are an expert sales coach and AI assistant.

**Your Task:**
Given a customer objection and optional context from a user-provided document (e.g., a sales playbook, product one-pager), provide an EXTREMELY CONCISE, polite, professional, and effective rebuttal.

The rebuttal MUST be structured in three parts, clearly labeled as follows. Ensure each part contains substantial text but is as brief as possible. The total combined response across all three parts SHOULD NOT exceed 4 sentences.

1.  **Acknowledge and Validate:** Briefly acknowledge or validate the customer's concern. Keep this very brief, aiming for 1 short sentence.
2.  **Pivot with a Question:** Ask an open-ended question designed to make them think, reframe their perspective, or uncover underlying needs. Make the question direct and to the point, ideally one clear sentence.
3.  **Present the Solution:** Explain how the product or service addresses the core issue or the needs surfaced by the pivot question. Focus on 1-2 key benefits. Use clear, impactful, and concise language. Avoid jargon. Keep this to a maximum of 2 short sentences. If context from a document is provided, leverage it heavily to make this part specific and compelling.

Your tone should be helpful, confident, and professional.`;

async function parseDocument(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("File could not be read."));
                }
                const buffer = event.target.result as ArrayBuffer;
                if (file.type === 'application/pdf') {
                    const loadingTask = pdfjsLib.getDocument(new Uint8Array(buffer));
                    const pdf = await loadingTask.promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        // A more robust way to reconstruct text from PDF items
                        text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                    }
                    resolve(text);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                    resolve(result.value);
                } else if (file.type === 'text/plain') {
                    resolve(new TextDecoder().decode(buffer));
                } else {
                    console.warn(`Unsupported file type: ${file.type}`);
                    // Reject with a user-friendly error
                    reject(new Error(`Unsupported file type: ${file.name}. Please upload a .pdf, .docx, or .txt file.`));
                }
            } catch (error) {
                console.error('Error parsing document:', error);
                reject(new Error(`Could not parse document: ${(error as Error).message}`));
            }
        };
        reader.onerror = () => reject(new Error("Error reading file."));
        reader.readAsArrayBuffer(file);
    });
}

function cleanResponsePart(partText: string): string {
  if (!partText) return '';

  const lines = partText.split('\n');
  const cleanedLines = lines.map(line => {
    let cleanedLine = line.trim();
    // Patterns to remove from the beginning of each line
    const patternsToRemove = [
      /^\s*\d+\.\s*\*\*\s*/, // Matches "1. ** "
      /^\s*\d+\.\s*/,       // Matches "1. "
      /^\s*\*\*\s*/,        // Matches "** "
      /^\s*-\s*\*\*\s*/,    // Matches "- ** "
      /^\s*-\s*/,           // Matches "- "
      /^\s*\*\s*/,          // Matches "* " (markdown bullet)
    ];
    for (const pattern of patternsToRemove) {
      cleanedLine = cleanedLine.replace(pattern, '');
    }
    // Remove leading/trailing quotes if the entire line is quoted (after other cleaning)
    if ((cleanedLine.startsWith('"') && cleanedLine.endsWith('"')) || (cleanedLine.startsWith("'") && cleanedLine.endsWith("'"))) {
        cleanedLine = cleanedLine.substring(1, cleanedLine.length - 1);
    }
    return cleanedLine.trim(); // Trim each line individually
  });

  // Join lines back, but filter out completely empty lines that might result from cleaning.
  // Then trim the whole result.
  return cleanedLines.filter(line => line.length > 0).join('\n').trim();
}

function renderFormattedResponse(rawText: string) {
    // Sanitize raw text to prevent potential HTML injection if displayed raw
    const sanitizedText = rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const matchFence = rawText.match(fenceRegex);
    if (matchFence && matchFence[2]) {
        rawText = matchFence[2].trim();
    } else {
        rawText = rawText.trim();
    }

    const parts: { acknowledge: string; pivot: string; solution: string;[key: string]: string } = {
      acknowledge: '',
      pivot: '',
      solution: ''
    };

    const ackRegex = /1\.\s*Acknowledge and Validate:([\s\S]*?)2\.\s*Pivot with a Question:/i;
    const pivotRegex = /2\.\s*Pivot with a Question:([\s\S]*?)3\.\s*Present the Solution:/i;
    const solutionRegex = /3\.\s*Present the Solution:([\s\S]*)/i;
    
    // Simpler regex if the numbers are not always present
    const simpleAckRegex = /Acknowledge and Validate:([\s\S]*?)Pivot with a Question:/i;
    const simplePivotRegex = /Pivot with a Question:([\s\S]*?)Present the Solution:/i;
    const simpleSolutionRegex = /Present the Solution:([\s\S]*)/i;

    let matchAck = rawText.match(ackRegex) || rawText.match(simpleAckRegex);
    if (matchAck && matchAck[1]) {
      parts.acknowledge = matchAck[1].trim();
    }

    let matchPivot = rawText.match(pivotRegex) || rawText.match(simplePivotRegex);
    if (matchPivot && matchPivot[1]) {
      parts.pivot = matchPivot[1].trim();
    }

    let matchSolution = rawText.match(solutionRegex) || rawText.match(simpleSolutionRegex);
    if (matchSolution && matchSolution[1]) {
      parts.solution = matchSolution[1].trim();
    }
    
    // Fallback parsing if regex fails to capture all parts cleanly
    if (!parts.acknowledge && !parts.pivot && !parts.solution) {
        const lines = rawText.split('\n');
        let currentPartKey = '';
        lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('acknowledge and validate:')) {
                currentPartKey = 'acknowledge';
                parts.acknowledge += line.substring(line.toLowerCase().indexOf('acknowledge and validate:') + 'acknowledge and validate:'.length).trimStart() + '\n';
            } else if (lowerLine.includes('pivot with a question:')) {
                currentPartKey = 'pivot';
                parts.pivot += line.substring(line.toLowerCase().indexOf('pivot with a question:') + 'pivot with a question:'.length).trimStart() + '\n';
            } else if (lowerLine.includes('present the solution:')) {
                currentPartKey = 'solution';
                parts.solution += line.substring(line.toLowerCase().indexOf('present the solution:') + 'present the solution:'.length).trimStart() + '\n';
            } else if (currentPartKey) {
                parts[currentPartKey] += line + '\n';
            }
        });
    }

    const finalAcknowledge = cleanResponsePart(parts.acknowledge);
    const finalPivot = cleanResponsePart(parts.pivot);
    const finalSolution = cleanResponsePart(parts.solution);

    if (finalAcknowledge || finalPivot || finalSolution) {
      responseOutput.innerHTML = `
        <h4>Acknowledge and Validate:</h4>
        <p>${finalAcknowledge.replace(/\n/g, '<br>')}</p>
        <h4>Pivot with a Question:</h4>
        <p>${finalPivot.replace(/\n/g, '<br>')}</p>
        <h4>Present the Solution:</h4>
        <p>${finalSolution.replace(/\n/g, '<br>')}</p>
      `;
      statusMessage.textContent = 'Response generated successfully.';
      statusMessage.classList.remove('loading', 'error');
      statusMessage.classList.add('success');
    } else {
        responseOutput.innerHTML = `<p>The AI returned a response, but it could not be formatted correctly. Here is the raw output:</p><pre>${sanitizedText}</pre>`;
        statusMessage.textContent = 'Response generated, but formatting failed.';
        statusMessage.classList.remove('loading');
        statusMessage.classList.add('error');
    }
}


async function handleObjection() {
  const objection = objectionInput.value.trim();
  if (!objection) {
    statusMessage.textContent = 'Please enter a customer objection.';
    statusMessage.classList.remove('loading');
    statusMessage.classList.add('error');
    responseOutput.innerHTML = '<p>Enter an objection above to get a suggestion.</p>';
    return;
  }

  submitButton.disabled = true;
  responseOutput.innerHTML = '';
  statusMessage.classList.remove('error', 'success');
  statusMessage.classList.add('loading');
  
  const loadingMessages = [
    "Contacting the AI sales coach...",
    "Reviewing your provided documents...",
    "Analyzing the customer objection...",
    "Crafting the structured response...",
  ];
  let messageIndex = 0;
  statusMessage.textContent = loadingMessages[messageIndex];
  const loadingInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      statusMessage.textContent = loadingMessages[messageIndex];
  }, 2000);

  try {
    // This app is now fully client-side.
    // The API key is expected to be provided by the AI Studio environment.
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not available. Please configure it in the environment.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let documentText = '';
    if (docUpload.files && docUpload.files.length > 0) {
        try {
            documentText = await parseDocument(docUpload.files[0]);
        } catch (e) {
            throw new Error(`Failed to read document: ${(e as Error).message}`);
        }
    }

    let systemInstruction = BASE_SYSTEM_INSTRUCTION;
    if (documentText) {
        systemInstruction += `\n\n**IMPORTANT: Use the following document context to tailor your response:**\n---BEGIN DOCUMENT CONTEXT---\n${documentText}\n---END DOCUMENT CONTEXT---`;
    }

    const userPrompt = `**Customer Objection:**\n"${objection}"\n\n**Structured Rebuttal:**`;

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 0 } // Optimize for speed
        }
    });

    clearInterval(loadingInterval); // Stop rotating messages once we get the first byte
    statusMessage.textContent = 'Receiving response...';
    
    let rawText = '';
    for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if (chunkText) {
            rawText += chunkText;
            // Display raw text as it streams in, converting newlines to <br> for display
            responseOutput.innerHTML = rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        }
    }

    // Now that the stream is complete, format the final response
    renderFormattedResponse(rawText);

  } catch (error) {
    console.error('Error handling objection:', error);
    clearInterval(loadingInterval); // Ensure interval is cleared on error
    statusMessage.textContent = `An error occurred: ${(error as Error).message}`;
    statusMessage.classList.remove('loading', 'success');
    statusMessage.classList.add('error');
    responseOutput.innerHTML = '<p>Could not get a response. Please check the console for details and try again.</p>';
  } finally {
    clearInterval(loadingInterval); // Ensure interval is cleared in all cases
    submitButton.disabled = false;
  }
}

submitButton.addEventListener('click', handleObjection);
objectionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        handleObjection();
    }
});

// Add collapsible functionality
document.querySelectorAll('.collapsible-trigger').forEach(button => {
    button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isExpanded));
        const content = document.getElementById(button.getAttribute('aria-controls'));
        if (content) {
            content.style.display = isExpanded ? 'none' : 'block';
        }
    });
});

// Add event listeners for example buttons
document.querySelectorAll('.example-button').forEach(button => {
    button.addEventListener('click', () => {
        const objectionText = button.textContent;
        if (objectionText) {
            objectionInput.value = objectionText;
            handleObjection();
            // Scroll to the response area for visibility
            responseOutput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
});

// File upload handler
docUpload.addEventListener('change', () => {
    if (docUpload.files && docUpload.files.length > 0) {
        const file = docUpload.files[0];
        fileInfo.innerHTML = `
            <span>${file.name}</span>
            <button class="remove-file-button" aria-label="Remove file">&times;</button>
        `;

        const removeButton = fileInfo.querySelector('.remove-file-button');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                docUpload.value = ''; // Clear the file input
                fileInfo.innerHTML = ''; // Clear the display
            });
        }
    } else {
        fileInfo.innerHTML = '';
    }
});