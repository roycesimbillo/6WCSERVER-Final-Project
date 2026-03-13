import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, Trash, Edit, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";
import { isTeacher } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

export default function Profile({ currentUser }) {
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const { toast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", bio: "" });

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/projects?userId=${currentUser.id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setMyProjects(data || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setUserProfile(data);
        setProfileForm({ name: data.name || "", bio: data.bio || "" });
      } catch (err) {
        console.warn("Could not fetch user profile", err);
      }
    };

    const fetchResumes = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}/resumes`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setResumes(data || []);
      } catch (err) {
        console.warn("Could not fetch resumes", err);
      }
    };

    fetchProjects();
    fetchUserProfile();
    fetchResumes();
  }, [currentUser?.id]);

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Delete failed");
      }

      setMyProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({ title: "Success", description: "Project deleted successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (project) => {
    setEditProject({ ...project });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
  if (!editProject?.id) return;

  try {
    const res = await fetch(`/api/projects/${editProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: editProject.title,
        description: editProject.description,
        course: editProject.course,
        tags: editProject.tags || [],
      }),
    });

    const text = await res.text(); // get raw text in case it's HTML
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON in update response:", text);
      alert("Error: server did not return valid JSON");
      return;
    }

    if (!res.ok) throw new Error(data.message || "Update failed");

    // ✅ update UI with the new project data
    setMyProjects((prev) =>
      prev.map((p) => (p.id === editProject.id ? data.project : p))
    );

    alert("Project updated successfully");
    setIsEditing(false);
  } catch (err) {
    console.error("Error saving edit:", err);
    alert(err.message);
  }
};

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("profilePicture", file);
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile-picture`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast({ title: "Profile picture updated" });
      setUserProfile({ ...userProfile, profilePicture: data.profilePicture });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleResumesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach(file => form.append("resumes", file));
    try {
      const res = await fetch(`/api/users/${currentUser.id}/resumes`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast({ title: `${files.length} resume(s) uploaded` });
      setResumes(data.resumes);
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleDeleteResume = async (index) => {
    if (!confirm("Delete this resume?")) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/resumes/${index}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();
      toast({ title: "Resume deleted" });
      setResumes(data.resumes);
    } catch (err) {
      console.error(err);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      toast({ title: "Profile updated" });
      setUserProfile({ ...userProfile, ...data.user });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const filteredProjects = (status) => {
    if (status === "all") return myProjects;
    return myProjects.filter((p) => p.status === status);
  };

  const approvedProjects = filteredProjects("approved");
  const pendingProjects = filteredProjects("pending");
  const rejectedProjects = filteredProjects("rejected");

  return (
    <div className="flex h-screen bg-gradient-modern">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto space-y-8">
          {/* PROFILE CARD */}
          <Card className="p-8 flex items-start gap-8 shadow-lg hover-lift border border-card-border animate-fadeInUp">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
                {userProfile?.profilePicture?.path && (
                  <AvatarImage src={userProfile.profilePicture.path} alt="Profile" />
                )}
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {userProfile?.name?.split(" ").map((n) => n[0]).join("") || currentUser?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <input
                id="profile-pic-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => document.getElementById("profile-pic-input").click()}
                className="btn-gradient-orange text-white border-0"
              >
                <Upload className="h-3 w-3 mr-1" /> Upload Photo
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold text-gradient">{userProfile?.name || currentUser?.name}</h1>
                <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(true)} className="btn-gradient">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="secondary" className="mb-4 bg-secondary text-secondary-foreground font-semibold">
                {isTeacher(currentUser) ? "Teacher" : "Student"}
              </Badge>
              {userProfile?.bio && (
                <p className="text-muted-foreground mb-6 text-lg">{userProfile.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-6 mb-8 p-4 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <div className="text-center hover-lift transition">
                  <div className="text-4xl font-bold text-primary">{myProjects.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Projects</div>
                </div>
                <div className="text-center hover-lift transition">
                  <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">{approvedProjects.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">Approved</div>
                </div>
                <div className="text-center hover-lift transition">
                  <div className="text-4xl font-bold text-accent">
                    {myProjects.reduce((sum, p) => sum + (p.thumbsUp || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Total Likes</div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">📄</span>
                    Resumes
                  </h3>
                  <input
                    id="resumes-input"
                    type="file"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    multiple
                    onChange={handleResumesUpload}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("resumes-input").click()} className="btn-gradient-cyan text-white border-0">
                      <Upload className="h-4 w-4 mr-2" /> Upload Resumes
                    </Button>
                    {resumes.map((resume, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/60 px-4 py-2 rounded-lg hover:bg-muted transition shadow-sm hover-lift">
                        <a
                          href={resume.path}
                          download={resume.name}
                          className="text-sm font-medium hover:text-primary transition"
                        >
                          {resume.name}
                        </a>
                        <button
                          onClick={() => handleDeleteResume(idx)}
                          className="text-destructive hover:text-destructive/80 transition"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* PROJECTS */}
          <div className="animate-fadeInUp animation-delay-200">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-md">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All ({myProjects.length})</TabsTrigger>
                <TabsTrigger value="approved" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">Approved ({approvedProjects.length})</TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Pending ({pendingProjects.length})</TabsTrigger>
                <TabsTrigger value="rejected" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Rejected ({rejectedProjects.length})</TabsTrigger>
              </TabsList>

              {["all", "approved", "pending", "rejected"].map((status) => (
                <TabsContent key={status} value={status} className="mt-6 space-y-4">
                  {loading && <p className="text-muted-foreground text-center py-8 animate-pulse">Loading projects...</p>}
                  {!loading && filteredProjects(status).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-lg">No projects found for this category.</p>
                    </div>
                  )}
                  {!loading &&
                    filteredProjects(status).map((project, idx) => (
                      <Card key={project.id} className="p-5 hover:shadow-lg transition-all duration-300 hover-lift border border-card-border/50 animate-fadeInUp" style={{animationDelay: `${idx * 50}ms`}}>
                        <div className="flex justify-between items-start gap-4">
                          <Link href={`/project/${project.id}`} className="block flex-1 hover:no-underline">
                            <h3 className="text-xl font-semibold text-gradient hover:text-primary transition">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {project.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="bg-primary/5 border-primary/20 hover:bg-primary/10">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </Link>

                          {project.uploadedBy === currentUser.id && (
                            <div className="flex flex-col ml-4 gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(project)}
                                className="btn-gradient"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(project.id)}
                                className="btn-gradient-orange"
                              >
                                <Trash className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* EDIT PROJECT MODAL */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-card to-card/90 border border-card-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Edit Project</DialogTitle>
          </DialogHeader>

          {editProject && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={editProject.title}
                  onChange={(e) =>
                    setEditProject({ ...editProject, title: e.target.value })
                  }
                  placeholder="Enter project title"
                  className="border-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={editProject.description}
                  onChange={(e) =>
                    setEditProject({ ...editProject, description: e.target.value })
                  }
                  placeholder="Describe your project..."
                  className="border-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Course</label>
                <Input
                  value={editProject.course}
                  onChange={(e) =>
                    setEditProject({ ...editProject, course: e.target.value })
                  }
                  placeholder="Enter course name"
                  className="border-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editProject.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-primary/20 hover:border-primary transition"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setEditProject({
                            ...editProject,
                            tags: editProject.tags.filter((_, i) => i !== index),
                          })
                        }
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add new tag..."
                    value={editProject.newTag || ""}
                    onChange={(e) =>
                      setEditProject({ ...editProject, newTag: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editProject.newTag.trim()) {
                        e.preventDefault();
                        const newTag = editProject.newTag.trim();
                        if (!editProject.tags.includes(newTag)) {
                          setEditProject({
                            ...editProject,
                            tags: [...(editProject.tags || []), newTag],
                            newTag: "",
                          });
                        }
                      }
                    }}
                    className="flex-1 border-primary/20"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const newTag = editProject.newTag?.trim();
                      if (newTag && !editProject.tags.includes(newTag)) {
                        setEditProject({
                          ...editProject,
                          tags: [...(editProject.tags || []), newTag],
                          newTag: "",
                        });
                      }
                    }}
                    className="btn-gradient"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="btn-gradient">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-card to-card/90 border border-card-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-2 block">Name</label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Enter your name"
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Bio</label>
              <Textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="btn-gradient">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
