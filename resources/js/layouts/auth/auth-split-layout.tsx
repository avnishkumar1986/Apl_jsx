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

            <section className="relative hidden min-h-0 overflow-hidden bg-gradient-to-b from-[#082d4c] via-[#061d3a] to-[#031522] lg:block">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[72%] bg-[#0a3455]" />
                <img
                    src="/login-apl-apollo-pipe-v3.jpg"
                    alt="APL Apollo products and brand ambassadors"
                    width="1665"
                    height="945"
                    fetchPriority="high"
                    className="absolute inset-x-0 top-0 h-[72%] w-full object-cover object-[center_35%]"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[72%] bg-gradient-to-t from-[#031522] via-transparent to-[#031522]/10" />
                <div className="pointer-events-none absolute inset-x-0 top-[65%] h-[14%] bg-gradient-to-b from-transparent to-[#031522]" />
                <div className="absolute top-6 left-6 w-[clamp(132px,13vw,168px)] overflow-hidden rounded-2xl border border-white/15 bg-[#172432]/92 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-md xl:top-8 xl:left-8">
                    <img
                        src="/apl-apollo-trust-stats-transparent-360.png"
                        alt="APL Apollo experience, product range, and quality highlights"
                        width="360"
                        height="360"
                        className="block h-auto w-full"
                    />
                </div>
                <div className="absolute bottom-[25%] left-8 rounded-xl border border-white/15 bg-[#041827]/78 px-3.5 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur-md xl:left-10">
                    <BrandLockup tone="dark" compact orientation="horizontal" className="justify-start" />
                </div>
                <div className="absolute inset-x-0 bottom-0 px-8 pt-5 pb-7 text-white xl:px-10 xl:pb-9 2xl:px-12">
                    <div className="max-w-xl">
                        <span className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-cyan-100 uppercase">
                            <span className="bg-brand-gold h-0.5 w-8" />
                            APL Apollo Enterprise Platform
                        </span>
                        <h2 className="mt-2.5 text-[clamp(1.65rem,2.2vw,2.65rem)] leading-[1.08] font-black tracking-tight drop-shadow-lg">
                            Connected operations. <span className="text-brand-gold">Informed decisions.</span>
                        </h2>
                        <p className="mt-3 max-w-lg text-[13px] leading-5 text-white/80 drop-shadow-md">
                            Access people, procurement, sales, and business insights securely through one unified enterprise platform.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
