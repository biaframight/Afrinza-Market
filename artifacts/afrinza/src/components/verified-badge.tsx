import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function VerifiedBadge({ size = "md", className = "", showLabel = false }: VerifiedBadgeProps) {
  const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  return (
    <span
      title="Verified by Afrinza"
      className={`inline-flex items-center gap-1 shrink-0 ${className}`}
    >
      <BadgeCheck
        className={`${sizes[size]} fill-blue-500 stroke-white drop-shadow-sm`}
      />
      {showLabel && (
        <span className="text-xs font-semibold text-blue-600">Verified</span>
      )}
    </span>
  );
}
