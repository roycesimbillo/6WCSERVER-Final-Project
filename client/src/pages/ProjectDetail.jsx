import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Sidebar from "@/components/Sidebar";
import ImageGallery from "@/components/ImageGallery";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      setUserVote(userVote === type ? null : type);

      toast({
        title: userVote === type ? "Vote removed" : (type === "up" ? "Thumbs up!" : "Thumbs down!"),
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
      <div className="flex h-screen items-center justify-center text-muted-foreground bg-gradient-modern">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Loading project...</div>
          <div className="animate-pulse">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-modern">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <Card className="p-8 shadow-xl border border-card-border/50 animate-fadeInUp">
            {/* Project Header */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-card-border/30">
              <Avatar className="h-16 w-16 border-4 border-primary shadow-md">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-secondary text-white">
                  {project.author?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gradient mb-3">{project.title}</h1>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 hover-lift">
                    <User className="h-5 w-5 text-primary" /> <span className="font-medium">{project.author || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-secondary" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Course + Tags */}
            <div className="mb-8">
              <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 py-1 px-3 text-sm">{project.course || "General"}</Badge>
              <div className="flex flex-wrap gap-3 mt-4">
                {project.tags?.map((tag, idx) => (
                  <Badge key={tag} variant="outline" className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition hover-lift" style={{animationDelay: `${idx * 50}ms`}}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 p-6 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/5">
              <h2 className="text-xl font-semibold mb-3 text-gradient">Description</h2>
              <p className="text-base leading-relaxed text-foreground/90">{project.description}</p>
            </div>

            {/* Image Gallery - Show all images */}
            {project.files?.some(f => {
              const ext = f.name?.toLowerCase().split('.').pop();
              return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            }) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gradient">Project Images</h2>
                <ImageGallery files={project.files} projectId={project.id || project._id} isDetailView={true} />
              </div>
            )}

            {/* Files */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gradient">Project Files</h2>
              {project.files && project.files.length > 0 ? (
                <div className="space-y-3">
                  {project.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10 hover:border-primary/30 transition hover-lift" style={{animationDelay: `${index * 50}ms`}}>
                      <div>
                        <div className="font-semibold">{file.name}</div>
                        <div className="text-sm text-muted-foreground">{file.size} bytes</div>
                      </div>
                      <Button size="sm" variant="outline" type="button" onClick={() => handleDownload(file)} className="btn-gradient-cyan text-white border-0">
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 text-center">No files attached</div>
              )}
            </div>

            {/* Votes */}
            <div className="flex gap-4 mb-8 pb-8 border-b border-card-border/30">
              <Button 
                variant={userVote === "up" ? "default" : "outline"} 
                onClick={() => handleVote("up")}
                className={userVote === "up" ? "btn-gradient text-white border-0" : "hover-lift transition"}
              >
                <ThumbsUp className="h-4 w-4 mr-2" /> {project.thumbsUp}
              </Button>
              <Button 
                variant={userVote === "down" ? "destructive" : "outline"} 
                onClick={() => handleVote("down")}
                className={userVote === "down" ? "btn-gradient-orange text-white border-0" : "hover-lift transition"}
              >
                <ThumbsDown className="h-4 w-4 mr-2" /> {project.thumbsDown}
              </Button>
            </div>

            {/* Comments */}
            <div className="animate-fadeInUp">
              <h2 className="text-xl font-semibold mb-6 text-gradient">Comments ({comments.length})</h2>
              <div className="mb-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-primary/10">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="border-primary/20 focus:border-primary resize-none"
                />
                <Button className="mt-3 btn-gradient text-white border-0" onClick={handleAddComment} disabled={!newComment.trim()}>
                  Add Comment
                </Button>
              </div>
              <div className="space-y-4">
                {comments.map((c, idx) => (
                  <Card key={c.id || c._id} className="p-5 border border-card-border/50 hover:border-primary/30 transition hover-lift animate-fadeInUp" style={{animationDelay: `${idx * 50}ms`}}>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/50 to-secondary/50 text-white">
                          {c.author?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground">{c.author}</span>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
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
