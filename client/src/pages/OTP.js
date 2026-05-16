import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const OTP = ({ setToken }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const email = localStorage.getItem('pendingEmail');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      localStorage.removeItem('pendingEmail');
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: '#fff', borderRadius: 2, minWidth: 350 }}>
        <Typography variant="h4" sx={{ color: '#ff6600', mb: 2, fontWeight: 'bold' }}>OTP Verification</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Enter the OTP sent to your email</Typography>
        <form onSubmit={handleSubmit}>
          <TextField label="OTP" fullWidth required value={otp} onChange={e => setOtp(e.target.value)} sx={{ mb: 2 }} />
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#ff6600', color: '#fff', fontWeight: 'bold', mb: 1 }}>Verify OTP</Button>
        </form>
      </Paper>
    </Box>
  );
};

export default OTP;
