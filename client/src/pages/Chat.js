import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, Paper, Button, TextField } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

const Chat = ({ setToken }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [messages, setMessages] = useState([
    { from: 'uiuBot', text: 'Hi! I am uiuBot. How can I help you?' }
  ]);
  const [input, setInput] = useState('');

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput('');
    const userMessage = { from: 'user', text: question };
    const loadingMessage = { from: 'uiuBot', text: 'Thinking...', isLoading: true };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      const response = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.answer?.trim() || 'Sorry, I could not find an answer right now.';

      setMessages(prev =>
        prev.map(msg => (msg.isLoading ? { ...msg, text: answer, isLoading: false } : msg))
      );
    } catch (error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading
            ? { ...msg, text: 'Sorry, something went wrong. Please try again.', isLoading: false }
            : msg
        )
      );
      console.error('Failed to reach RAG backend:', error);
    }
  };

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#ff6600' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>uiuBot</Typography>
          <IconButton color="inherit" onClick={handleMenu}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1 }} />Logout</MenuItem>
            <MenuItem disabled>Other Option</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 2, minHeight: 400, bgcolor: '#fff', mb: 2 }}>
          {messages.map((msg, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
              <Box sx={{ bgcolor: msg.from === 'user' ? '#ff6600' : '#eee', color: msg.from === 'user' ? '#fff' : '#000', px: 2, py: 1, borderRadius: 2, maxWidth: '80%' }}>
                <Typography>{msg.text}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <TextField value={input} onChange={e => setInput(e.target.value)} fullWidth placeholder="Type your message..." />
          <Button type="submit" variant="contained" sx={{ bgcolor: '#ff6600', color: '#fff', fontWeight: 'bold' }}>Send</Button>
        </form>
      </Box>
    </Box>
  );
};

export default Chat;
