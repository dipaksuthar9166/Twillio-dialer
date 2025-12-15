import React, { useState, useEffect } from 'react';
import { Paper, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const TwilioManager = () => {
    const [config, setConfig] = useState({
        accountSid: '',
        authToken: '',
        phoneNumber: '',
        whatsappNumber: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch existing configuration on component mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/twilio-config`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Set the state with the fetched config
                        // The backend sends a placeholder for the auth token for security
                        setConfig(data.config);
                    }
                } else {
                     // If no config is found (404), just show an empty form.
                    console.log('No active Twilio configuration found. Please enter a new one.');
                }
            } catch (error) {
                console.error('Error fetching Twilio config:', error);
                setMessage({ type: 'error', text: 'Failed to load configuration.' });
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []); // Empty dependency array means this runs once on mount

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        // If the user hasn't changed the placeholder token, don't send it.
        // The backend will ignore it if it's the placeholder text.
        const payload = { ...config };
        if (payload.authToken === 'Configured and saved') {
            // If you want to allow updating other fields without re-entering the token,
            // you might need a different backend logic. For now, we require it for changes.
            setMessage({ type: 'warning', text: 'To save changes, please re-enter the Auth Token.' });
            setSaving(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/twilio-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: 'success', text: 'Configuration saved successfully!' });
                // For security, after saving, we replace the real token with the placeholder
                setConfig(prev => ({ ...prev, authToken: 'Configured and saved' }));
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save configuration.' });
            }
        } catch (error) {
            console.error('Error saving Twilio config:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h5" gutterBottom>Twilio Manager</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your Twilio Account SID and Auth Token here. For security, the Auth Token is not displayed.
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Twilio Account SID"
                    name="accountSid"
                    value={config.accountSid}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Twilio Auth Token"
                    name="authToken"
                    type="password"
                    placeholder="Enter new token to update"
                    value={config.authToken}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                    helperText="Leave as is unless you want to change it."
                />
                {/* Other fields can be added here if needed */}

                {message.text && <Alert severity={message.type} sx={{ mt: 2 }}>{message.text}</Alert>}

                <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} disabled={saving}>
                    {saving ? <CircularProgress size={24} /> : 'Save Configuration'}
                </Button>
            </form>
        </Paper>
    );
};

export default TwilioManager;