export async function fetchSportsList() {
  try {
    const response = await fetch('/api/SportsStats/_getSportsList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    // Expecting [{ _id: '...', name: '...' }, ...]
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error fetching sports list:', e);
    return [];
  }
}

export async function fetchTeamsBySport(sportId) {
  try {
    const response = await fetch('/api/SportsStats/_getTeamsBySport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sportId: sportId })
    });
    const data = await response.json();
    // Expecting [{ _id, name, sport }]
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error fetching teams by sport:', e);
    return [];
  }
}

export async function fetchAvailableStatsForTeam(teamname, sportId) {
  try {
    const response = await fetch('/api/SportsStats/fetchAvailableStatsForTeam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamname, sport: sportId })
    });
    const data = await response.json();
    if (data && Array.isArray(data.stats)) {
      return data.stats;
    } else {
      return [];
    }
  } catch (e) {
    console.error('Error fetching available stats for team:', e);
    return [];
  }
}

export async function addKeyStat(sportName, stat) {
  try {
    console.debug('addKeyStat request:', {
      url: '/api/SportsStats/addKeyStat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { sportName, stat }
    });
    const response = await fetch('/api/SportsStats/addKeyStat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sportName, stat })
    });
    const data = await response.json();
    console.debug('addKeyStat response:', data);
    return data;
  } catch (e) {
    console.error('Error adding key stat:', e);
    return { error: e.message || e };
  }
}

export async function removeKeyStat(sportName, stat) {
  try {
    const response = await fetch('/api/SportsStats/removeKeyStat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sportName, stat })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error removing key stat:', e);
    return { error: e.message || e };
  }
}
