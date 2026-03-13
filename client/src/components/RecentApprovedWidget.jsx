import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { getUploaderName } from "@/lib/uploader";

export default function RecentApprovedWidget({ projects = [] }) {
  const display = (projects || [])
    .filter((p) => p.status === "approved")
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <Card className="p-4">
      <h4 className="font-semibold text-lg mb-2">Recent Approved Projects</h4>
      <ul className="space-y-2">
        {display.map((proj) => (
          <li key={proj._id} className="text-sm">
            <Link href={`/project/${proj._id}`} className="underline">
              {proj.title}
            </Link>
            <span className="text-muted-foreground"> by {getUploaderName(proj.uploadedBy) || proj.author || "Unknown"}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
