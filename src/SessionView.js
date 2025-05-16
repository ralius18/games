import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addItem, fetchItems, deleteItem } from './dynamo-service';
import { TextField, Button, Container, MenuItem, Select, InputLabel, FormControl, Chip, Autocomplete, Checkbox, InputAdornment, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import Notification from './Notification';
import { Star, Clear, Delete } from '@mui/icons-material';
import { DateTime } from 'luxon';

const useStyles = makeStyles((theme) => ({
    chip: {
        margin: '4px'
    },
    button: {
        margin: '8px'
    },
    progress: {
        margin: '16px',
    },


}));

const SessionView = () => {
    const classes = useStyles();
    const [gameId, setGameId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [friendIds, setFriendIds] = useState([]);
    const [games, setGames] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const handleDelete = useCallback((row) => {
        if (row) {
            setSelectedSession(row);
            setDeleteConfirmOpen(true);
        }
    }, []);

    const gridColumns = useMemo(() => [
        { field: 'game_name', headerName: 'Game', flex: 3 },
        { field: 'start_time', headerName: 'Start', flex: 2, renderCell: (params) => { return params.row['start_time_local'] } },
        { field: 'end_time', headerName: 'End', flex: 2, renderCell: (params) => { return params.row['end_time_local'] } },
        { field: 'duration', headerName: 'Duration', flex: 2 },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', flex: 1, getActions: (params) => {
                return [
                    <GridActionsCellItem
                        icon={<Delete />}
                        label='Delete'
                        onClick={() => handleDelete(params.row)}
                        showInMenu
                    />,
                ]
            }
        }
    ], [handleDelete])

    useEffect(() => {
        const loadData = async () => {
            const gamesResult = await fetchItems('games');
            const friendsResult = await fetchItems('friends');
            const sessionsResult = await fetchItems('sessions', 'start_time', 'desc');
            const sessionsWithGames = mergeSessionsWithGames(gamesResult, sessionsResult);
            const sessionsInTz = convertSessionTimeZone(sessionsWithGames);

            setGames(gamesResult.sort((a, b) => {
                const aFav = Boolean(a.is_favourite);
                const bFav = Boolean(b.is_favourite);
                if (aFav === bFav) {
                    return a.name.localeCompare(b.name);
                }
                return bFav - aFav;
            }));
            setFriends(friendsResult);
            setSessions(sessionsInTz);
        };
        loadData();
    }, []);

    const mergeSessionsWithGames = (games, sessions) => {
        const gamesMap = new Map(games.map(game => [game.id, game.name]));
        return sessions.map(session => ({
            ...session,
            game_name: gamesMap.get(session.game_id)
        }));
    }

    const convertSessionTimeZone = (sessions) => {
        return sessions.map((session) => {
            const diffMs = DateTime.fromISO(session.end_time) - DateTime.fromISO(session.start_time); // Difference in milliseconds
            const diffMinutes = Math.floor(diffMs / 60000); // Convert to minutes
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            return {
                ...session,
                start_time_local: DateTime.fromISO(session.start_time, { zone: 'utc' }).setZone(DateTime.local().zoneName).toFormat("HH:mm:ss dd-MM-yyyy"),
                end_time_local: DateTime.fromISO(session.end_time, { zone: 'utc' }).setZone(DateTime.local().zoneName).toFormat("HH:mm:ss dd-MM-yyyy"),
                duration: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(false);
        const localOffset = new Date().getTimezoneOffset();
        const offsetHours = String(Math.abs(Math.floor(localOffset / 60))).padStart(2, '0');
        const offsetMinutes = String(Math.abs(localOffset % 60)).padStart(2, '0');
        const sign = localOffset > 0 ? '-' : '+';
        const formatTimeWithTZ = (time) => {
            const date = new Date(time);
            const localISO = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0') + 'T' +
                String(date.getHours()).padStart(2, '0') + ':' +
                String(date.getMinutes()).padStart(2, '0') + ':' +
                String(date.getSeconds()).padStart(2, '0') +
                sign + offsetHours + ':' + offsetMinutes;

            return localISO;
        };
        const session = {
            // id: uuidv4(),
            game_id: gameId,
            start_time: formatTimeWithTZ(startTime),
            end_time: formatTimeWithTZ(endTime),
            friend_ids: friendIds,
        };
        try {
            await addItem('sessions', session);
            setLoading(false);
            setSuccess(true);

            // Reset form
            setGameId('');
            setStartTime('');
            setEndTime('');
            setFriendIds([]);
        } catch (err) {
            setLoading(false);
            setError(true);
        }
        // Add any additional logic after adding the session
    };

    const setNow = (setTime) => {
        const now = new Date();
        const localOffset = now.getTimezoneOffset(); // Get the timezone offset in minutes
        const localTimeWithOffset = new Date(now.getTime() - localOffset * 60000); // Adjust the time by the offset
        const formattedTime = localTimeWithOffset.toISOString().slice(0, 16); // Format to match datetime-local (YYYY-MM-DDTHH:MM)
        setTime(formattedTime);
    };

    const handleGameChange = (event, newValue) => {
        setGameId(newValue ? newValue.id : null); // Set only the 'id' value
    };

    const handleStartClear = () => {
        setStartTime('');
    }

    const handleEndClear = () => {
        setEndTime('');
    }

    const handleConfirmDelete = async () => {
        if (selectedSession) {
            await deleteItem('sessions', {
                id: selectedSession.id,
                start_time: selectedSession.start_time
            });
        }
        setDeleteConfirmOpen(false);
        setSelectedSession(null);
    };

    return (
        <Container>
            <form onSubmit={handleSubmit}>
                {/* <FormControl fullWidth margin="normal">
                    <InputLabel id="game-label">Game</InputLabel>
                    <Select
                        labelId="game-label"
                        label="Game"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        required
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: '80%',
                                    overflowY: 'auto'
                                }
                            }
                        }}
                    >
                        {games.map((game) => (
                            <MenuItem key={game.id} value={game.id}>
                                {game.is_favorite && <Star color='warning' />} {game.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl> */}
                <Autocomplete
                    value={games.find(game => game.id === gameId) || null}
                    onChange={handleGameChange}
                    options={games}
                    getOptionLabel={(game) => game.name} // Display 'label' in the dropdown
                    isOptionEqualToValue={(game, value) => game.id === value} // Match based on 'id'
                    renderInput={(params) => <TextField {...params} label="Game" />}
                    renderOption={(props, option) => {
                        return (
                            <li {...props} key={option.id}>
                                {option.is_favourite && <Star color="warning" sx={{ marginRight: 1 }} />}
                                {option.name}
                            </li>
                        )
                    }}
                />
                <TextField
                    type="datetime-local"
                    label="Start Time"
                    name="start_time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    fullWidth
                    margin="normal"
                    slotProps={{
                        inputLabel: {
                            shrink: true
                        },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    {startTime !== "" && (
                                        <IconButton onClick={handleStartClear} edge="end">
                                            <Clear />
                                        </IconButton>
                                    )}
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                <Button variant="contained" onClick={() => setNow(setStartTime)} className={classes.button} color="secondary">Set Start Time to Now</Button>
                <TextField
                    type="datetime-local"
                    label="End Time"
                    name="end_time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    fullWidth
                    margin="normal"
                    slotProps={{
                        inputLabel: {
                            shrink: true
                        },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    {endTime !== "" && (
                                        <IconButton onClick={handleEndClear} edge="end">
                                            <Clear />
                                        </IconButton>
                                    )}
                                </InputAdornment>
                            ),
                        }
                    }} />
                <Button variant="contained" onClick={() => setNow(setEndTime)} className={classes.button} color="secondary">Set End Time to Now</Button>
                <FormControl fullWidth margin="normal">
                    <InputLabel id="friends-label">Friends</InputLabel>
                    <Select
                        labelId="friends-label"
                        label="Friends"
                        multiple
                        value={friendIds}
                        onChange={(e) => setFriendIds(e.target.value)}
                        renderValue={(selected) => (
                            <div> {selected.map((value) => {
                                const friend = friends.find((f) => f.id === value);
                                return <Chip key={value} label={friend ? friend.name : value} className={classes.chip} />;
                            })}
                            </div>
                        )}
                    >
                        {friends.map((friend) => (
                            <MenuItem key={friend.id} value={friend.id}>
                                <Checkbox checked={friendIds.includes(friend.id)} />
                                {friend.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>Add Session</Button>
            </form>
            <DataGrid
                rows={sessions}
                columns={gridColumns}
                sx={{ my: '24px' }}
            />

            <Notification open={success} onClose={() => setSuccess(false)} severity="success" message="Session added!" />
            <Notification open={error} onClose={() => setError(false)} severity="error" message="Failed to add session" />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this session for {selectedSession?.game_name}?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SessionView;
