import React, { useState } from 'react';
import { KnockoutMatch, MatchResult } from '../types';
import { simulateMatchWithAI, simulateMatchBasic } from '../services/geminiService';

interface MatchCardProps {
  match: KnockoutMatch;
  onMatchComplete: (matchId: string, result: MatchResult) => void;
  isSimulating: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onMatchComplete, isSimulating }) => {
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!match.teamA || !match.teamB) return;
    setLoading(true);

    let result: MatchResult;
    // If API Key is present in env, try AI, else basic
    if (process.env.API_KEY) {
        result = await simulateMatchWithAI(match.teamA, match.teamB, match.round);
    } else {
        // Add artificial delay for basic sim to feel like processing
        await new Promise(r => setTimeout(r, 600)); 
        result = simulateMatchBasic(match.teamA, match.teamB);
    }
    
    setLoading(false);
    onMatchComplete(match.id, result);
  };

  const isReady = match.teamA && match.teamB;
  const isFinished = !!match.result;

  return (
    <div className={`relative flex flex-col justify-center min-w-[220px] bg-white rounded-lg shadow-sm border ${isFinished ? 'border-emerald-500' : 'border-gray-300'} mb-4 overflow-hidden`}>
      {/* Header */}
      <div className="bg-gray-50 px-3 py-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider flex justify-between">
        <span>{match.matchLabel}</span>
        <span>{match.id}</span>
      </div>

      {/* Teams */}
      <div className="p-2 space-y-2">
        {/* Team A */}
        <div className={`flex justify-between items-center ${isFinished && match.result?.winnerId === match.teamA?.id ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
           <div className="flex items-center space-x-2">
             <span className="text-xl">{match.teamA?.flag || '🏳️'}</span>
             <span className="text-sm truncate max-w-[100px]">{match.teamA?.name || 'TBD'}</span>
           </div>
           <span className="text-sm">{match.result ? match.result.scoreA : '-'}</span>
        </div>

        {/* Team B */}
        <div className={`flex justify-between items-center ${isFinished && match.result?.winnerId === match.teamB?.id ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
           <div className="flex items-center space-x-2">
             <span className="text-xl">{match.teamB?.flag || '🏳️'}</span>
             <span className="text-sm truncate max-w-[100px]">{match.teamB?.name || 'TBD'}</span>
           </div>
           <span className="text-sm">{match.result ? match.result.scoreB : '-'}</span>
        </div>
      </div>

      {/* Action / Status */}
      {isReady && !isFinished && (
         <button 
           onClick={handleSimulate}
           disabled={loading || isSimulating}
           className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs py-1 transition flex justify-center items-center"
         >
           {loading ? (
             <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
           ) : (
             "Simulate Match"
           )}
         </button>
      )}

      {/* Summary Tooltip (simple version) */}
      {isFinished && match.result?.summary && (
          <div className="bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800 border-t border-emerald-100 italic leading-tight">
              "{match.result.summary}"
          </div>
      )}
    </div>
  );
};

export default MatchCard;