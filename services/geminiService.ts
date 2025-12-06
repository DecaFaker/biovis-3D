import { GoogleGenAI, Type } from "@google/genai";
import { MutationSite, StyleCommand } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts natural language instructions into 3Dmol.js style commands.
 * Uses a faster model (Gemini 2.5 Flash) for responsiveness.
 */
export const generate3DStyle = async (instruction: string): Promise<StyleCommand[]> => {
  const prompt = `
    You are an expert in 3Dmol.js visualization. 
    Convert the following natural language instruction into a JSON array of style objects.
    Each object must have a "selection" property and a "style" property compatible with 3Dmol.js syntax.

    Common mappings:
    - "cartoon" -> style: { cartoon: { color: 'spectrum' } } (unless color specified)
    - "sphere" -> style: { sphere: {} }
    - "stick" -> style: { stick: {} }
    - "chain A" -> selection: { chain: 'A' }
    - "residue 42" -> selection: { resi: 42 }
    - colors: use standard HTML color names or hex codes.

    Instruction: "${instruction}"

    Return ONLY the JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            selection: { type: Type.OBJECT, properties: {}, description: "3Dmol selection object" },
            style: { type: Type.OBJECT, properties: {}, description: "3Dmol style object" }
          }
        }
      }
    }
  });

  if (!response.text) return [];
  return JSON.parse(response.text);
};

/**
 * Analyzes a scientific paper (text) to find specific amino acid mutations or sites of interest.
 * Uses Gemini 3 Pro Preview with Thinking for high reasoning capability.
 */
export const analyzePaperForMutations = async (paperText: string, pdbId: string): Promise<MutationSite[]> => {
  // Truncate text if it's massive to stay within reasonable limits, though Pro context is large.
  const context = paperText.slice(0, 80000); 

  const prompt = `
    Analyze the following text extracted from a scientific paper related to Protein PDB ID: ${pdbId}.
    Identify specific amino acid residues, mutations, or binding sites discussed as significant (e.g., active sites, mutation variants, binding pockets).

    Extract the residue number, chain ID (if mentioned, otherwise null), wild type amino acid (if mentioned), and the specific mutation or description.
    
    The output must be a JSON array of mutation objects.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Paper Text:\n${context}\n\nTask: ${prompt}`,
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
      maxOutputTokens: 4096, // Reserve tokens for output after thinking
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            residue_number: { type: Type.INTEGER },
            chain_id: { type: Type.STRING, nullable: true },
            wild_type: { type: Type.STRING, nullable: true },
            mutated_to: { type: Type.STRING, nullable: true },
            description: { type: Type.STRING }
          },
          required: ["residue_number", "description"]
        }
      }
    }
  });

  if (!response.text) return [];
  return JSON.parse(response.text);
};
