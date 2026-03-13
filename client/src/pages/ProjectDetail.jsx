import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Download, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetail({ currentUser }) {
  const [, params] = useRoute("/project/:id");
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    if (!params?.id) return;

    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch project");

        const data = await res.json();
        setProject(data);
        setComments(data.comments || []);

        const vote = data.votes?.find((v) => v.userId === currentUser?.id);
        setUserVote(vote?.type || null);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error loading project",
          description: "Could not fetch project details.",
          variant: "destructive",
        });
      }
    };

    fetchProject();
  }, [params?.id, currentUser?.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/projects/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: currentUser?.name || "Anonymous",
          text: newComment,
          createdAt: new Date(),
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add comment");
      const savedComment = await res.json();
      setComments([savedComment, ...comments]);
      setNewComment("");

      toast({ title: "Comment added", description: "Your comment has been posted." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (type) => {
    try {
      const res = await fetch(`/api/projects/${params.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, userId: currentUser?.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Vote failed");

      setProject((prev) => ({
        ...prev,
        thumbsUp: data.thumbsUp,
        thumbsDown: data.thumbsDown,
      }));
      setUserVote(type);

      toast({
        title: type === "up" ? "Thumbs up!" : "Thumbs down!",
        description: "Your vote has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (file) => {
    if (!file || !file.path) return;
    try {
      const backendOrigin = (window.__env__ && window.__env__.BACKEND_URL) || window.location.origin;
      const url = file.path.startsWith("http") ? file.path : `${backendOrigin}${file.path}`;
      toast({ title: "Download started", description: file.name });
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast({ title: "Download failed", description: "Opening file in a new tab instead.", variant: "destructive" });
      window.open(file.path, "_blank");
    }
  };

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading project...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl mx-auto">
          <Card className="p-8">
            {/* Project Header */}
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{project.author?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" /> {project.author || "Unknown"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Course + Tags */}
            <div className="mb-6">
              <Badge variant="secondary">{project.course || "General"}</Badge>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p>{project.description}</p>
            </div>

            {/* Files */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Project Files</h2>
              <div className="space-y-2">
                {project.files?.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">{file.size}</div>
                    </div>
                    <Button size="sm" variant="outline" type="button" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Votes */}
            <div className="flex gap-4 mb-8 pb-8 border-b">
              <Button variant={userVote === "up" ? "default" : "outline"} onClick={() => handleVote("up")}>
                <ThumbsUp className="h-4 w-4 mr-2" /> {project.thumbsUp}
              </Button>
              <Button variant={userVote === "down" ? "destructive" : "outline"} onClick={() => handleVote("down")}>
                <ThumbsDown className="h-4 w-4 mr-2" /> {project.thumbsDown}
              </Button>
            </div>

            {/* Comments */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Comments ({comments.length})</h2>
              <div className="mb-4">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button className="mt-2" onClick={handleAddComment} disabled={!newComment.trim()}>
                  Add Comment
                </Button>
              </div>
              <div className="space-y-4">
                {comments.map((c) => (
                  <Card key={c._id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{c.author?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{c.author}</span>
                          <span className="text-sm text-muted-foreground">
                            {c.createdAt ? new Date(c.createdAt).toLocaleString() : "Unknown date"}
                          </span>
                        </div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
