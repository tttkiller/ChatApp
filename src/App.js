// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // <-- Add this import
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import GroupPage from "./components/GroupPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/groups" element={<GroupPage />} />
      </Routes>
    </Router>
  );
}

export default App;
