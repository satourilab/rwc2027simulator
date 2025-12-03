import React, { useState, useRef } from 'react';
import { INITIAL_POOLS } from './constants';
import { Pool, PoolTeam, KnockoutMatch, MatchResult, Team, TournamentPhase } from './types';
import PoolCard from './components/PoolCard';
import MatchCard from './components/MatchCard';

// Extended interface to track pool origin for logic
interface QualifiedTeam extends Team {
  poolId: string;
}

function App() {
  const [pools, setPools] = useState<Pool[]>(INITIAL_POOLS);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [phase, setPhase] = useState<TournamentPhase>('POOLS');
  const [isSimulating, setIsSimulating] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const handleUpdatePool = (poolId: string, updatedTeams: PoolTeam[]) => {
    setPools(prev => prev.map(p => p.id === poolId ? { ...p, teams: updatedTeams } : p));
  };

  const solveThirdPlaceAssignment = (best3rds: QualifiedTeam[]) => {
    // Requirements based on bracket image:
    // Slot A (plays Winner A): from C, E, F
    // Slot B (plays Winner B): from D, E, F
    // Slot C (plays Winner C): from A, E, F
    // Slot D (plays Winner D): from B, E, F
    
    // Maps a "Slot ID" (which winner they play) to valid pool origins
    const constraints = {
      'A': ['C', 'E', 'F'],
      'B': ['D', 'E', 'F'],
      'C': ['A', 'E', 'F'],
      'D': ['B', 'E', 'F']
    };

    // Helper to generate permutations
    const permute = (arr: QualifiedTeam[]): QualifiedTeam[][] => {
        if (arr.length === 0) return [[]];
        const first = arr[0];
        const rest = permute(arr.slice(1));
        const fullPerms: QualifiedTeam[][] = [];
        rest.forEach(p => {
            for (let i = 0; i <= p.length; i++) {
                fullPerms.push([...p.slice(0, i), first, ...p.slice(i)]);
            }
        });
        return fullPerms;
    };

    const allPermutations = permute(best3rds);
    
    // Find the first permutation that satisfies strict constraints
    for (const p of allPermutations) {
        // p[0] is assigned to Slot A, p[1] to B, etc.
        if (
            constraints['A'].includes(p[0].poolId) &&
            constraints['B'].includes(p[1].poolId) &&
            constraints['C'].includes(p[2].poolId) &&
            constraints['D'].includes(p[3].poolId)
        ) {
            return { A: p[0], B: p[1], C: p[2], D: p[3] };
        }
    }

    // Fallback: If no perfect strict match (unlikely with 6 pools), 
    // we use a relaxed strategy just to ensure bracket flows.
    // We prioritize just avoiding same-pool matchups if possible.
    // For now, return the first permutation mapped to slots.
    const fb = best3rds;
    return { A: fb[0], B: fb[1], C: fb[2], D: fb[3] };
  };

  const handleFinishPools = () => {
    // 1. Identify Qualifiers
    const winners: Record<string, QualifiedTeam> = {};
    const runnersUp: Record<string, QualifiedTeam> = {};
    const thirdPlaces: PoolTeam[] = [];
    const teamPoolMap: Record<string, string> = {};

    pools.forEach(pool => {
      // Teams are sorted by points/diff
      const sorted = [...pool.teams].sort((a, b) => {
         if (b.points !== a.points) return b.points - a.points;
         return b.diff - a.diff;
      });
      
      winners[pool.id] = { ...sorted[0], poolId: pool.id };
      runnersUp[pool.id] = { ...sorted[1], poolId: pool.id };
      thirdPlaces.push({ ...sorted[2], poolId: pool.id } as any); // temp hack for sorting
    });

    // 2. Rank 3rd places
    thirdPlaces.sort((a, b) => {
         if (b.points !== a.points) return b.points - a.points;
         if (b.diff !== a.diff) return b.diff - a.diff;
         return b.rating - a.rating;
    });

    const best3rdsPools = thirdPlaces.slice(0, 4);
    const best3rdsQualified: QualifiedTeam[] = best3rdsPools.map(t => ({...t, poolId: (t as any).poolId}));

    if (best3rdsQualified.length < 4) {
        alert("Please simulate all pools first.");
        return;
    }

    // 3. Solve 3rd Place matchups
    const assignments = solveThirdPlaceAssignment(best3rdsQualified);

    // 4. Generate Bracket
    const createMatch = (id: string, label: string, round: KnockoutMatch['round'], teamA: Team | null, teamB: Team | null, nextId: string, nextSlot: 'A' | 'B', loserId?: string, loserSlot?: 'A' | 'B'): KnockoutMatch => ({
        id, matchLabel: label, round, teamA, teamB, result: null, nextMatchId: nextId, nextMatchSlot: nextSlot, loserMatchId: loserId, loserMatchSlot: loserSlot
    });

    // --- LEFT SIDE OF BRACKET ---
    // Match 1: Winner Pool A vs Pool C/E/F Best 3rd (Slot A)
    const m1 = createMatch('R16-1', 'R16: 1A vs Best 3rd', 'R16', winners['A'], assignments['A'], 'QF1', 'A');
    // Match 2: Winner Pool B vs Pool D/E/F Best 3rd (Slot B)
    const m2 = createMatch('R16-2', 'R16: 1B vs Best 3rd', 'R16', winners['B'], assignments['B'], 'QF1', 'B');
    // Match 3: Pool C Runner-up vs Pool F Runner-up
    const m3 = createMatch('R16-3', 'R16: 2C vs 2F', 'R16', runnersUp['C'], runnersUp['F'], 'QF2', 'A');
    // Match 4: Pool E Winner vs Pool D Runner-up
    const m4 = createMatch('R16-4', 'R16: 1E vs 2D', 'R16', winners['E'], runnersUp['D'], 'QF2', 'B');

    // --- RIGHT SIDE OF BRACKET ---
    // Match 5: Pool A Runner-up vs Pool E Runner-up
    const m5 = createMatch('R16-5', 'R16: 2A vs 2E', 'R16', runnersUp['A'], runnersUp['E'], 'QF3', 'A');
    // Match 6: Pool F Winner vs Pool B Runner-up
    const m6 = createMatch('R16-6', 'R16: 1F vs 2B', 'R16', winners['F'], runnersUp['B'], 'QF3', 'B');
    // Match 7: Pool C Winner vs Pool A/E/F Best 3rd (Slot C)
    const m7 = createMatch('R16-7', 'R16: 1C vs Best 3rd', 'R16', winners['C'], assignments['C'], 'QF4', 'A');
    // Match 8: Pool D Winner vs Pool B/E/F Best 3rd (Slot D)
    const m8 = createMatch('R16-8', 'R16: 1D vs Best 3rd', 'R16', winners['D'], assignments['D'], 'QF4', 'B');


    // QFs
    // QF1 takes M1 and M2 winners
    const qf1 = createMatch('QF1', 'QF1', 'QF', null, null, 'SF1', 'A');
    // QF2 takes M3 and M4 winners
    const qf2 = createMatch('QF2', 'QF2', 'QF', null, null, 'SF1', 'B');
    // QF3 takes M5 and M6 winners
    const qf3 = createMatch('QF3', 'QF3', 'QF', null, null, 'SF2', 'A');
    // QF4 takes M7 and M8 winners
    const qf4 = createMatch('QF4', 'QF4', 'QF', null, null, 'SF2', 'B');

    // SFs
    const sf1 = createMatch('SF1', 'Semi-Final 1', 'SF', null, null, 'Final', 'A', 'Bronze', 'A');
    const sf2 = createMatch('SF2', 'Semi-Final 2', 'SF', null, null, 'Final', 'B', 'Bronze', 'B');

    // Finals
    const bronze = createMatch('Bronze', 'Bronze Final', '3rd', null, null, '', 'A');
    const final = createMatch('Final', 'Final', 'Final', null, null, '', 'A');

    const allMatches = [m1, m2, m3, m4, m5, m6, m7, m8, qf1, qf2, qf3, qf4, sf1, sf2, bronze, final];
    setMatches(allMatches);
    setPhase('KNOCKOUT');
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleMatchComplete = (matchId: string, result: MatchResult) => {
    setMatches(prevMatches => {
        const newMatches = [...prevMatches];
        const matchIndex = newMatches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) return prevMatches;

        const completedMatch = { ...newMatches[matchIndex], result };
        newMatches[matchIndex] = completedMatch;

        // Advance Winner
        if (completedMatch.nextMatchId) {
            const nextIndex = newMatches.findIndex(m => m.id === completedMatch.nextMatchId);
            if (nextIndex !== -1) {
                const nextMatch = { ...newMatches[nextIndex] };
                const winner = result.winnerId === completedMatch.teamA?.id ? completedMatch.teamA : completedMatch.teamB;
                
                if (completedMatch.nextMatchSlot === 'A') nextMatch.teamA = winner;
                else nextMatch.teamB = winner;
                
                newMatches[nextIndex] = nextMatch;
            }
        }

        // Advance Loser (for Bronze Final)
        if (completedMatch.loserMatchId) {
            const loserIndex = newMatches.findIndex(m => m.id === completedMatch.loserMatchId);
            if (loserIndex !== -1) {
                const loserMatch = { ...newMatches[loserIndex] };
                const loser = result.winnerId === completedMatch.teamA?.id ? completedMatch.teamB : completedMatch.teamA;
                
                if (completedMatch.loserMatchSlot === 'A') loserMatch.teamA = loser;
                else loserMatch.teamB = loser;
                
                newMatches[loserIndex] = loserMatch;
            }
        }

        return newMatches;
    });
  };

  const resetTournament = () => {
      setPools(INITIAL_POOLS);
      setMatches([]);
      setPhase('POOLS');
  };

  const simulateAllPools = () => {
    const updatedPools = pools.map(pool => {
        const newTeams = pool.teams.map(team => ({...team, played: 3, points: 0, won: 0, lost: 0, diff: 0}));
        for (let i = 0; i < newTeams.length; i++) {
            for (let j = i + 1; j < newTeams.length; j++) {
              const teamA = newTeams[i];
              const teamB = newTeams[j];
              const ratingDiff = teamA.rating - teamB.rating;
              // Add some randomness
              const randomFactor = (Math.random() * 12) - 6;
              if ((ratingDiff + randomFactor) > 0) {
                  teamA.points += 4; teamA.won++; teamB.lost++;
                  const margin = Math.floor(Math.abs(ratingDiff * 0.5) + Math.random() * 15 + 3);
                  teamA.diff += margin; teamB.diff -= margin;
              } else {
                  teamB.points += 4; teamB.won++; teamA.lost++;
                  const margin = Math.floor(Math.abs(ratingDiff * 0.5) + Math.random() * 15 + 3);
                  teamB.diff += margin; teamA.diff -= margin;
              }
            }
        }
        newTeams.sort((a, b) => {
             if (b.points !== a.points) return b.points - a.points;
             return b.diff - a.diff;
        });
        return { ...pool, teams: newTeams };
    });
    setPools(updatedPools);
  };

  const getMatch = (id: string) => matches.find(m => m.id === id);

  return (
    <div className="min-h-screen pb-12 bg-orange-50/30" ref={topRef}>
      {/* Header */}
      <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-20 border-b-4 border-yellow-500">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter flex items-center">
                <span className="text-3xl mr-3 not-italic">🏉</span>
                RWC 2027 SIMULATOR
            </h1>
            <div className="flex space-x-2">
                {phase === 'KNOCKOUT' && (
                    <button onClick={resetTournament} className="text-sm bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 px-3 py-2 rounded text-white transition">
                        Reset Tournament
                    </button>
                )}
            </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        
        {phase === 'POOLS' && (
            <div className="animate-fade-in space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold text-gray-800">Pool Stage</h2>
                        <p className="text-gray-500 text-sm">Simulate matches to determine the Top 2 and Best 3rd place qualifiers.</p>
                    </div>
                    <div className="flex space-x-3">
                         <button 
                            onClick={simulateAllPools}
                            className="text-sm text-emerald-700 hover:text-emerald-900 font-bold px-4 py-2 border-2 border-emerald-100 rounded hover:bg-emerald-50 transition uppercase tracking-wide"
                        >
                            Simulate All Pools
                        </button>
                        <button 
                            onClick={handleFinishPools}
                            className="bg-yellow-500 hover:bg-yellow-400 text-emerald-900 font-black py-2 px-6 rounded shadow-md transition transform hover:scale-105 uppercase tracking-wide"
                        >
                            Start Knockout →
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pools.map(pool => (
                        <PoolCard 
                            key={pool.id} 
                            pool={pool} 
                            onUpdatePool={handleUpdatePool}
                            readOnly={false}
                        />
                    ))}
                </div>
            </div>
        )}

        {phase === 'KNOCKOUT' && matches.length > 0 && (
            <div className="animate-fade-in overflow-x-auto pb-8">
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 uppercase tracking-widest border-b-2 border-emerald-200 pb-2 inline-block mx-auto">Tournament Bracket</h2>
                
                {/* Desktop Butterfly Layout */}
                <div className="hidden lg:grid grid-cols-7 gap-4 min-w-[1200px]">
                    {/* Column 1: Left R16 */}
                    <div className="flex flex-col justify-around space-y-4 py-8">
                        <MatchCard match={getMatch('R16-1')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        <MatchCard match={getMatch('R16-2')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        <div className="h-8"></div> {/* Spacer */}
                        <MatchCard match={getMatch('R16-3')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        <MatchCard match={getMatch('R16-4')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                    </div>

                    {/* Column 2: Left QF */}
                    <div className="flex flex-col justify-around py-20">
                         <MatchCard match={getMatch('QF1')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                         <MatchCard match={getMatch('QF2')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                    </div>

                    {/* Column 3: Left SF */}
                    <div className="flex flex-col justify-center">
                        <MatchCard match={getMatch('SF1')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                    </div>

                    {/* Column 4: FINALS (Center) */}
                    <div className="flex flex-col justify-center items-center space-y-12 z-10">
                        <div className="scale-110 shadow-2xl rounded-lg">
                            <div className="bg-yellow-500 text-emerald-900 text-center font-black py-1 text-xs uppercase tracking-widest rounded-t-lg">World Champion</div>
                            <MatchCard match={getMatch('Final')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        </div>
                        <div className="opacity-90 scale-90">
                            <MatchCard match={getMatch('Bronze')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        </div>
                    </div>

                    {/* Column 5: Right SF */}
                    <div className="flex flex-col justify-center">
                        <MatchCard match={getMatch('SF2')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                    </div>

                    {/* Column 6: Right QF */}
                    <div className="flex flex-col justify-around py-20">
                         <MatchCard match={getMatch('QF3')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                         <MatchCard match={getMatch('QF4')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                    </div>

                    {/* Column 7: Right R16 */}
                    <div className="flex flex-col justify-around space-y-4 py-8">
                        <MatchCard match={getMatch('R16-5')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        <MatchCard match={getMatch('R16-6')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        <div className="h-8"></div> {/* Spacer */}
                        <MatchCard match={getMatch('R16-7')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        <MatchCard match={getMatch('R16-8')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                    </div>
                </div>

                {/* Mobile Stack Layout */}
                <div className="lg:hidden flex flex-col space-y-8">
                    <section>
                        <h3 className="font-bold text-center mb-4 bg-emerald-100 py-1">Round of 16</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.filter(m => m.round === 'R16').map(m => (
                                <MatchCard key={m.id} match={m} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                            ))}
                        </div>
                    </section>
                    <section>
                        <h3 className="font-bold text-center mb-4 bg-emerald-100 py-1">Quarter Finals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.filter(m => m.round === 'QF').map(m => (
                                <MatchCard key={m.id} match={m} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                            ))}
                        </div>
                    </section>
                    <section>
                        <h3 className="font-bold text-center mb-4 bg-emerald-100 py-1">Semi Finals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.filter(m => m.round === 'SF').map(m => (
                                <MatchCard key={m.id} match={m} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                            ))}
                        </div>
                    </section>
                    <section>
                        <h3 className="font-bold text-center mb-4 bg-yellow-100 py-1">Finals</h3>
                        <div className="flex flex-col items-center gap-4">
                            <MatchCard match={getMatch('Final')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                            <MatchCard match={getMatch('Bronze')!} onMatchComplete={handleMatchComplete} isSimulating={isSimulating} />
                        </div>
                    </section>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;