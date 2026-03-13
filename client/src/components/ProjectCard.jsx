// ProjectCard.jsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getUploaderName } from "@/lib/uploader";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectCard({ project, currentUser }) {
  const [thumbsUp, setThumbsUp] = useState(project.thumbsUp || 0);
  const [thumbsDown, setThumbsDown] = useState(project.thumbsDown || 0);
  const { toast } = useToast();

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
      const res = await fetch(`/api/projects/${project._id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });

      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();
      setThumbsUp(data.thumbsUp);
      setThumbsDown(data.thumbsDown);
    } catch (err) {
      console.error(err);
      toast({ title: "Vote failed", variant: "destructive" });
    }
  };

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-white hover:-translate-y-1 cursor-pointer">
      <Link href={`/project/${project._id || project.id}`} className="block">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">{title}</h3>
            <div className="text-sm text-gray-500 mt-1">by {uploader} • {created}</div>
          </div>
          <Badge className={`${
            status === 'approved' ? 'bg-green-500' : 
            status === 'pending' ? 'bg-yellow-500' : 
            'bg-red-500'
          } text-white px-3 py-1`}>{String(status).toUpperCase()}</Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-2">{description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {project.files?.length ? (
              <div className="flex items-center gap-2">
                <span>{project.files.length} file{project.files.length > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <span>No files</span>
            )}
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-2 pt-3 border-t">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => handleVote("up", e)}
          className="flex items-center gap-1 hover:bg-green-50 hover:text-green-600"
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">{thumbsUp}</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => handleVote("down", e)}
          className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600"
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="text-sm font-medium">{thumbsDown}</span>
        </Button>
      </div>
    </Card>
  );
}
