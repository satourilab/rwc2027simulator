import { GoogleGenAI, Type } from "@google/genai";
import { Team, MatchResult } from "../types";

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const simulateMatchWithAI = async (teamA: Team, teamB: Team, stage: string): Promise<MatchResult> => {
  if (!ai) {
    throw new Error("API Key missing");
  }

  const prompt = `
    Simulate a Rugby World Cup 2027 ${stage} match between ${teamA.name} and ${teamB.name}.
    Consider their relative strengths based on these ratings: ${teamA.name} (${teamA.rating}), ${teamB.name} (${teamB.rating}).
    
    Return a realistic rugby score. Tries = 5, conv = 2, pen = 3, dg = 3.
    If it is a knockout match, ensure there is a winner (no draws).
    Provide a brief, exciting 1-sentence summary of the match.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scoreA: { type: Type.INTEGER, description: `Final score for ${teamA.name}` },
            scoreB: { type: Type.INTEGER, description: `Final score for ${teamB.name}` },
            summary: { type: Type.STRING, description: "A brief summary of the match outcome" }
          },
          required: ["scoreA", "scoreB", "summary"]
        }
      }
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let result;
    
    try {
        result = JSON.parse(jsonStr);
    } catch (e) {
        // Fallback for malformed JSON
        console.warn("JSON parse failed, using basic match fallback");
        return simulateMatchBasic(teamA, teamB);
    }
    
    let scoreA = result.scoreA ?? 0;
    let scoreB = result.scoreB ?? 0;
    
    // Force winner in knockout if AI returns draw
    if (stage !== 'Pool' && scoreA === scoreB) {
        scoreA += 3; // Extra time penalty
    }

    return {
      teamAId: teamA.id,
      teamBId: teamB.id,
      scoreA,
      scoreB,
      winnerId: scoreA > scoreB ? teamA.id : teamB.id,
      summary: result.summary,
      isSimulated: true
    };

  } catch (error) {
    console.error("Gemini Simulation Failed:", error);
    return simulateMatchBasic(teamA, teamB);
  }
};

export const simulateMatchBasic = (teamA: Team, teamB: Team): MatchResult => {
    const ratingDiff = teamA.rating - teamB.rating;
    // Base probability 50% + 2.5% per rating point diff
    const winProbA = 0.5 + (ratingDiff * 0.025);
    
    const r = Math.random();
    let winnerId: string;
    let scoreA = 0;
    let scoreB = 0;

    // Determine winner
    const teamAWins = r < winProbA;
    winnerId = teamAWins ? teamA.id : teamB.id;

    // Generate scores
    const baseScore = 12 + Math.floor(Math.random() * 25);
    const winningMargin = 1 + Math.floor(Math.random() * 20) + Math.floor(Math.abs(ratingDiff) / 2);

    if (teamAWins) {
        scoreA = baseScore + winningMargin;
        scoreB = baseScore;
    } else {
        scoreB = baseScore + winningMargin;
        scoreA = baseScore;
    }

    return {
        teamAId: teamA.id,
        teamBId: teamB.id,
        scoreA,
        scoreB,
        winnerId,
        summary: "Simulated based on team rating.",
        isSimulated: true
    };
};