import { useEffect, useState } from 'react';

// Use the drawer navigation on phones and tablets. The full sidebar is only
// available when there is enough room for it without squeezing page content.
const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        mql.addEventListener('change', onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

        return () => mql.removeEventListener('change', onChange);
    }, []);

    return !!isMobile;
}
