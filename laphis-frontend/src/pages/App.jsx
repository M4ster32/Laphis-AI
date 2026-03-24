import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./app/Layout";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Logs from "./pages/Logs";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}