import { useState, useEffect } from "react";
import { isStaff } from "@/lib/roles";
import Sidebar from "@/components/Sidebar";
import ProfileCard from "@/components/ProfileCard";
import RecentApprovedWidget from "@/components/RecentApprovedWidget";
import TopProjectsWidget from "@/components/TopProjectsWidget";
import ProjectCard from "@/components/ProjectCard";

export default function Dashboard({ currentUser }) {
  const [recentProjects, setRecentProjects] = useState([]);
  const [feedProjects, setFeedProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
  const statusQuery = isStaff(currentUser) ? "" : "status=approved";

        const feedRes = await fetch(`/api/projects?${statusQuery}`, { credentials: "include" });
        const feedData = await feedRes.json();
        setFeedProjects(feedData || []);

        const recentRes = await fetch(`/api/projects?${statusQuery}&limit=5`, { credentials: "include" });
        const recentData = await recentRes.json();
        setRecentProjects(recentData || []);

  // Top projects will be fetched by the TopProjectsWidget itself.
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();
  }, [currentUser?.role]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Sidebar
        currentUser={currentUser}
        pendingCount={0} 
        onLogout={async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.reload();
          } catch (error) {
            console.error("Logout failed:", error);
          }
        }}
      />

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-6 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Feed */}
            <div>
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Feed</h2>
              <div className="space-y-4">
                {(feedProjects || []).map((project) => (
                  <ProjectCard key={project._id || project.id} project={project} currentUser={currentUser} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-4">
            <ProfileCard user={currentUser} />
            <RecentApprovedWidget projects={recentProjects || []} />
            <TopProjectsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
