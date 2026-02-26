
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 2. Setup the chat session with specialized security context
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are the SBOM Manager AI, a professional cyber-security analyst. 
        Your primary task is to help users manage their Software Bill of Materials and resolve vulnerabilities.
        Guidelines:
        - Be technical, precise, and security-aware.
        - If asked about vulnerabilities, explain the impact and remediation.
        - For SBOM questions, explain concepts like transitive dependencies and supply chain security.
        - Keep responses concise but highly informative.
        - Do not reveal internal keys or system secrets.`,
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
