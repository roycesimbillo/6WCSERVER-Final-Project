import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel({ currentUser }) {
  const { toast } = useToast();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchPending = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/projects?status=pending", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch pending projects");

        const data = await res.json();
        setPendingProjects(data || []);
      } catch (err) {
        console.error("Error fetching pending projects:", err);
        toast({
          title: "Error",
          description: "Could not load pending projects.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [currentUser?.id]);

  const handleUpdateStatus = async (projectId, status) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update project status");
      const data = await res.json();

      setPendingProjects((prev) => prev.filter((p) => p._id !== projectId));

      toast({
        title: status === "approved" ? "Project Approved" : "Project Rejected",
        description: `Project has been ${status}.`,
        variant: status === "approved" ? "default" : "destructive",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not update project status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentUser={currentUser} pendingCount={pendingProjects.length} />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Pending Approvals</h1>
            <Badge variant="secondary">{pendingProjects.length} Pending</Badge>
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading pending projects...</p>
            </Card>
          ) : pendingProjects.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending projects to review.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingProjects.map((project) => (
                <Card key={project._id} className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar>
                      <AvatarFallback>
                        {project.author?.split(" ").map((n) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">
                        <Link href={`/project/${project._id}`} className="underline">
                          {project.title || "Untitled"}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {project.author || "Unknown"}
                      </p>
                      <Badge variant="secondary" className="mt-2">{project.course || "General"}</Badge>
                      <p className="text-foreground mt-2">{project.description || ""}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.tags?.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={() => handleUpdateStatus(project._id, "approved")}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(project._id, "rejected")}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
