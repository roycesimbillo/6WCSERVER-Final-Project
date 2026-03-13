// ProjectCard.jsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getUploaderName } from "@/lib/uploader";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ImageGallery from "./ImageGallery";

export default function ProjectCard({ project, currentUser }) {
  const [thumbsUp, setThumbsUp] = useState(project.thumbsUp || 0);
  const [thumbsDown, setThumbsDown] = useState(project.thumbsDown || 0);
  const [userVote, setUserVote] = useState(null);
  const { toast } = useToast();

  // Use either id or _id
  const projectId = project.id || project._id;

  // Fallbacks in case some data is missing
  const title = project.title || "Untitled Project";
  const description = project.description || "No description provided.";
  const tags = project.tags || [];
  const status = project.status || "pending";

  // Badge color based on status
  const statusVariant = {
    approved: "secondary",
    pending: "warning",
    rejected: "destructive",
  };

  const uploader = getUploaderName(project.uploadedBy);
  const created = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "";

  const handleVote = async (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast({ title: "Please login to vote", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });

      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();
      setThumbsUp(data.thumbsUp);
      setThumbsDown(data.thumbsDown);
      
      // Toggle vote state
      setUserVote(userVote === type ? null : type);
    } catch (err) {
      console.error(err);
      toast({ title: "Vote failed", variant: "destructive" });
    }
  };

  return (
    <Card className="p-6 hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-slate-800 hover:-translate-y-1 hover-lift">
      <Link href={`/project/${projectId}`} className="block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{title}</h3>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
              {uploader} • {created}
            </div>
          </div>
          <Badge className={`${
            status === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 
            status === 'pending' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 
            'bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          } border px-3 py-1 font-semibold text-xs`}>{String(status).charAt(0).toUpperCase() + String(status).slice(1)}</Badge>
        </div>

        <p className="text-sm text-foreground/70 mb-4 line-clamp-2 leading-relaxed">{description}</p>

        {/* Image Gallery */}
        <div className="mb-4">
          <ImageGallery files={project.files} projectId={projectId} maxShow={3} isDetailView={false} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                #{tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                +{tags.length - 2}
              </Badge>
            )}
          </div>

          <div className="text-xs font-medium text-muted-foreground">
            {project.files?.length ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                📎 {project.files.length} file{project.files.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                📄 No files
              </span>
            )}
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => handleVote("up", e)}
          className={`flex items-center gap-1 transition-all duration-200 ${
            userVote === "up" 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700' 
              : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          👍 <span className="font-semibold">{thumbsUp}</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => handleVote("down", e)}
          className={`flex items-center gap-1 transition-all duration-200 ${
            userVote === "down" 
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700' 
              : 'hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400'
          }`}
        >
          👎 <span className="font-semibold">{thumbsDown}</span>
        </Button>
      </div>
    </Card>
  );
}
