type UploadedBy =
  | string
  | {
      name?: string;
      email?: string;
      _id?: any;
      $oid?: string;
      [key: string]: any;
    }
  | null
  | undefined;

export function getUploaderName(uploadedBy: UploadedBy): string {
  if (!uploadedBy) return "Unknown";
  if (typeof uploadedBy === "string") return uploadedBy;
  if (typeof uploadedBy === "object") {
    if (uploadedBy.name) return String(uploadedBy.name);
    if (uploadedBy.email) return String(uploadedBy.email);
    if (uploadedBy._id) return String(uploadedBy._id);
    if ((uploadedBy as any).$oid) return String((uploadedBy as any).$oid);
    try {
      const s = JSON.stringify(uploadedBy);
      return s.length > 0 ? s.slice(0, 24) : "Unknown";
    } catch (e) {
      return "Unknown";
    }
  }
  return String(uploadedBy);
}

export default getUploaderName;
