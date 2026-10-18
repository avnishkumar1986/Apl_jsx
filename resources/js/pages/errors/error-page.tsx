import { BrandLockup } from '@/components/brand-lockup';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Home, LockKeyhole, SearchX } from 'lucide-react';

interface ErrorPageProps {
    status: 403 | 404;
    title: string;
    description: string;
}

export default function ErrorPage({ status, title, description }: ErrorPageProps) {
    const Icon = status === 403 ? LockKeyhole : SearchX;

    return (
        <>
            <Head title={`${status} · ${title}`} />
            <main className="bg-background grid min-h-screen place-items-center px-5 py-10">
                <section className="border-border shadow-brand-plum/10 w-full max-w-xl overflow-hidden rounded-2xl border bg-white shadow-xl">
                    <div className="border-border border-b px-6 py-5 sm:px-8">
                        <BrandLockup orientation="horizontal" />
                    </div>
                    <div className="px-6 py-10 text-center sm:px-10 sm:py-14">
                        <div className="bg-brand-aqua/35 text-brand-plum mx-auto grid size-20 place-items-center rounded-2xl">
                            <Icon className="size-10" strokeWidth={1.6} />
                        </div>
                        <p className="text-brand-berry mt-6 text-sm font-extrabold tracking-[0.18em] uppercase">Error {status}</p>
                        <h1 className="text-brand-plum mt-2 text-3xl font-bold">{title}</h1>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => (window.history.length > 1 ? window.history.back() : router.visit('/dashboard'))}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <ArrowLeft className="size-4" /> Go back
                            </button>
                            <Link
                                href="/dashboard"
                                className="bg-brand-teal hover:bg-brand-plum inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white"
                            >
                                <Home className="size-4" /> Dashboard
                            </Link>
                        </div>
                    </div>
                    <div className="border-border border-t bg-slate-50 px-6 py-3 text-center text-[10px] tracking-wider text-slate-400 uppercase">
                        APL Connect · Authorized personnel only
                    </div>
                </section>
            </main>
        </>
    );
}
