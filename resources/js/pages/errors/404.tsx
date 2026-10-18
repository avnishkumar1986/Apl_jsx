import ErrorPage from './error-page';

export default function NotFound() {
    return (
        <ErrorPage
            status={404}
            title="Page not found"
            description="The page you requested does not exist, may have moved, or the address may be incorrect."
        />
    );
}
