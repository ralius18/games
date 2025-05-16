import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchItems } from './dynamo-service';

const StatsView = () => {
  const [games, setGames] = useState([]);
  // const [platforms, setPlatforms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [includeHistoricHours, setIncludeHistoricHours] = useState(false);

  useEffect(() => {
      const loadData = async () => {
        const gamesResult = await fetchItems('games');
        const platformsResult = await fetchItems('platforms');
        const sessionsResult = await fetchItems('sessions');

        const gamesWithPlatforms = mergeGamesWithPlatforms(gamesResult, platformsResult).sort((a, b) => {
            const aFav = Boolean(a.is_favourite);
            const bFav = Boolean(b.is_favourite);
            if (aFav === bFav) {
                return a.name.localeCompare(b.name);
            }
            return bFav - aFav;
        });

        setGames(gamesWithPlatforms);
        // setPlatforms(platformsResult);
        setSessions(sessionsResult);
      };
    loadData();
  }, []);

  const mergedSessions = sessions.map(session => {
    const game = games.find(g => g.id === session.game_id);
    return {
      ...session,
      game_name: game ? game.name : 'Unknown Game',
    };
  });

  const filteredSessions = mergedSessions.filter(session => {
    const sessionDate = new Date(session.start_time);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;

    return (
      (!startDate || sessionDate >= startDate) &&
      (!endDate || sessionDate <= endDate)
    )
  })

  const mergeGamesWithPlatforms = (games, platforms) => {
    const platformsMap = new Map(platforms.map(platform => [platform.id, platform.name]));
    return games.map(game => ({
      ...game,
      platform_name: platformsMap.get(game.platform_id)
    }));
  }

  const calculateTotalHours = (sessions, games) => {
    const gameStats = {};

    // Create a map for game costs and historic hours
    // const gameDetails = games.reduce((acc, game) => {
    //   acc[game.name] = { cost: game.cost || 0, historic_hours: game.historic_hours || 0 };
    //   return acc;
    // }, {});

    // Loop through sessions once to accumulate session hours and count
    sessions.forEach(({ game_name, start_time, end_time }) => {
      const start = new Date(start_time);
      const end = new Date(end_time);
      const hours = (end - start) / (1000 * 60 * 60); // Convert milliseconds to hours

      if (!gameStats[game_name]) {
        gameStats[game_name] = { hours: 0, count: 0, cost: 0, historic_hours: 0 };
      }

      gameStats[game_name].hours += hours;
      gameStats[game_name].count += 1;
    });

    // Add historic hours for all games that have historic_hours, if checkbox is ticked
    if (includeHistoricHours) {
      games.forEach((game) => {
        const { name, historic_hours, cost } = game;

        if (!gameStats[name]) {
          gameStats[name] = { hours: 0, count: 0, cost: 0, historic_hours: 0 };
        }

        gameStats[name].historic_hours = historic_hours || 0;
        gameStats[name].hours += gameStats[name].historic_hours; // Add historic hours once
        gameStats[name].cost = cost || 0;
      });
    } else {
      // If not including historic hours, just add the cost
      games.forEach((game) => {
        const { name, cost } = game;

        if (!gameStats[name]) {
          gameStats[name] = { hours: 0, count: 0, cost: 0, historic_hours: 0 };
        }

        gameStats[name].cost = cost || 0; // Add cost if historic hours are not included
      });
    }
    
    // Filter out games with 0 hours
    const filteredGameStats = Object.keys(gameStats)
      .filter(game_name => gameStats[game_name].hours > 0)
      .reduce((acc, game_name) => {
        acc[game_name] = gameStats[game_name];
        return acc;
      }, {});

    return filteredGameStats;
  };

  const gameStats = calculateTotalHours(filteredSessions, games);

  // Calculate total values
  const totalGames = Object.keys(gameStats).length;
  const totalHours = Object.values(gameStats).reduce((sum, game) => sum + game.hours, 0);
  const totalCost = Object.values(gameStats).reduce((sum, game) => sum + game.cost, 0);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Total Hours per Game
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 4 }}>
        <TextField
          label="Start Date"
          type="date"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="End Date"
          type="date"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includeHistoricHours}
              onChange={(e) => setIncludeHistoricHours(e.target.checked)}
              name="includeHistoricHours"
            />
          }
          label="Include Historic Hours"
        />
      </Box>
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="h6">Total Games: {totalGames}</Typography>
        <Typography variant="h6">Total Hours: {totalHours.toFixed(2)} hrs</Typography>
        <Typography variant="h6">Total Cost: ${totalCost.toFixed(2)}</Typography>
      </Box>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <DataGrid
          rows={Object.entries(gameStats).map(([game_name, { hours, count, cost }], index) => {
            const hourly_rate = cost ? (cost / hours).toFixed(2) : '-';
            return {
              id: index,
              game_name,
              hours,
              count,
              hourly_rate
            };
          })}
          columns={[
            { field: 'game_name', headerName: 'Game Name', flex: 2 },
            { field: 'hours', headerName: 'Total Hours', flex: 1, valueFormatter: (value) => {
              const wholeHours = Math.floor(value);
              const minutes = Math.round((value - wholeHours) * 60);
              return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            } },
            { field: 'count', headerName: 'Sessions', type: 'number', flex: 1 },
            { field: 'hourly_rate', headerName: '$/hr', flex: 1}
          ]}
          disableSelectionOnClick
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          initialState={{
            sorting: {
              sortModel: [{ field: 'game_name', sort: 'asc' }],
            },
          }}
        />
      </div>
    </Box>
  )
}

export default StatsView;