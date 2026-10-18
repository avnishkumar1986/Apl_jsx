import { BrandLockup } from './brand-lockup';

export default function AppLogo() {
    return (
        <>
            <div className="relative hidden size-10 shrink-0 items-center justify-center overflow-hidden rounded-full group-data-[collapsible=icon]:flex">
                <img src="/apl-emblem-transparent.png" alt="APL" className="size-10 object-contain" />
            </div>
            <BrandLockup
                tone="dark"
                compact
                orientation="horizontal"
                className="h-16 w-full justify-start px-1 group-data-[collapsible=icon]:hidden"
            />
        </>
    );
}
