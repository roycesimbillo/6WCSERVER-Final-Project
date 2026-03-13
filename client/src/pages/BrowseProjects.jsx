import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import ProjectCard from "@/components/ProjectCard";
import { getUploaderName } from "@/lib/uploader";

export default function BrowseProjects({ currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/projects", {
          credentials: "include",
        });

        const contentType = res.headers.get("content-type") || "";
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError("You must be logged in to view this content.");
            setProjects([]);
            return;
          }
          throw new Error(`Server returned ${res.status}`);
        }

        if (!contentType.includes("application/json")) {
          console.warn("Non-JSON response from /api/projects — likely HTML login redirect.");
          setError("Unexpected server response. Please log in again.");
          setProjects([]);
          return;
        }

        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser?.id]);

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSelectedCourse(null);
    setSelectedTags([]);
    setSearchQuery("");
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getUploaderName(p.uploadedBy).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourse = !selectedCourse || p.course === selectedCourse;
    const matchesTags =
      selectedTags.length === 0 ||
      p.tags?.some((tag) => selectedTags.includes(tag));

    return matchesSearch && matchesCourse && matchesTags;
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Browse Projects</h1>

          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects by title, author, or tags..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <FilterPanel
              selectedCourse={selectedCourse}
              selectedTags={selectedTags}
              onCourseChange={setSelectedCourse}
              onTagToggle={handleTagToggle}
              onClearFilters={handleClearFilters}
            />

            <div className="space-y-4">
              {loading && (
                <p className="text-muted-foreground">Loading projects...</p>
              )}

              {error && (
                <p className="text-destructive">
                  ⚠️ {error}
                </p>
              )}

              {!loading && !error && filteredProjects.length === 0 && (
                <p className="text-muted-foreground">No projects found.</p>
              )}

              {!loading &&
                !error &&
                filteredProjects.map((project) => (
                  <ProjectCard
                    key={project._id || project.id}
                    project={project}
                    currentUser={currentUser}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
