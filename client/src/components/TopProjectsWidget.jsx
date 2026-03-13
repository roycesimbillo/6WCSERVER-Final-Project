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

    if (initialProjects) return; // caller provided data

    const fetchTop = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query only approved projects sorted by thumbsUp
        const res = await fetch(`/api/projects?status=approved&sort=thumbsUp&limit=${encodeURIComponent(limit)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        let list = data || [];
        if (!Array.isArray(list)) list = [];
        // Ensure sorted by thumbsUp desc
        list = list.slice().sort((a, b) => (b.thumbsUp || 0) - (a.thumbsUp || 0)).slice(0, limit);
        if (mounted) setProjects(list);
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
    <Card className="p-4">
      <h4 className="font-semibold text-lg mb-2">Top Projects</h4>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : (
        <ul className="space-y-2">
          {projects.map((proj) => (
            <li key={proj._id} className="flex justify-between items-center text-sm">
              <Link href={`/project/${proj._id}`} className="underline">
                {proj.title}
              </Link>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {proj.thumbsUp || 0}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
