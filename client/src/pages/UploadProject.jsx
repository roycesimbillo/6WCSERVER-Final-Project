import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courses } from "@/lib/courses";

export default function UploadProject({ currentUser }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    tags: [],
    files: [],
  });
  const [currentTag, setCurrentTag] = useState("");

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFormData({ ...formData, files: [...formData.files, ...newFiles] });
  };

  const handleRemoveFile = (index) => {
    setFormData({ ...formData, files: formData.files.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("course", formData.course);
    formData.tags.forEach(tag => data.append("tags", tag));
    formData.files.forEach(file => data.append("files", file));

    try {
      const res = await fetch("http://localhost:5000/api/projects/upload", {
        method: "POST",
        body: data,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const result = await res.json();
      console.log("Upload success:", result);

      toast({
        title: "Project Submitted",
        description: "Your project has been submitted for approval.",
      });
      setLocation("/");
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex h-screen bg-gradient-modern">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl mx-auto">
          <div className="mb-8 animate-fadeInDown">
            <h1 className="text-4xl font-bold text-gradient mb-2">Upload Project</h1>
            <p className="text-muted-foreground text-lg">Share your amazing work with the community</p>
          </div>

          <Card className="p-8 shadow-xl border border-card-border/50 animate-fadeInUp">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold">Project Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter project title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="input-title"
                  className="border-primary/20 focus:border-primary h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={5}
                  data-testid="textarea-description"
                  className="border-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="course" className="text-base font-semibold">Course</Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => setFormData({ ...formData, course: value })}
                >
                  <SelectTrigger data-testid="select-course" className="border-primary/20 h-11">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="tags" className="text-base font-semibold">Tags</Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    id="tags"
                    type="text"
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    data-testid="input-tag"
                    className="flex-1 border-primary/20 focus:border-primary h-10"
                  />
                  <Button type="button" onClick={handleAddTag} data-testid="button-add-tag" className="btn-gradient text-white border-0">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={tag} variant="outline" data-testid={`badge-tag-${tag}`} className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition animate-fadeInUp" style={{animationDelay: `${idx * 50}ms`}}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive transition"
                        data-testid={`button-remove-tag-${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="files" className="text-base font-semibold">Project Files</Label>
                <div className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-lg p-8 text-center transition bg-gradient-to-br from-primary/5 to-secondary/5 hover-lift cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-4">
                    Supported: Images, Documents, Code files (up to 10 files)
                  </p>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-files"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("files").click()}
                    data-testid="button-browse-files"
                    className="btn-gradient-cyan text-white border-0"
                  >
                    Browse Files
                  </Button>
                </div>

                {formData.files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold text-sm">Selected Files ({formData.files.length})</h3>
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10 hover:border-primary/30 transition animate-fadeInUp"
                        data-testid={`file-item-${index}`}
                        style={{animationDelay: `${index * 50}ms`}}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <File className="h-5 w-5 text-primary" />
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          data-testid={`button-remove-file-${index}`}
                          className="text-destructive hover:text-destructive/80 transition p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 btn-gradient text-white h-11 text-base font-semibold" data-testid="button-submit-project">
                  Submit Project
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  data-testid="button-cancel"
                  className="px-8 h-11"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
