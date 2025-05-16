import React, { useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Box
} from '@mui/material';
import { MoreVert, Star } from '@mui/icons-material';
import { deleteItem, updateItem } from './postgrest-service';

function GameList({ games }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const handleMenuOpen = (event, game) => {
        setAnchorEl(event.currentTarget);
        setSelectedGame(game);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
        handleMenuClose();
    };

    const handleConfirmDelete = async () => {
        if (selectedGame) {
            await deleteItem('games', selectedGame.id);
        }
        setDeleteConfirmOpen(false);
        setSelectedGame(null);
    };

    const handleFavoriteToggle = async () => {
        if (selectedGame) {
            const body = { is_favorite: !selectedGame.is_favorite }
            updateItem('games', selectedGame.id, body)
            selectedGame.is_favorite = !selectedGame.is_favorite
        }
        setSelectedGame(null);
        handleMenuClose();
    };

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

    return (
        <>
            <List>
                {games.map((game) => (
                    <ListItem key={game.id}>
                        <Box display="flex" alignItems="center" width="100%">
                            <ListItemText
                                primary={game.name}
                                secondary={`Rating: ${game.metacritic_rating == 0 ? '-' : game.metacritic_rating}`}
                            />
                            {game.is_favorite && <Star color='warning' />}
                            <Chip
                                label={game.platform_name}
                                className={getPlatformClass(game.platform_name)}
                                style={{ marginLeft: '8px' }}
                            />
                            <IconButton
                                onClick={(e) => handleMenuOpen(e, game)}
                                aria-label="menu"
                            >
                                <MoreVert />
                            </IconButton>
                        </Box>
                    </ListItem>
                ))}
            </List>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleFavoriteToggle}>
                    {selectedGame?.is_favorite ? 'Unfavorite' : 'Favorite'}
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {selectedGame?.name}?
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
        </>
    );
}

export default GameList;
