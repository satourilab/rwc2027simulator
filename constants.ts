import { Pool, PoolTeam } from './types';

// Helper to create initial pool team
const t = (id: string, name: string, flag: string, rating: number): PoolTeam => ({
  id, name, flag, rating,
  played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0
});

// Official RWC 2027 Draw
export const INITIAL_POOLS: Pool[] = [
  {
    id: 'A',
    teams: [
      t('nzl', 'New Zealand', '🇳🇿', 92),
      t('aus', 'Australia', '🇦🇺', 82),
      t('chi', 'Chile', '🇨🇱', 65),
      t('hkg', 'Hong Kong China', '🇭🇰', 58), 
    ]
  },
  {
    id: 'B',
    teams: [
      t('rsa', 'South Africa', '🇿🇦', 94),
      t('ita', 'Italy', '🇮🇹', 84),
      t('geo', 'Georgia', '🇬🇪', 76),
      t('rom', 'Romania', '🇷🇴', 64),
    ]
  },
  {
    id: 'C',
    teams: [
      t('arg', 'Argentina', '🇦🇷', 86),
      t('fji', 'Fiji', '🇫🇯', 81),
      t('esp', 'Spain', '🇪🇸', 68),
      t('can', 'Canada', '🇨🇦', 63),
    ]
  },
  {
    id: 'D',
    teams: [
      t('ire', 'Ireland', '🇮🇪', 93),
      t('sco', 'Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 85),
      t('uru', 'Uruguay', '🇺🇾', 72),
      t('por', 'Portugal', '🇵🇹', 70),
    ]
  },
  {
    id: 'E',
    teams: [
      t('fra', 'France', '🇫🇷', 89),
      t('jpn', 'Japan', '🇯🇵', 79),
      t('sam', 'Samoa', '🇼🇸', 73),
      t('usa', 'USA', '🇺🇸', 70),
    ]
  },
  {
    id: 'F',
    teams: [
      t('eng', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 87),
      t('wal', 'Wales', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 78),
      t('tga', 'Tonga', '🇹🇴', 74),
      t('zim', 'Zimbabwe', '🇿🇼', 55),
    ]
  }
];