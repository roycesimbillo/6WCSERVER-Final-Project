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
    <div className="flex h-screen bg-gradient-modern">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 p-8 max-w-7xl mx-auto">
          <div className="space-y-8 animate-fadeInUp">
            {/* Feed Header */}
            <div>
              <div className="mb-2">
                <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-semibold uppercase tracking-wider">Latest</span>
              </div>
              <h2 className="text-4xl font-bold mb-8 text-gradient">Project Feed</h2>
              <div className="space-y-5">
                {(feedProjects || []).length > 0 ? (
                  (feedProjects || []).map((project, idx) => (
                    <div key={project.id || project._id} className="animate-fadeInUp" style={{ animationDelay: `${idx * 100}ms` }}>
                      <ProjectCard project={project} currentUser={currentUser} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No projects available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            <div className="animate-slideInRight" style={{ animationDelay: '100ms' }}>
              <ProfileCard user={currentUser} />
            </div>
            <div className="animate-slideInRight" style={{ animationDelay: '200ms' }}>
              <RecentApprovedWidget projects={recentProjects || []} />
            </div>
            <div className="animate-slideInRight" style={{ animationDelay: '300ms' }}>
              <TopProjectsWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
