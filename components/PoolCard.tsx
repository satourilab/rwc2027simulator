import React from 'react';
import { Pool, PoolTeam } from '../types';

interface PoolCardProps {
  pool: Pool;
  onUpdatePool: (poolId: string, teams: PoolTeam[]) => void;
  readOnly: boolean;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onUpdatePool, readOnly }) => {

  const handleSimulatePool = () => {
    const newTeams = pool.teams.map(team => ({...team}));
    
    // Reset stats
    newTeams.forEach(t => {
      t.played = 3; 
      t.points = 0; 
      t.won = 0; 
      t.lost = 0; 
      t.diff = 0;
    });

    // Round Robin
    for (let i = 0; i < newTeams.length; i++) {
      for (let j = i + 1; j < newTeams.length; j++) {
        const teamA = newTeams[i];
        const teamB = newTeams[j];
        
        const ratingDiff = teamA.rating - teamB.rating;
        const randomFactor = (Math.random() * 10) - 5;
        
        if ((ratingDiff + randomFactor) > 0) {
            teamA.won++;
            teamB.lost++;
            teamA.points += 4; // 4 pts for win
            const margin = Math.floor(Math.abs(ratingDiff) + Math.random() * 10);
            teamA.diff += margin;
            teamB.diff -= margin;
        } else {
            teamB.won++;
            teamA.lost++;
            teamB.points += 4;
            const margin = Math.floor(Math.abs(ratingDiff) + Math.random() * 10);
            teamB.diff += margin;
            teamA.diff -= margin;
        }
      }
    }

    newTeams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.diff - a.diff;
    });

    onUpdatePool(pool.id, newTeams);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col h-full">
      <div className="bg-emerald-900 text-white px-4 py-2 flex justify-between items-center border-b-2 border-yellow-500">
        <h3 className="font-bold text-lg italic">Pool {pool.id}</h3>
        {!readOnly && (
            <button 
                onClick={handleSimulatePool}
                className="text-[10px] bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-white transition border border-emerald-600 uppercase tracking-wider"
            >
                Quick Sim
            </button>
        )}
      </div>
      <table className="w-full text-sm text-left flex-grow">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
          <tr>
            <th className="px-3 py-2">Team</th>
            <th className="px-1 py-2 text-center w-8">Pl</th>
            <th className="px-1 py-2 text-center w-8">Diff</th>
            <th className="px-1 py-2 text-center w-8 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pool.teams.map((team, idx) => {
            let rowClass = "hover:bg-gray-50";
            let rankBadge = null;
            
            // Qualification visual cues
            if (team.played === 3) { // Only show if completed
                if (idx < 2) {
                    // Top 2: Green
                    rowClass = "bg-emerald-50/50 hover:bg-emerald-100/50";
                    rankBadge = <span className="inline-block w-4 h-4 rounded bg-emerald-600 text-white text-[10px] flex items-center justify-center mr-2 font-bold">Q</span>;
                } else if (idx === 2) {
                    // 3rd: Yellow
                    rowClass = "bg-yellow-50/50 hover:bg-yellow-100/50";
                     rankBadge = <span className="inline-block w-4 h-4 rounded bg-yellow-400 text-yellow-900 text-[10px] flex items-center justify-center mr-2 font-bold">?</span>;
                } else {
                    rankBadge = <span className="inline-block w-4 h-4 rounded bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center mr-2">{idx + 1}</span>;
                }
            }

            return (
                <tr key={team.id} className={rowClass}>
                <td className="px-3 py-2 flex items-center">
                    {rankBadge}
                    <span className="text-lg mr-2">{team.flag}</span>
                    <span className={`font-medium truncate ${idx < 2 && team.played === 3 ? 'text-emerald-900 font-bold' : 'text-gray-700'}`}>{team.name}</span>
                </td>
                <td className="px-1 py-2 text-center text-gray-500 text-xs">{team.played}</td>
                <td className="px-1 py-2 text-center text-gray-500 text-xs">{team.diff > 0 ? `+${team.diff}` : team.diff}</td>
                <td className="px-1 py-2 text-center font-bold text-gray-800">{team.points}</td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PoolCard;