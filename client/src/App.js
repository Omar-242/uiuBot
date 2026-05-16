import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OTP from './pages/OTP';
import Chat from './pages/Chat';

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp" element={<OTP setToken={setToken} />} />
        <Route path="/chat" element={token ? <Chat setToken={setToken} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
