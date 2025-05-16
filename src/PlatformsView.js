import React, { useState, useEffect } from 'react';
import { addItem, fetchItems } from './dynamo-service';
import { TextField, Button, Container, List, ListItem, ListItemText, Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import Notification from './Notification';


const PlatformsView = () => {
    const [name, setName] = useState('');
    const [retro, setRetro] = useState(false);
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadPlatforms = async () => {
            const platformsResult = await fetchItems('platforms');
            setPlatforms(platformsResult.sort((a, b) => { return a.name.localeCompare(b.name) }));
        };
        loadPlatforms();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(false);
        const platform = {
            id: uuidv4(),
            name,
            is_retro: retro
        };
        try {
            await addItem('platforms', platform);
            setLoading(false);
            setSuccess(true);
            const updatedPlatforms = await fetchItems('platforms');
            setPlatforms(updatedPlatforms);

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
                <FormGroup>
                    <FormControlLabel control={<Checkbox checked={retro} onChange={(e) => setRetro(e.target.checked)}/>} label="Retro" />
                </FormGroup>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>Add Platform</Button>
            </form>

            <List>
                {platforms.map((platform) => (
                    <ListItem key={platform.id}>
                        <ListItemText primary={platform.name} secondary={<Checkbox disabled checked={platform.is_emulated === true} label="Retro: " />} />
                    </ListItem>
                ))}
            </List>
            <Notification open={success} onClose={() => setSuccess(false)} severity="success" message="Platform added!" />
            <Notification open={error} onClose={() => setError(false)} severity="error" message="Failed to add platform" />
        </Container>
    );
};

export default PlatformsView;