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

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Delete parse error:", text);
        alert("Delete failed: Invalid response from server");
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setMyProjects((prev) => prev.filter((p) => p._id !== projectId));
      alert("Project deleted successfully");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleEdit = (project) => {
    setEditProject({ ...project });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
  if (!editProject?._id) return;

  try {
    const res = await fetch(`/api/projects/${editProject._id}`, {
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
      prev.map((p) => (p._id === editProject._id ? data.project : p))
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
    <div className="flex h-screen bg-background">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* PROFILE CARD */}
          <Card className="p-8 flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-32 w-32">
                {userProfile?.profilePicture?.path && (
                  <AvatarImage src={userProfile.profilePicture.path} alt="Profile" />
                )}
                <AvatarFallback className="text-4xl">
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
              >
                <Upload className="h-3 w-3 mr-1" /> Upload Photo
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{userProfile?.name || currentUser?.name}</h1>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="secondary" className="mb-4">
                {isTeacher(currentUser) ? "Teacher" : "Student"}
              </Badge>
              {userProfile?.bio && (
                <p className="text-muted-foreground mb-4">{userProfile.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold">{myProjects.length}</div>
                  <div className="text-sm text-muted-foreground">Total Projects</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{approvedProjects.length}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {myProjects.reduce((sum, p) => sum + (p.thumbsUp || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Likes</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Resumes</h3>
                  <input
                    id="resumes-input"
                    type="file"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    multiple
                    onChange={handleResumesUpload}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("resumes-input").click()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Resumes
                    </Button>
                    {resumes.map((resume, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                        <a
                          href={resume.path}
                          download={resume.name}
                          className="text-sm hover:underline"
                        >
                          {resume.name}
                        </a>
                        <button
                          onClick={() => handleDeleteResume(idx)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* PROJECTS */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({myProjects.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedProjects.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingProjects.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedProjects.length})</TabsTrigger>
              </TabsList>

              {["all", "approved", "pending", "rejected"].map((status) => (
                <TabsContent key={status} value={status} className="mt-6 space-y-4">
                  {loading && <p className="text-muted-foreground">Loading projects...</p>}
                  {!loading && filteredProjects(status).length === 0 && (
                    <p>No projects found for this category.</p>
                  )}
                  {!loading &&
                    filteredProjects(status).map((project) => (
                      <Card key={project._id} className="p-4 hover:bg-muted/50 transition">
                        <div className="flex justify-between items-start">
                          <Link href={`/project/${project._id}`} className="block flex-1">
                            <h3 className="text-lg font-semibold">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {project.tags?.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </Link>

                          {project.uploadedBy?._id === currentUser.id && (
                            <div className="flex flex-col ml-4 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(project)}
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(project._id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>

          {editProject && (
            <div className="space-y-4">
              <Input
                label="Title"
                value={editProject.title}
                onChange={(e) =>
                  setEditProject({ ...editProject, title: e.target.value })
                }
                placeholder="Enter project title"
              />

              <Textarea
                label="Description"
                value={editProject.description}
                onChange={(e) =>
                  setEditProject({ ...editProject, description: e.target.value })
                }
                placeholder="Describe your project..."
              />

              <Input
                label="Course"
                value={editProject.course}
                onChange={(e) =>
                  setEditProject({ ...editProject, course: e.target.value })
                }
                placeholder="Enter course name"
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editProject.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-muted"
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
                    className="flex-1"
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
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
