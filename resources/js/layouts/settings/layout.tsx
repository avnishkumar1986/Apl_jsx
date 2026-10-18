export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <section className="min-w-0 space-y-6">{children}</section>
        </div>
    );
}
