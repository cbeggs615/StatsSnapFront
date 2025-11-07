import { API_BASE } from './apiConfig.js'

// Utility function to clean stat names for display
export function cleanStatName(statName) {
  if (typeof statName !== 'string') return statName;

  // Remove 'stat:' prefix if it exists
  if (statName.startsWith('stat:')) {
    return statName.substring(5);
  }

  return statName;
}

export async function fetchSportsList() {
  try {
    const response = await fetch(`${API_BASE}/SportsStats/_getSportsList`, {
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
    const response = await fetch(`${API_BASE}/SportsStats/_getTeamsBySport`, {
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
    const response = await fetch(`${API_BASE}/SportsStats/fetchAvailableStatsForTeam`, {
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
    const response = await fetch(`${API_BASE}/SportsStats/addKeyStat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sportName, stat })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error adding key stat:', e);
    return { error: e.message || e };
  }
}

export async function removeKeyStat(sportName, stat) {
  try {
    const response = await fetch(`${API_BASE}/SportsStats/removeKeyStat`, {
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

export async function fetchTeamStats(teamname, sportId, stats = null) {
  try {
    const requestBody = { teamname, sport: sportId };
    if (stats && Array.isArray(stats) && stats.length > 0) {
      requestBody.stats = stats;
    }

    const response = await fetch(`${API_BASE}/SportsStats/fetchTeamStats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    return data.keyStatsData || {};
  } catch (e) {
    console.error('Error fetching team stats:', e);
    return {};
  }
}

// User stat collection management
export async function getUserStatsCollection(username, sport, session = null) {
  try {
    // Check if user has tracked individual stats for this sport using session
    const response = await fetch(`${API_BASE}/ItemTracking/_getItemsTrackedByUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/ItemTracking/_getItemsTrackedByUser',
        session: session
      })
    });
    const trackedData = await response.json();

    // Handle new sync response format: { request, results }
    // results is collected as [user, item] pairs, we need to extract items
    let allItems = [];
    if (trackedData.results && Array.isArray(trackedData.results)) {
      // Extract items from [user, item] pairs
      allItems = trackedData.results.map(result => result.item).filter(Boolean);
    } else if (trackedData.items) {
      // Fallback for old format
      allItems = trackedData.items;
    }

    // Look for individual stat items for this sport
    // Format: stat:${sport}:${username}:${statName}
    const statItems = allItems.filter(item => {
      const isString = typeof item === 'string';      if (!isString) {
        return false;
      }

      const pattern = `stat:${sport}:${username}:`;
      return item.startsWith(pattern);
    });

    if (statItems.length > 0) {
      // Extract stat names from the items
      const stats = statItems.map(item => {
        const parts = item.split(':');
        let rawStatName;

        // Handle format: stat:sport:username:stat:statname
        if (parts.length >= 5 && parts[3] === 'stat') {
          rawStatName = `stat:${parts[4]}`;
        } else {
          // Handle format: stat:sport:username:statname (fallback)
          rawStatName = parts[3];
        }

        return rawStatName;
      }).filter(stat => {
        return stat && stat !== 'stat';
      });

      return {
        stats,
        hasUserStats: true
      };
    }

    // Auto-create default stats for this user/sport
    try {
      const sportDetails = await fetchSportDetails(sport);
      if (sportDetails && Array.isArray(sportDetails.defaultKeyStats) && sportDetails.defaultKeyStats.length > 0) {
        const createResult = await createUserStatsCollection(username, sport, sportDetails.defaultKeyStats, session);
        if (createResult.success) {
          // Convert default stats to stat: format for return
          const defaultStats = sportDetails.defaultKeyStats.map(stat =>
            stat.startsWith('stat:') ? stat : `stat:${stat}`
          );

          return {
            stats: defaultStats,
            hasUserStats: true,
            autoCreated: true
          };
        } else {
          console.warn('Failed to create default stats:', createResult);
        }
      }
    } catch (autoCreateError) {
      console.error('Error auto-creating default stats:', autoCreateError);
    }

    return null;
  } catch (e) {
    console.error('Error getting user stats collection:', e);
    return null;
  }
}

export async function createUserStatsCollection(username, sport, stats, session = null) {
  try {
    if (!Array.isArray(stats) || stats.length === 0) {
      return { success: true, message: 'No stats to track' };
    }

    let successCount = 0;
    let errors = [];

    // Track each stat as an individual item
    // Format: stat:${sport}:${username}:${statName}
    for (const stat of stats) {
      try {
        // Ensure stat is in stat:statname format (add stat: prefix if not present)
        const normalizedStat = stat.startsWith('stat:') ? stat : `stat:${stat}`;
        const statId = `stat:${sport}:${username}:${normalizedStat}`;

        const response = await fetch(`${API_BASE}/ItemTracking/addItem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/ItemTracking/addItem',
            session: session,
            item: statId
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          errors.push(`Failed to track stat ${normalizedStat}: ${errorText}`);
          console.error(`Failed to track stat ${normalizedStat}:`, errorText);
        } else {
          const result = await response.json();
          if (result.error) {
            errors.push(`Error tracking stat ${normalizedStat}: ${result.error}`);
            console.error(`Error tracking stat ${normalizedStat}:`, result.error);
          } else if (result.success) {
            successCount++;
          } else {
            errors.push(`Unexpected response for stat ${normalizedStat}: ${JSON.stringify(result)}`);
            console.error(`Unexpected response for stat ${normalizedStat}:`, result);
          }
        }
      } catch (e) {
        errors.push(`Exception tracking stat ${normalizedStat}: ${e.message}`);
        console.error(`Exception tracking stat ${normalizedStat}:`, e);
      }
    }

    if (errors.length > 0) {
      return {
        success: successCount > 0,
        successCount,
        errors,
        message: `Tracked ${successCount}/${stats.length} stats`
      };
    } else {
      return {
        success: true,
        successCount,
        message: `Successfully tracked ${successCount} stats`
      };
    }
  } catch (e) {
    console.error('Error creating user stats collection:', e);
    return { error: e.message };
  }
}

export async function removeUserStatsCollection(username, sport, session = null) {
  try {
    // Get ALL tracked items for the user to find ALL stats for this sport
    const response = await fetch(`${API_BASE}/ItemTracking/_getItemsTrackedByUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/ItemTracking/_getItemsTrackedByUser',
        session: session
      })
    });
    const trackedData = await response.json();

    // Handle new sync response format: { request, results }
    let allItems = [];
    if (trackedData.results && Array.isArray(trackedData.results)) {
      // Extract items from [user, item] pairs
      allItems = trackedData.results.map(result => result.item).filter(Boolean);
    } else if (trackedData.items) {
      // Fallback for old format
      allItems = trackedData.items;
    }

    // Look for individual stats to remove for this sport/user
    const itemsToRemove = allItems.filter(item => {
      if (typeof item !== 'string') return false;

      // Remove individual stats: stat:sport:username:statname
      return item.startsWith(`stat:${sport}:${username}:`);
    });

    if (itemsToRemove.length === 0) {
      return { success: true, message: 'No stat items to remove', removedCount: 0 };
    }

    // Remove ALL stat items for this user/sport
    let removedCount = 0;
    let errors = [];

    for (const itemId of itemsToRemove) {
      try {
        const removeResponse = await fetch(`${API_BASE}/ItemTracking/removeItem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/ItemTracking/removeItem',
            session: session,
            item: itemId
          })
        });

        if (!removeResponse.ok) {
          const errorText = await removeResponse.text();
          errors.push(`Failed to remove ${itemId}: ${errorText}`);
          console.error('Failed to remove item:', itemId, errorText);
        } else {
          const removeResult = await removeResponse.json();
          if (removeResult.success) {
            removedCount++;
          } else if (removeResult.error) {
            errors.push(`Error removing ${itemId}: ${removeResult.error}`);
            console.error('Error removing item:', itemId, removeResult.error);
          } else {
            console.warn('Unexpected response removing item:', itemId, removeResult);
            removedCount++; // Assume success for backward compatibility
          }
        }
      } catch (itemError) {
        errors.push(`Exception removing ${itemId}: ${itemError.message}`);
        console.error('Exception removing item:', itemId, itemError);
      }
    }

    if (errors.length > 0) {
      console.warn(`Removed ${removedCount}/${itemsToRemove.length} stat items. Errors:`, errors);
      return { success: true, removedCount, errors, message: `Removed ${removedCount} stat items with ${errors.length} errors` };
    } else {
      return { success: true, removedCount, message: `Removed ${removedCount} stat items` };
    }
  } catch (e) {
    console.error('Error removing user stats collections:', e);
    return { error: e.message };
  }
}

