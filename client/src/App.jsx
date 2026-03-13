import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import BrowseProjects from "@/pages/BrowseProjects";
import UploadProject from "@/pages/UploadProject";
import ProjectDetail from "@/pages/ProjectDetail";
import AdminPanel from "@/pages/AdminPanel";
import Profile from "@/pages/Profile";

function Router({ currentUser, onLogin, onLogout }) {
  if (!currentUser) {
    return <Login onLogin={onLogin} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard currentUser={currentUser} onLogout={onLogout} />} />
      <Route path="/browse" component={() => <BrowseProjects currentUser={currentUser} onLogout={onLogout} />} />
      <Route path="/upload" component={() => <UploadProject currentUser={currentUser} onLogout={onLogout} />} />
      <Route path="/project/:id" component={() => <ProjectDetail currentUser={currentUser} onLogout={onLogout} />} />
      <Route path="/admin" component={() => <AdminPanel currentUser={currentUser} onLogout={onLogout} />} />
      <Route path="/profile" component={() => <Profile currentUser={currentUser} onLogout={onLogout} />} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const baseUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router currentUser={currentUser} onLogin={setCurrentUser} onLogout={() => setCurrentUser(null)} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
