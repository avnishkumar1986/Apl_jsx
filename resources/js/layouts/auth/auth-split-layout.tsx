import { BrandLockup } from '@/components/brand-lockup';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh bg-white lg:h-svh lg:grid-cols-[minmax(440px,0.9fr)_minmax(0,1.1fr)] lg:overflow-hidden dark:bg-slate-950">
            <section className="relative flex min-h-svh flex-col overflow-hidden bg-[#fbfcfd] px-5 py-5 sm:px-10 sm:py-6 lg:min-h-0 lg:px-12 xl:px-16 2xl:px-20 dark:bg-slate-950">
                <div className="pointer-events-none absolute -top-32 -left-32 size-80 rounded-full bg-sky-100/40 blur-3xl" />
                <div className="bg-brand-gold/10 pointer-events-none absolute right-0 bottom-0 size-72 rounded-tl-full" />
                <div className="relative my-auto w-full max-w-[430px] self-center px-1 py-5 sm:py-7">
                    <div className="mb-6 flex flex-col items-center gap-2 text-center sm:mb-8">
                        <span className="text-brand-teal flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase">
                            <span className="bg-brand-gold h-px w-6" />
                            Account access
                        </span>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                    {children}
                </div>
                <p className="relative text-center text-[11px] text-slate-400">
                    Copyright © {new Date().getFullYear()} <span className="font-medium text-slate-500">Apollo Pipes Private Limited</span>. All
                    rights reserved.
                </p>
            </section>

            <section className="relative hidden min-h-0 overflow-hidden bg-[#061d3a] lg:block">
                <img
                    src="/login-apl-apollo-pipe-v3.jpg"
                    alt="APL Apollo products and brand ambassadors"
                    width="1665"
                    height="945"
                    fetchPriority="high"
                    className="absolute inset-0 size-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#031522]/95 via-[#031522]/5 to-[#031522]/20" />
                <div className="absolute top-[7%] left-[55%] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#041827]/65 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <img
                        src="/apl-apollo-trust-stats-transparent-360.png"
                        alt="35 plus years of trust, 3000 plus products, and top-grade materials"
                        width="360"
                        height="372"
                        loading="lazy"
                        decoding="async"
                        className="w-[clamp(135px,12vw,190px)] drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]"
                    />
                </div>
                <div className="absolute bottom-[29%] left-8 rounded-2xl border border-white/15 bg-[#041827]/72 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md xl:left-10">
                    <BrandLockup tone="dark" compact orientation="horizontal" className="justify-start" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-8 text-white xl:p-10 2xl:p-12">
                    <div className="max-w-xl">
                        <span className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-cyan-100 uppercase">
                            <span className="bg-brand-gold h-0.5 w-8" />
                            Never cracks under pressure
                        </span>
                        <h2 className="mt-3 text-[clamp(1.8rem,2.5vw,3rem)] leading-[1.05] font-black tracking-tight drop-shadow-lg">
                            One workspace. <span className="text-brand-gold">Complete control.</span>
                        </h2>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 drop-shadow-md">
                            Connect people, operations, procurement, sales, and business insights through one protected APL Apollo platform.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
