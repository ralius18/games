import React, { useState, useEffect } from 'react';
import { addItem, fetchItems } from './postgrest-service';
import { TextField, Button, Container, List, ListItem, ListItemText } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import Notification from './Notification';


const FriendsView = () => {
    const [name, setName] = useState('');
    const [retro, setRetro] = useState(false);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadFriends = async () => {
            const friendsResult = await fetchItems('friends');
            setFriends(friendsResult.sort((a, b) => { return a.name.localeCompare(b.name) }));
        };
        loadFriends();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(false);
        const friend = {
            id: uuidv4(),
            name,
            is_retro: retro
        };
        try {
            await addItem('friends', friend);
            setLoading(false);
            setSuccess(true);
            const updatedFriends = await fetchItems('friends');
            setFriends(updatedFriends.sort((a, b) => { return a.name.localeCompare(b.name) }));

            // Reset form
            setName("");
            setRetro(false);
        } catch (err) {
            setLoading(false);
            setError(true);
        }
    };

    return (
        <Container>
            <form onSubmit={handleSubmit}>
                <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth margin="normal" />
                <Button type="submit" variant="contained" color="primary" disabled={loading}>Add Friend</Button>
            </form>

            <List>
                {friends.map((friend) => (
                    <ListItem key={friend.id}>
                        <ListItemText primary={friend.name} />
                    </ListItem>
                ))}
            </List>
            <Notification open={success} onClose={() => setSuccess(false)} severity="success" message="Friend added!" />
            <Notification open={error} onClose={() => setError(false)} severity="error" message="Failed to add friend" />
        </Container>
    );
};

export default FriendsView;