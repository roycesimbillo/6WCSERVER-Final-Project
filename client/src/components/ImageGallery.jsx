import { useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";

export default function ImageGallery({ files = [], projectId, maxShow = 3, isDetailView = false }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Filter only image files
  const images = files.filter(file => {
    const ext = file.name?.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });

  if (images.length === 0) return null;

  const displayImages = isDetailView ? images : images.slice(0, maxShow);
  const hasMore = !isDetailView && images.length > maxShow;
  const moreCount = images.length - maxShow;

  const handleImageClick = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const getImagePath = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${window.location.origin}${path}`;
  };

  // Grid layout for thumbnail view
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2",
  };

  const cols = Math.min(displayImages.length, 3);
  const gridClass = gridColsClass[cols] || "grid-cols-3";

  return (
    <>
      {/* Gallery Grid */}
      <div className={`grid ${gridClass} gap-2 mb-3`}>
        {displayImages.map((file, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={getImagePath(file.path)}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* +X indicator */}
        {hasMore && (
          <Link href={`/project/${projectId}`}>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:bg-muted-foreground/20 transition flex items-center justify-center cursor-pointer">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">+{moreCount}</div>
                <div className="text-xs text-muted-foreground">more</div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-2xl max-h-96" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>

            <img
              src={getImagePath(displayImages[lightboxIndex]?.path)}
              alt={displayImages[lightboxIndex]?.name}
              className="max-w-full max-h-96 rounded-lg"
            />

            {/* Navigation */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={() => setLightboxIndex((i) => (i - 1 + displayImages.length) % displayImages.length)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded"
                >
                  ← Prev
                </button>
                <span className="text-white text-sm flex items-center">
                  {lightboxIndex + 1} / {displayImages.length}
                </span>
                <button
                  onClick={() => setLightboxIndex((i) => (i + 1) % displayImages.length)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
