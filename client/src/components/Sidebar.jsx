import { Link, useLocation } from "wouter";
import { Home, FolderOpen, Upload, User, FileCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isStaff } from "@/lib/roles";

export default function Sidebar({ currentUser, pendingCount = 0, onLogout }) {
  const [location, setLocation] = useLocation();

  const isActive = (path) => location === path;

  const baseUrl =
    import.meta.env.MODE === "development"
      ? "http://localhost:5000"
      : "";

  const handleLogout = async () => {
    try {
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      if (onLogout) onLogout();
      setLocation("/login");
    }
  };

  const studentLinks = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/browse", icon: FolderOpen, label: "Browse Projects" },
    { path: "/upload", icon: Upload, label: "Upload Project" },
    { path: "/profile", icon: User, label: "My Profile" },
  ];

  const teacherLinks = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/browse", icon: FolderOpen, label: "Browse Projects" },
    { path: "/admin", icon: FileCheck, label: "Pending Approvals" },
    { path: "/profile", icon: User, label: "My Profile" },
  ];

  const links = isStaff(currentUser) ? teacherLinks : studentLinks;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-purple-700 border-r border-blue-500/20 h-screen flex flex-col shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          Projectory
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link key={link.path} href={link.path}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-white hover:bg-white/20 transition-all duration-200 ${
                isActive(link.path) ? "bg-white/30 shadow-lg" : ""
              }`}
              data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
              {link.path === "/admin" && pendingCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white" data-testid="badge-pending-count">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white hover:bg-red-500/20 transition-all duration-200"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
