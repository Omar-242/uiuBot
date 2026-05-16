import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      localStorage.setItem('pendingEmail', email);
      setSuccess('Registered! Check your email for OTP.');
      setTimeout(() => navigate('/otp'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: '#fff', borderRadius: 2, minWidth: 350 }}>
        <Typography variant="h4" sx={{ color: '#ff6600', mb: 2, fontWeight: 'bold' }}>uiuBot Register</Typography>
        <form onSubmit={handleSubmit}>
          <TextField label="Name" fullWidth required value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Email" type="email" fullWidth required value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Password" type="password" fullWidth required value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 2 }} />
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          {success && <Typography color="success.main" sx={{ mb: 2 }}>{success}</Typography>}
          <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#ff6600', color: '#fff', fontWeight: 'bold', mb: 1 }}>Register</Button>
        </form>
        <Typography variant="body2">Already have an account? <Link to="/login">Login</Link></Typography>
      </Paper>
    </Box>
  );
};

export default Register;
