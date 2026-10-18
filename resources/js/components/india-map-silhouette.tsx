import { cn } from '@/lib/utils';

export function IndiaMapSilhouette({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 300 360" className={cn('pointer-events-none', className)} aria-hidden="true">
            <defs>
                <linearGradient id="india-silhouette-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
                </linearGradient>
            </defs>
            <path
                d="M91 18 119 26 142 20 163 35 188 39 203 57 232 65 247 87 232 103 211 105 218 127 204 148 190 154 184 181 170 205 163 235 150 265 138 294 128 329 114 307 105 276 88 254 79 224 62 210 66 186 49 169 55 147 40 128 50 105 68 94 65 72 78 55Z"
                fill="url(#india-silhouette-fill)"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <path d="m213 108 19 10 12 22-18 7-17-14Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="2" />
            <path
                d="M100 84 190 154M69 166l101 39M88 254l75-19M78 55l69 83 70-11M50 105l95 75 39 1M55 147l89 69 19 49M66 186l72 108M105 276l58-41M119 26l23 112M188 39l2 115"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity=".22"
            />
        </svg>
    );
}
