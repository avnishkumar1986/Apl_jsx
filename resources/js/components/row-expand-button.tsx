import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function RowExpandButton({
  expanded,
  onClick,
  label,
  className,
}: {
  expanded: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      aria-expanded={expanded}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200",
        "hover:-translate-y-px hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-md",
        "focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:ring-offset-2 focus-visible:outline-none",
        expanded && "border-cyan-300 bg-cyan-50 text-cyan-700 shadow-md",
        className,
      )}
    >
      <ChevronRight
        className={cn(
          "size-4 stroke-[2.25] transition-transform duration-200",
          expanded && "rotate-90",
        )}
      />
    </button>
  );
}
