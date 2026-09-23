import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import { authService } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
        <Navbar user={currentUser} onLogout={() => setCurrentUser(null)} />
        <main className="flex-1">
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLoginSuccess={(u) => setCurrentUser(u)} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                currentUser ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/users"
              element={
                currentUser ? (
                  <Users />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
