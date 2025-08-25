export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}