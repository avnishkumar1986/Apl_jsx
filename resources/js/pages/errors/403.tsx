import ErrorPage from './error-page';

export default function Forbidden() {
    return (
        <ErrorPage
            status={403}
            title="Access restricted"
            description="You do not have permission to open this page. Contact your administrator if you believe access should be granted."
        />
    );
}
