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

export async function fetchTeamStats(teamname, sportId, stats = null) {
  try {
    const requestBody = { teamname, sport: sportId };
    if (stats && Array.isArray(stats) && stats.length > 0) {
      requestBody.stats = stats;
    }

    const response = await fetch('/api/SportsStats/fetchTeamStats', {
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
export async function getUserStatsCollection(username, sport) {
  console.log('🚀 getUserStatsCollection called with:', username, sport);
  try {
    // Check if user has tracked individual stats for this sport
    const response = await fetch('/api/ItemTracking/_getItemsTrackedByUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username })
    });
    const trackedData = await response.json();

    // Look for individual stat items for this sport
    // Format: stat:${sport}:${username}:${statName}
    const allItems = trackedData.items || [];
    console.log('🔍 === getUserStatsCollection DEBUG ===');
    console.log('👤 Username:', username, 'Sport:', sport);
    console.log('📊 All tracked items for user:', allItems);
    console.log('🔍 Looking for stat pattern:', `stat:${sport}:${username}:`);

    const statItems = allItems.filter(item => {
      const isString = typeof item === 'string';

      if (!isString) {
        console.log(`📋 Skipping non-string item: ${item}`);
        return false;
      }

      const pattern = `stat:${sport}:${username}:`;
      const startsWithPattern = item.startsWith(pattern);

      console.log(`📋 Checking item: "${item}"`);
      console.log(`📋 Pattern: "${pattern}"`);
      console.log(`📋 Starts with pattern: ${startsWithPattern}`);

      return startsWithPattern;
    });

    console.log('✅ Found stat items for sport:', statItems);

    if (statItems.length > 0) {
      // Extract stat names from the items
      const stats = statItems.map(item => {
        const parts = item.split(':');
        console.log(`🔧 Parsing item: "${item}"`);
        console.log(`🔧 Split parts:`, parts);

        let rawStatName;

        // Handle format: stat:sport:username:stat:statname
        if (parts.length >= 5 && parts[3] === 'stat') {
          rawStatName = `stat:${parts[4]}`;
          console.log(`✅ Format 1 (stat:sport:username:stat:statname) - extracted: "${rawStatName}"`);
        } else {
          // Handle format: stat:sport:username:statname (fallback)
          rawStatName = parts[3];
          console.log(`✅ Format 2 (stat:sport:username:statname) - extracted: "${rawStatName}"`);
        }

        console.log(`📦 Keeping stat in original format: "${rawStatName}"`);
        return rawStatName;
      }).filter(stat => {
        const isValid = stat && stat !== 'stat';
        console.log(`🔍 Filtering stat: "${stat}" - isValid: ${isValid}`);
        return isValid;
      });

      console.log('🎯 Final parsed user stats:', stats);

      return {
        stats,
        hasUserStats: true
      };
    }

    console.debug('No user stats found for sport - creating default stats');

    // Auto-create default stats for this user/sport
    try {
      const sportDetails = await fetchSportDetails(sport);
      if (sportDetails && Array.isArray(sportDetails.defaultKeyStats) && sportDetails.defaultKeyStats.length > 0) {
        console.debug('Creating default stats for user:', sportDetails.defaultKeyStats);

        const createResult = await createUserStatsCollection(username, sport, sportDetails.defaultKeyStats);
        if (createResult.success) {
          // Convert default stats to stat: format for return
          const defaultStats = sportDetails.defaultKeyStats.map(stat =>
            stat.startsWith('stat:') ? stat : `stat:${stat}`
          );

          console.debug('Successfully created default stats:', defaultStats);
          return {
            stats: defaultStats,
            hasUserStats: true,
            autoCreated: true
          };
        } else {
          console.warn('Failed to create default stats:', createResult);
        }
      } else {
        console.debug('No default stats available for sport');
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

export async function createUserStatsCollection(username, sport, stats) {
  try {
    console.debug('createUserStatsCollection called with:', { username, sport, stats });

    if (!Array.isArray(stats) || stats.length === 0) {
      console.debug('No stats to track');
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
        console.debug('Tracking stat:', statId, '(from input:', stat, ')');

        const response = await fetch('/api/ItemTracking/addItem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username, item: statId })
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
          } else {
            successCount++;
            console.debug(`Successfully tracked stat: ${normalizedStat}`);
          }
        }
      } catch (e) {
        errors.push(`Exception tracking stat ${normalizedStat}: ${e.message}`);
        console.error(`Exception tracking stat ${normalizedStat}:`, e);
      }
    }

    console.debug(`Tracked ${successCount}/${stats.length} stats successfully`);

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

export async function removeUserStatsCollection(username, sport) {
  try {
    // Get ALL tracked items for the user to find ALL stats for this sport
    const response = await fetch('/api/ItemTracking/_getItemsTrackedByUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username })
    });
    const trackedData = await response.json();

    // Find ALL individual stat items for this sport/user
    const allItems = trackedData.items || [];

    // Look for individual stats to remove for this sport/user
    const itemsToRemove = allItems.filter(item => {
      if (typeof item !== 'string') return false;

      // Remove individual stats: stat:sport:username:statname
      return item.startsWith(`stat:${sport}:${username}:`);
    });

    console.debug(`Found ${itemsToRemove.length} stat items to remove for user ${username} sport ${sport}:`, itemsToRemove);

    if (itemsToRemove.length === 0) {
      console.debug('No existing stat items to remove');
      return { success: true, message: 'No stat items to remove', removedCount: 0 };
    }

    // Remove ALL stat items for this user/sport
    let removedCount = 0;
    let errors = [];

    for (const itemId of itemsToRemove) {
      try {
        console.debug('Removing item:', itemId);

        const removeResponse = await fetch('/api/ItemTracking/removeItem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: username,
            item: itemId
          })
        });

        if (!removeResponse.ok) {
          const errorText = await removeResponse.text();
          errors.push(`Failed to remove ${itemId}: ${errorText}`);
          console.error('Failed to remove item:', itemId, errorText);
        } else {
          const removeResult = await removeResponse.json();
          console.debug('Successfully removed item:', itemId, removeResult);
          removedCount++;
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
      console.debug(`Successfully removed all ${removedCount} stat items`);
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

export async function removeAllUserCollections(username) {
  try {
    // Get ALL tracked items for the user
    const response = await fetch('/api/ItemTracking/_getItemsTrackedByUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username })
    });
    const trackedData = await response.json();

    // Find ALL collection items (regardless of sport)
    const allItems = trackedData[0]?.items || [];
    const collectionsToRemove = allItems.filter(item =>
      typeof item === 'string' && item.startsWith('collection:') && item.includes(username)
    );

    console.debug(`Found ${collectionsToRemove.length} total collections to remove for user ${username}:`, collectionsToRemove);

    if (collectionsToRemove.length === 0) {
      console.debug('No collections to remove');
      return { success: true, message: 'No collections to remove' };
    }

    // Remove ALL collections
    let removedCount = 0;
    let errors = [];

    for (const collectionId of collectionsToRemove) {
      try {
        console.debug('Removing collection:', collectionId);

        const removeResponse = await fetch('/api/ItemTracking/removeItem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: username,
            item: collectionId
          })
        });

        if (!removeResponse.ok) {
          const errorText = await removeResponse.text();
          errors.push(`Failed to remove ${collectionId}: ${errorText}`);
          console.error('Failed to remove collection:', collectionId, errorText);
        } else {
          const removeResult = await removeResponse.json();
          console.debug('Successfully removed collection:', collectionId);
          removedCount++;
        }
      } catch (itemError) {
        errors.push(`Exception removing ${collectionId}: ${itemError.message}`);
        console.error('Exception removing collection:', collectionId, itemError);
      }
    }

    console.info(`Collection cleanup complete: removed ${removedCount}/${collectionsToRemove.length} collections`);

    if (errors.length > 0) {
      console.warn('Some collections could not be removed:', errors);
      return { success: true, removedCount, errors, message: `Removed ${removedCount} collections with ${errors.length} errors` };
    } else {
      return { success: true, removedCount, message: `Removed ${removedCount} collections` };
    }
  } catch (e) {
    console.error('Error removing all user collections:', e);
    return { error: e.message };
  }
}

export async function addUserStat(username, sport, statName) {
  try {
    // Store stat in original format (should be stat:statname)
    const statId = `stat:${sport}:${username}:${statName}`;
    console.debug('Adding individual stat:', statId);

    const response = await fetch('/api/ItemTracking/addItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username, item: statId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      console.error('Error adding stat:', result.error);
      return { error: result.error };
    }

    console.debug('Successfully added stat:', statName);
    return { success: true, statName };
  } catch (e) {
    console.error('Error adding user stat:', e);
    return { error: e.message };
  }
}

export async function removeUserStat(username, sport, statName) {
  try {
    // First, check how many stats the user currently has for this sport
    const currentStats = await getUserStatsCollection(username, sport);
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
    console.debug('Removing individual stat:', statId, '(from input:', statName, ')');

    const response = await fetch('/api/ItemTracking/removeItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username, item: statId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      console.error('Error removing stat:', result.error);
      return { error: result.error };
    }

    console.debug('Successfully removed stat:', statName);
    return { success: true, statName };
  } catch (e) {
    console.error('Error removing user stat:', e);
    return { error: e.message };
  }
}
