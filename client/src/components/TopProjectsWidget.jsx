import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ThumbsUp } from "lucide-react";

export default function TopProjectsWidget({ projects: initialProjects = null, limit = 3 }) {
  const [projects, setProjects] = useState(initialProjects || []);
  const [loading, setLoading] = useState(!initialProjects);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (initialProjects) {
      // Filter to only show projects with at least 1 like
      const filtered = initialProjects
        .filter(p => (p.thumbsUp || 0) > 0)
        .sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0))
        .slice(0, limit);
      setProjects(filtered);
      return;
    }

    const fetchTop = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query approved projects
        const res = await fetch(`/api/projects?status=approved`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        let list = data || [];
        if (!Array.isArray(list)) list = [];
        
        // Filter to only projects with at least 1 like, sort by likes desc
        const filtered = list
          .filter(p => (p.thumbsUp || 0) > 0)
          .sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0))
          .slice(0, limit);
        
        if (mounted) setProjects(filtered);
      } catch (err) {
        console.error("Failed to load top projects:", err);
        if (mounted) setError(err.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTop();

    return () => {
      mounted = false;
    };
  }, [initialProjects, limit]);

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-red-500/10 dark:from-orange-950/20 dark:via-yellow-950/20 dark:to-red-950/20 border-orange-200/30 dark:border-orange-800/30 shadow-lg hover-lift">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🏆</span>
        <h4 className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">Top Projects</h4>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground animate-pulse text-center py-4">⏳ Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600 dark:text-red-400 text-center py-4">⚠️ {error}</div>
      ) : projects.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6 italic">No liked projects yet</div>
      ) : (
        <ul className="space-y-3">
          {projects.map((proj, idx) => (
            <li key={proj.id || proj._id} className="flex justify-between items-start p-3 rounded-lg bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-200 group">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 font-bold text-lg w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center">
                  {idx + 1}
                </div>
                <Link href={`/project/${proj.id || proj._id}`} className="flex-1 group">
                  <p className="font-semibold text-sm text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                    {proj.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{proj.course}</p>
                </Link>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex-shrink-0">
                👍 {proj.thumbsUp || 0}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

