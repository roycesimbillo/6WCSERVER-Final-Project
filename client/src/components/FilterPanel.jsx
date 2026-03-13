import React, { useEffect, useState } from "react";
import { courses as sharedCourses } from "@/lib/courses";

export default function FilterPanel({
  selectedCourse,
  selectedTags,
  onCourseChange,
  onTagToggle,
  onClearFilters,
}) {
  const courses = ["All", ...sharedCourses];
  const [tags, setTags] = useState(["React", "Node", "ML", "CSS", "UI"]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const res = await fetch("/api/projects/tags", { credentials: "include" });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (mounted && Array.isArray(data)) setTags(data);
      } catch (err) {
        console.warn("Could not load tags, using defaults:", err);
      } finally {
        if (mounted) setLoadingTags(false);
      }
    };

    fetchTags();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="p-4 bg-card rounded-md">
      <h2 className="text-lg font-medium mb-3">Filters</h2>

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Course</h3>
        <div className="space-y-2">
          {courses.map((c) => (
            <label key={c} className="flex items-center text-sm">
              <input
                type="radio"
                name="course"
                value={c === "All" ? "" : c}
                checked={
                  (c === "All" && !selectedCourse) || selectedCourse === c
                }
                onChange={() => onCourseChange(c === "All" ? null : c)}
                className="mr-2"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {loadingTags ? (
            <span className="text-sm text-muted-foreground">Loading tags...</span>
          ) : (
            tags.map((t) => {
              const checked = (selectedTags || []).includes(t);
              return (
                <label
                  key={t}
                  className={`px-2 py-1 rounded-md border text-sm cursor-pointer flex items-center gap-2 ${
                    checked ? "bg-primary text-primary-foreground" : "bg-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onTagToggle(t)}
                    className="mr-1"
                  />
                  {t}
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={onClearFilters}
          className="px-3 py-1 rounded-md border text-sm text-muted-foreground"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}

