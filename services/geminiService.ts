
import { GoogleGenAI } from "@google/genai";

/**
 * Interface for chat history parts
 */
interface ChatPart {
  text: string;
}

interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: ChatPart[];
}

/**
 * Security-focused Chat Intelligence Service
 */
export const getGeminiChatResponse = async (userMessage: string, history: ChatHistoryItem[]) => {
  try {
    // 1. Initialize SDK (Always new instance per guidelines)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // 2. Setup the chat session with specialized security context
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are the SBOM V3 System AI, a professional cybersecurity and full-stack developer. 
        Your primary task is to help users manage their Software Bill of Materials (SBOM) and resolve security vulnerabilities.
        
        Key Knowledge Areas:
        - SBOM Concepts: Explain CycloneDX, SPDX, transitive dependencies, and dependency trees.
        - Security Scoring: Explain how the 0-100 score is calculated (Critical: -30, High: -20, Medium: -10, Low: -5).
        - Vulnerabilities: Explain CVEs, impact analysis, and remediation steps (patching, version pinning, etc.).
        - System Features: Help users with scanning, PDF report generation, and email delivery.
        
        Guidelines:
        - Be technical, precise, and authoritative.
        - Provide actionable remediation advice for detected threats.
        - Keep responses concise but highly informative.
        - Maintain a professional, cybersecurity-focused tone.`,
        temperature: 0.7,
        topP: 0.95,
      },
      // Pass the previous turns to maintain context
      history: history
    });

    // 3. Send message and await response
    const result = await chat.sendMessage({
      message: userMessage
    });

    // 4. Extract text property (direct access, not a method)
    const responseText = result.text;

    if (!responseText) {
      throw new Error("EMPTY_RESPONSE: The security core returned a null payload.");
    }

    return responseText;
  } catch (error: any) {
    console.error("CRITICAL_CHAT_ERROR:", error);
    
    // Specific error handling for demonstration/debugging
    if (error.message?.includes("429")) {
      return "RATE_LIMIT_EXCEEDED: The intelligence node is currently throttled. Please wait 60 seconds.";
    }
    
    return "LINK_FAILURE: Could not establish a secure connection to the reasoning core. Check your API authorization.";
  }
};