export async function fetchSportDetails(sportId) {
  try {
    const sportsList = await fetchSportsList();
    const sport = sportsList.find(s => s._id === sportId);
    return sport || null;
  } catch (e) {
    console.error('Error fetching sport details:', e);
    return null;
  }
}

export async function addUserStat(username, sport, statName, session = null) {
  try {
    // Store stat in original format (should be stat:statname)
    const statId = `stat:${sport}:${username}:${statName}`;

    const response = await fetch(`${API_BASE}/ItemTracking/addItem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/ItemTracking/addItem',
        session: session,
        item: statId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      console.error('Error adding stat:', result.error);
      return { error: result.error };
    } else if (result.success) {
      console.debug('Successfully added stat:', statName);
      return { success: true, statName };
    } else {
      console.error('Unexpected response adding stat:', result);
      return { error: 'Unexpected response from server' };
    }
  } catch (e) {
    console.error('Error adding user stat:', e);
    return { error: e.message };
  }
}

export async function removeUserStat(username, sport, statName, session = null) {
  try {
    // First, check how many stats the user currently has for this sport
    const currentStats = await getUserStatsCollection(username, sport, session);
    if (!currentStats || !currentStats.stats || currentStats.stats.length <= 1) {
      console.debug('Cannot remove last stat - user must have at least one stat');
      return {
        error: 'You must select at least one stat to track for this sport.',
        isLastStat: true
      };
    }

    // statName comes in as stat:statname format from getUserStatsCollection
    // Keep it as-is since we store the full stat:statname in the item tracking
    const statId = `stat:${sport}:${username}:${statName}`;

    const response = await fetch(`${API_BASE}/ItemTracking/removeItem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/ItemTracking/removeItem',
        session: session,
        item: statId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.error) {
      console.error('Error removing stat:', result.error);
      return { error: result.error };
    } else if (result.success) {
      return { success: true, statName };
    } else {
      console.error('Unexpected response removing stat:', result);
      return { error: 'Unexpected response from server' };
    }
  } catch (e) {
    console.error('Error removing user stat:', e);
    return { error: e.message };
  }
}
