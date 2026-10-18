/* prettier-ignore */
import {
createInertiaApp
} from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const corePages = import.meta.glob('./pages/**/*.tsx', {
                eager: true,
            });
            const modulePages = Object.fromEntries(
                Object.entries(import.meta.glob('../../Modules/**/Resources/js/Pages/**/*.tsx', { eager: true })).map(([path, page]) => {
                    const [, moduleName, pageName] = path.match(/^\.\.\/\.\.\/Modules\/([^/]+)\/Resources\/js\/Pages\/(.+)\.tsx$/) ?? [];

                    return [`./pages/modules/${moduleName.toLowerCase()}/${pageName.toLowerCase()}.tsx`, page];
                }),
            );
            const pages = { ...corePages, ...modulePages };

            return pages[`./pages/${name}.tsx`];
        },
        // prettier-ignore
        setup: ({ App, props }) => <App {...props} />,
    }),
);
