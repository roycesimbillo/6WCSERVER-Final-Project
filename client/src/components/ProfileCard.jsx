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

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl" data-testid="card-profile">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="h-24 w-24 ring-4 ring-blue-100">
          {userProfile?.profilePicture?.path && (
            <AvatarImage src={userProfile.profilePicture.path} alt={user?.name} />
          )}
          <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">{initials}</AvatarFallback>
        </Avatar>

        <div className="w-full">
          <h3 className="text-xl font-semibold" data-testid="text-user-name">
            {userProfile?.name || user?.name}
          </h3>
          <Badge variant="secondary" className="mt-2" data-testid="badge-user-role">
            {isTeacher(user) ? "Teacher" : "Student"}
          </Badge>
          {userProfile?.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {userProfile.bio}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full pt-4 border-t">
          <div>
            <div className="text-2xl font-bold" data-testid="text-projects-count">
              {stats.projectsCount}
            </div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600" data-testid="text-rating-count">
              {stats.rating}
            </div>
            <div className="text-xs text-muted-foreground">👍</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalThumbsDown}
            </div>
            <div className="text-xs text-muted-foreground">👎</div>
          </div>
        </div>

        <Link href="/profile" className="w-full">
          <Button variant="outline" className="w-full" data-testid="button-view-profile">
            View Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}