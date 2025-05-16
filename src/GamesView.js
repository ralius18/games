import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { addItem, fetchItems, updateItem } from './dynamo-service';
import { TextField, Button, Container, MenuItem, Select, InputLabel, FormControl, Chip, OutlinedInput, InputAdornment } from '@mui/material';
import { Close, Delete, Edit, Save, Star, StarOutline } from '@mui/icons-material';
import Notification from './Notification';
import { DataGrid, GridActionsCellItem, GridRowModes, GridRowEditStopReasons } from '@mui/x-data-grid';

const GamesView = () => {
    const [name, setName] = useState('');
    const [platformId, setPlatformId] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [metacriticRating, setMetacriticRating] = useState('');
    const [games, setGames] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateError, setUpdateError] = useState(false);
    const [rowModesModel, setRowModesModel] = useState({});

    const getPlatformClass = (platformName) => {
        switch (platformName.toLowerCase()) {
            case 'ps5':
                return 'chip-ps5';
            case 'pc':
                return 'chip-pc';
            case 'switch':
                return 'chip-switch';
            case 'xbox':
                return 'chip-xbox';
            case 'android':
                return 'chip-android';
            default:
                return 'chip-retro';
        }
    }

    const handleFavourite = useCallback(async (row) => {
        if (row) {
            const newFavouriteStatus = !row.is_favourite
            await updateItem('games', { id: row.id, name: row.name }, { is_favourite: newFavouriteStatus });
            const updatedData = games.map((game) =>
                row.id === game.id ? { ...game, is_favourite: newFavouriteStatus } : game
            );
            setGames(updatedData);
        }
    }, [games]);

    const handleDelete = useCallback((row) => {
        console.log("Delete")
        if (row) {
            console.log(row);
            // const updatedData = updatedRows.filter((row) => row.id !== row.id);
            // setUpdatedRows(updatedData); // Remove the row
        }
    }, []);

    const handleEditClick = useCallback((params) => {
        setRowModesModel({ ...rowModesModel, [params.id]: { mode: GridRowModes.Edit } });
    }, [rowModesModel]);

    const handleSaveClick = useCallback((params) => {
        setRowModesModel((prev) => ({ ...prev, [params.id]: { mode: GridRowModes.View } }));
    }, []);

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    }

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    }

    const handleCancelClick = useCallback((params) => {
        setRowModesModel({
            ...rowModesModel,
            [params.id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
    }, [setRowModesModel, rowModesModel]);

    const dateToString = (date) => {
        const month = date.getMonth() + 1;
        const arr = [
            date.getFullYear(),
            month.toString().padStart(2, '0'),
            date.getDate().toString().padStart(2, '0')
        ];
        return arr.join('-');
    }

    const handleRowUpdate = async (row) => {
        console.log(row);
        const { id, name, ...rowToUpdate } = row
        const updatedRow = {
            ...rowToUpdate,
            purchase_date: row.purchase_date ? dateToString(row.purchase_date) : '',
            release_date: row.release_date ? dateToString(row.release_date) : ''
        }
        try {
            await updateItem('games', { id: id, name: name }, updatedRow);
            setUpdateSuccess(true);
        } catch (error) {
            console.error("Error updating item:", error);
            setUpdateError(true);
        } finally {
            return { ...updatedRow, id: id, name: name };
        }
    }

    const handleRowUpdateError = (params) => { 
        console.error(params)
    }

    const gridColumns = useMemo(() =>
        [
            { field: 'name', headerName: 'Game', flex: 4, editable: true },
            {
                field: 'platform_name',
                headerName: 'Platform',
                flex: 1,
                renderCell: (params) => <Chip label={params.value} className={getPlatformClass(params.value)} /* style={{ marginLeft: '8px' }} */ />
            },
            { field: 'release_date', headerName: 'Release', flex: 1, valueGetter: (value) => value ? new Date(value) : null, type: 'date', editable: true },
            { field: 'metacritic_rating', headerName: 'Rating', flex: 1, valueGetter: (value) => value ? value : '-', type: 'number', editable: true },
            { field: 'purchase_date', headerName: 'Purchase', flex: 1, valueGetter: (value) => value ? new Date(value) : null, type: 'date', editable: true },
            { field: 'cost', headerName: 'Cost', flex: 1, valueGetter: (value) => value ? value : '-', type: 'number', editable: true },
            {
                field: 'is_favourite', headerName: 'Favourite', flex: 1, renderCell: (params) => {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            {params.row.is_favourite ? <Star color='warning' /> : <StarOutline color='grey' />}
                        </div>
                    );
                } },
            {
                field: 'actions', type: 'actions', headerName: 'Actions', flex: 1, getActions: (params) => {
                    if (rowModesModel[params.id]?.mode === GridRowModes.Edit) {
                        return [
                            <GridActionsCellItem
                                icon={<Save />}
                                label='Save'
                                onClick={() =>handleSaveClick(params)}
                            />,
                            <GridActionsCellItem
                                icon={<Close />}
                                label='Cancel'
                                onClick={() =>handleCancelClick(params)}
                            />
                        ]
                    }
                    return [
                        <GridActionsCellItem
                            icon={params.row.is_favourite ? <Star color='warning' /> : <StarOutline color='grey' /> }
                            label={ params.row.is_favourite ? 'Unfavourite' : 'Favourite' }
                            onClick={() => handleFavourite(params.row) }
                            showInMenu
                        />,
                        <GridActionsCellItem
                            icon={<Edit />}
                            label='Edit'
                            onClick={() => handleEditClick(params)}
                            showInMenu
                        />,
                        <GridActionsCellItem
                            icon={<Delete />}
                            label='Delete'
                            onClick={() => handleDelete(params.row)}
                            showInMenu
                        />,
                    ]
            }}
        ], [handleFavourite, handleDelete, handleEditClick, handleSaveClick, handleCancelClick, rowModesModel]
    );

    const mergeGamesWithPlatforms = (games, platforms) => {
        const platformsMap = new Map(platforms.map(platform => [platform.id, platform.name]));
        return games.map(game => ({
            ...game,
            platform_name: platformsMap.get(game.platform_id)
        }));
    }

    useEffect(() => {
        const loadGamesPlatforms = async () => {
            const gamesResult = await fetchItems('games');
            const platformsResult = await fetchItems('platforms');

            const gamesWithPlatforms = mergeGamesWithPlatforms(gamesResult, platformsResult).sort((a, b) => {
                const aFav = Boolean(a.is_favourite);
                const bFav = Boolean(b.is_favourite);
                if (aFav === bFav) {
                    return a.name.localeCompare(b.name);
                }
                return bFav - aFav;
            });

            setGames(gamesWithPlatforms);
            setPlatforms(platformsResult);
        };
        loadGamesPlatforms();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(false);
        const game = {
            name,
            platform_id: platformId,
            release_date: releaseDate === "" ? null : new Date(releaseDate).toISOString().substring(0,10),
            metacritic_rating: metacriticRating === "" ? null : metacriticRating
        };
        try {
            await addItem('games', game);
            setLoading(false);
            setSuccess(true);
            const updatedGames = await fetchItems('games');
            setGames(mergeGamesWithPlatforms(updatedGames, platforms));

            // Reset form
            setName("");
            setPlatformId("");
            setReleaseDate("");
            setMetacriticRating("");
        } catch (err) {
            console.log(err)
            setLoading(false);
            setError(true);
        }
    };

    return (
        <Container>
            <form onSubmit={handleSubmit}>
                <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth margin="normal" />
                <FormControl fullWidth margin="normal">
                    <InputLabel id="platform-label" required>Platform</InputLabel>
                    <Select
                        labelId="platform-label"
                        label="Platform"
                        value={platformId}
                        onChange={(e) => setPlatformId(e.target.value)}
                        required
                    >
                        {platforms.map((platform) => (
                            <MenuItem key={platform.id} value={platform.id}>
                                {platform.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField type="date" label="Release Date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
                <TextField type="number" label="Metacritic Rating" value={metacriticRating} onChange={(e) => setMetacriticRating(e.target.value)} fullWidth margin="normal" />
                <FormControl fullWidth sx={{ my: 2 }}>
                    <InputLabel htmlFor="outlined-adornment-amount">Cost</InputLabel>
                    <OutlinedInput
                        id="outlined-adornment-amount"
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        label="Amount"
                    />
                </FormControl>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>Add Game</Button>
            </form>
            {/* <GamesList games={games} /> */}

            <DataGrid
                rows={games}
                columns={gridColumns}
                sx={{ my: '24px' }}
                editMode='row'
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={(updatedRow) => handleRowUpdate(updatedRow)}
                onProcessRowUpdateError={handleRowUpdateError}
            />

            <Notification open={success} onClose={() => setSuccess(false)} severity="success" message="Game added!" />
            <Notification open={error} onClose={() => setError(false)} severity="error" message="Failed to add game" />

            <Notification open={updateSuccess} onClose={() => setUpdateSuccess(false)} severity="success" message="Game updated!" />
            <Notification open={updateError} onClose={() => setUpdateError(false)} severity="error" message="Failed to update game" />
        </Container>
    );
};

export default GamesView;
