// components/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import type { AssetStatus, LiveStatus } from "@prisma/client";

type Status = AssetStatus | LiveStatus;

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<Status, { variant: "default" | "destructive" | "secondary", className?: string, text: string }> = {
    ACTIVE: { variant: "default", className: "bg-green-500 hover:bg-green-600", text: "Active" },
    EXPIRED: { variant: "destructive", text: "Expired" },
    PENDING_RENEWAL: { variant: "default", className: "bg-yellow-500 hover:bg-yellow-600", text: "Pending" },
    ONLINE: { variant: "default", className: "bg-green-500 hover:bg-green-600", text: "Online" },
    OFFLINE: { variant: "destructive", text: "Offline" },
    UNKNOWN: { variant: "secondary", text: "Unknown" },
  };

  const style = statusStyles[status] || statusStyles.UNKNOWN;

  return (
    <Badge variant={style.variant} className={style.className}>
      {style.text}
    </Badge>
  );
}