export const STARTING_PURSE = 120;
export const DEFAULT_TIMER = 10;

export function nextBidIncrement(amount) {
  if (amount < 5) return 0.25;
  if (amount < 10) return 0.5;
  if (amount < 20) return 1;
  return 2;
}

export function nextBid(amount) {
  return Number((amount + nextBidIncrement(amount)).toFixed(2));
}

export function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PU-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function calculateTeamStats(team, playerMap) {
  const players = team.players.map(x => playerMap[x.playerId]).filter(Boolean);
  const n = players.length || 1;
  const avg = key => Math.round(players.reduce((sum, p) => sum + Number(p[key] || 0), 0) / n);
  const roleCount = role => players.filter(p => p.role === role).length;
  const bats = roleCount('Batsman');
  const bowlers = roleCount('Bowler');
  const all = roleCount('All-Rounder');
  const wk = roleCount('Wicket-Keeper');
  const totalSpent = Number(team.spent || 0);
  const purse = Number(team.purse || 0);

  const batting = Math.min(100, Math.round(avg('batting') * .88 + Math.min(bats, 5) * 2 + all * 1.5));
  const bowling = Math.min(100, Math.round(avg('bowling') * .88 + Math.min(bowlers, 5) * 2 + all * 1.5));
  const fielding = Math.min(100, avg('fielding'));
  const allRounderScore = Math.min(100, Math.round(avg('rating') * .45 + avg('fielding') * .25 + all * 7));
  const keeping = wk ? Math.min(100, Math.round(players.filter(p => p.role === 'Wicket-Keeper').reduce((s,p)=>s + Number(p.keeping || p.fielding || 0),0) / wk)) : 18;
  const roleCoverage = Math.min(100, Math.round(((Math.min(bats,4)/4) + (Math.min(bowlers,4)/4) + (Math.min(all,3)/3) + (Math.min(wk,2)/2)) / 4 * 100));
  const depth = Math.min(100, Math.round((Math.min(players.length,11) / 11) * 100));
  const squadBalance = Math.min(100, Math.round((batting + bowling + allRounderScore + keeping + fielding + roleCoverage) / 6));
  const squadRating = players.length ? Math.min(99, Math.round(avg('rating') * .56 + squadBalance * .30 + depth * .14)) : 0;

  const strengths = [];
  const weaknesses = [];
  if (batting >= 86) strengths.push(`Batting unit is strong (${batting}/100)`);
  else if (batting < 70) weaknesses.push(`Batting depth is light (${batting}/100)`);
  if (bowling >= 86) strengths.push(`Bowling attack is strong (${bowling}/100)`);
  else if (bowling < 70) weaknesses.push(`Bowling depth is light (${bowling}/100)`);
  if (wk >= 2) strengths.push('Two or more wicket-keeping options');
  else if (!wk) weaknesses.push('No wicket-keeper in the current squad');
  else weaknesses.push('Only one wicket-keeper — limited cover');
  if (all >= 3) strengths.push(`${all} all-rounders give tactical flexibility`);
  else if (all === 0) weaknesses.push('No specialist all-rounder cover');
  if (bowlers >= 4) strengths.push(`${bowlers} specialist bowlers provide attack depth`);
  if (bats >= 5) strengths.push(`${bats} specialist batsmen provide batting depth`);
  if (players.length >= 8) strengths.push(`Squad depth is healthy at ${players.length} players`);
  else weaknesses.push(`Squad depth is still only ${players.length} players`);
  if (roleCoverage >= 80) strengths.push('Role coverage is well balanced');
  else weaknesses.push('Role coverage has visible gaps');
  if (purse >= 35 && players < 11) strengths.push(`₹${purse.toFixed(2)} Cr remains for targeted buys`);
  if (purse < 15 && players < 8) weaknesses.push('Low purse flexibility with several slots still open');
  if (!strengths.length) strengths.push('Squad is still being formed — analysis will update after each buy');

  const headline = players.length === 0
    ? 'No squad data yet — buy players to activate the live review.'
    : `Live review: ${players.length} players, ₹${purse.toFixed(2)} Cr remaining, ${squadBalance}/100 balance.`;
  const insight = players.length === 0
    ? 'The review engine will recalculate after every successful purchase.'
    : `Based on current player attributes, role distribution, squad depth and purse. Batting ${batting}, bowling ${bowling}, keeping ${keeping}, fielding ${fielding}.`;

  return {
    players: players.length, batsmen: bats, bowlers, allRounders: all, wicketKeepers: wk,
    batting, bowling, fielding, allRoundersScore: allRounderScore, keeping, roleCoverage,
    depth, squadBalance, squadRating, rating: squadRating, keep: keeping, balance: squadBalance, all: allRounderScore, totalSpent, purse, strengths, weaknesses, headline, insight
  };
}
