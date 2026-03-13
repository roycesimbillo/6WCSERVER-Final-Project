import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { isTeacher } from "@/lib/roles";
import { Link } from "wouter";

export default function ProfileCard({ user }) {
  const [stats, setStats] = useState({ projectsCount: 0, rating: 0, totalThumbsDown: 0 });
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}/stats`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching user stats  :", err);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setUserProfile(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    if (user?.id) {
      fetchStats();
      fetchUserProfile();
    }
  }, [user?.id]);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  // Parse profile picture if it's a JSON string
  let profilePictureUrl = null;
  if (userProfile?.profilePicture) {
    try {
      const pic = typeof userProfile.profilePicture === 'string' 
        ? JSON.parse(userProfile.profilePicture) 
        : userProfile.profilePicture;
      profilePictureUrl = pic?.path;
    } catch (e) {
      profilePictureUrl = userProfile.profilePicture?.path || null;
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-orange-500/10 dark:from-indigo-950/20 dark:via-cyan-950/20 dark:to-orange-950/20 border-indigo-200/30 dark:border-indigo-800/30 shadow-lg hover-lift" data-testid="card-profile">
      <div className="flex flex-col items-center text-center space-y-4 animate-fadeIn">
        <Avatar className="h-28 w-28 ring-4 ring-indigo-200 dark:ring-indigo-800/50 shadow-xl">
          {profilePictureUrl && (
            <AvatarImage src={profilePictureUrl} alt={user?.name} />
          )}
          <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-cyan-600 text-white">{initials}</AvatarFallback>
        </Avatar>

        <div className="w-full space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent" data-testid="text-user-name">
            {userProfile?.name || user?.name}
          </h3>
          <Badge variant="secondary" className="mt-2 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold" data-testid="badge-user-role">
            {isTeacher(user) ? "👨‍🏫 Teacher" : "👨‍🎓 Student"}
          </Badge>
          {userProfile?.bio && (
            <p className="text-sm text-foreground/60 dark:text-foreground/70 mt-3 line-clamp-2 italic">
              "{userProfile.bio}"
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full pt-6 border-t border-indigo-200 dark:border-indigo-800/30">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400" data-testid="text-projects-count">
              {stats.projectsCount}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">📁 Projects</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-rating-count">
              {stats.rating}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">👍 Likes</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.totalThumbsDown}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">👎 Dislikes</div>
          </div>
        </div>

        <Link href="/profile" className="w-full">
          <Button className="w-full btn-gradient" data-testid="button-view-profile">
            View Full Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}