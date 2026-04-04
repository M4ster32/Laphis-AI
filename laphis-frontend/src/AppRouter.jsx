import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/Toast";
import Layout from "./app/Layout";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Logs from "./pages/Logs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import Settings from "./pages/Settings";
import Zen from "./pages/Zen";
import Reports from "./pages/Reports";
import DailyPlan from "./pages/DailyPlan";

// Route protection component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function AppRouter() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AppProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes with Layout (bottom tabs) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/plans/:planId" element={<PlanDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/zen" element={<Zen />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/daily-plan" element={<DailyPlan />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

