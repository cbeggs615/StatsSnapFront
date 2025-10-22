export async function fetchTeamDetails(teamId) {
  try {
    const response = await fetch('/api/SportsStats/_getTeamDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamStats: teamId })
    });
    const data = await response.json();
    // Expecting { teamname, sportName }
    return data;
  } catch (e) {
    console.error('Error fetching team details:', e);
    return { teamname: teamId, sport: 'Unknown' };
  }
}
