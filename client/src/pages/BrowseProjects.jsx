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
    <div className="flex h-screen bg-gradient-modern">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8 animate-fadeInDown">
            <h1 className="text-5xl font-bold mb-2 text-gradient">Browse Projects</h1>
            <p className="text-muted-foreground text-lg">Discover amazing projects from the community</p>
          </div>

          <div className="mb-8 animate-fadeInUp">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects by title, author, or tags..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <FilterPanel
              selectedCourse={selectedCourse}
              selectedTags={selectedTags}
              onCourseChange={setSelectedCourse}
              onTagToggle={handleTagToggle}
              onClearFilters={handleClearFilters}
            />

            <div className="space-y-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-muted-foreground mb-2 animate-pulse">Loading projects...</div>
                    <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary via-secondary to-accent rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-destructive font-semibold flex items-center gap-2">
                    <span className="text-xl">⚠️</span> {error}
                  </p>
                </div>
              )}

              {!loading && !error && filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-2xl mb-2">🚀</div>
                  <p className="text-lg text-muted-foreground">No projects found.</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
                </div>
              )}

              {!loading &&
                !error &&
                filteredProjects.map((project, idx) => (
                  <div key={project._id || project.id} className="animate-fadeInUp" style={{animationDelay: `${idx * 50}ms`}}>
                    <ProjectCard
                      project={project}
                      currentUser={currentUser}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
