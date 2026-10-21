import { cn } from '@/lib/utils';

export function IndiaMapSilhouette({ className }: { className?: string }) {
    // Outline adapted from “India outline.svg” by Wikimedia Commons contributors (CC BY-SA 3.0).
    return <img src="/images/india-outline.svg" alt="" className={cn('pointer-events-none select-none', className)} aria-hidden="true" />;
}
