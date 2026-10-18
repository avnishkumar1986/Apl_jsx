import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const corePages = import.meta.glob('./pages/**/*.tsx');
const modulePages = Object.fromEntries(
    Object.entries(import.meta.glob('../../Modules/**/Resources/js/Pages/**/*.tsx')).map(([path, resolver]) => {
        const [, moduleName, pageName] = path.match(/^\.\.\/\.\.\/Modules\/([^/]+)\/Resources\/js\/Pages\/(.+)\.tsx$/) ?? [];

        return [`./pages/modules/${moduleName.toLowerCase()}/${pageName.toLowerCase()}.tsx`, resolver];
    }),
);

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, { ...corePages, ...modulePages }),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
        delay: 500,
    },
});

// This will set light / dark mode on load...
initializeTheme();
