export const TEAMS = [
  { id: 'CSK', name: 'Chennai Super Kings', short: 'CSK', accent: '#f4c430' },
  { id: 'MI', name: 'Mumbai Indians', short: 'MI', accent: '#39a9ff' },
  { id: 'RCB', name: 'Royal Challengers Bengaluru', short: 'RCB', accent: '#ef4444' },
  { id: 'KKR', name: 'Kolkata Knight Riders', short: 'KKR', accent: '#a855f7' },
  { id: 'SRH', name: 'Sunrisers Hyderabad', short: 'SRH', accent: '#fb923c' },
  { id: 'RR', name: 'Rajasthan Royals', short: 'RR', accent: '#ec4899' },
  { id: 'DC', name: 'Delhi Capitals', short: 'DC', accent: '#60a5fa' },
  { id: 'PBKS', name: 'Punjab Kings', short: 'PBKS', accent: '#ef4444' },
  { id: 'LSG', name: 'Lucknow Super Giants', short: 'LSG', accent: '#22d3ee' },
  { id: 'GT', name: 'Gujarat Titans', short: 'GT', accent: '#94a3b8' },
];

export const TEAM_MAP = Object.fromEntries(TEAMS.map(t => [t.id, t]));
