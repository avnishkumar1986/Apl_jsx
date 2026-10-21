import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    [key: string]: string | boolean | number | null;
    email: string;
    password: string;
    latitude: number | null;
    longitude: number | null;
    location_name: string;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, transform, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        latitude: null,
        longitude: null,
        location_name: '',
    });
    const [locating, setLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState<string | null>(null);

    const completeLogin = (location?: { latitude: number; longitude: number; locationName: string }) => {
        transform((currentData) => ({
            ...currentData,
            latitude: location?.latitude ?? null,
            longitude: location?.longitude ?? null,
            location_name: location?.locationName ?? '',
        }));
        post(route('login'), {
            onFinish: () => {
                reset('password');
                setLocating(false);
            },
        });
    };

    const continueWithoutLocation = (message: string) => {
        setLocationMessage(message);
        completeLogin();
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setLocating(true);
        setLocationMessage(null);

        if (!window.isSecureContext) {
            continueWithoutLocation('Location is unavailable on an insecure connection. Use HTTPS in production.');
            return;
        }

        if (!navigator.geolocation) {
            continueWithoutLocation('Location is not supported by this browser. Login will continue without it.');
            return;
        }

        if (navigator.permissions) {
            try {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                if (permission.state === 'denied') {
                    continueWithoutLocation('Location permission is blocked. Login will continue without it.');
                    return;
                }
            } catch {
                // Some browsers expose Permissions API without supporting geolocation queries.
            }
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                let locationName = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1&accept-language=en`,
                    );
                    const result = (await response.json()) as {
                        display_name?: string;
                        address?: { city?: string; town?: string; village?: string; county?: string; state?: string; country?: string };
                    };
                    const locality = result.address?.city ?? result.address?.town ?? result.address?.village ?? result.address?.county;
                    locationName =
                        [locality, result.address?.state, result.address?.country].filter(Boolean).join(', ') || result.display_name || locationName;
                } catch {
                    locationName = `Coordinates: ${locationName}`;
                }

                completeLogin({ latitude: coords.latitude, longitude: coords.longitude, locationName });
            },
            (error) => {
                const message =
                    error.code === error.PERMISSION_DENIED
                        ? 'Location permission was denied. Login will continue without it.'
                        : error.code === error.TIMEOUT
                          ? 'Location request timed out. Login will continue without it.'
                          : 'Your location could not be determined. Login will continue without it.';

                continueWithoutLocation(message);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
        );
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <a
                href={route('auth.microsoft.redirect')}
                className="flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/40 hover:text-[#0b6f9f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
                <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
                    <span className="size-2.5 bg-[#f25022]" />
                    <span className="size-2.5 bg-[#7fba00]" />
                    <span className="size-2.5 bg-[#00a4ef]" />
                    <span className="size-2.5 bg-[#ffb900]" />
                </span>
                Continue with Microsoft 365
            </a>

            {(errors as Record<string, string>).sso && <InputError message={(errors as Record<string, string>).sso} />}

            <div className="relative my-5 sm:my-7">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] font-semibold tracking-[0.08em] uppercase">
                    <span className="bg-white px-4 text-slate-400 dark:bg-slate-900">Or use your password</span>
                </div>
            </div>

            <form className="flex flex-col gap-5 sm:gap-6" onSubmit={submit}>
                <div className="grid gap-5 sm:gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="username"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            className="focus-visible:border-brand-teal focus-visible:ring-brand-aqua/30 h-11 rounded-lg border-slate-200 bg-white px-4 shadow-sm shadow-slate-900/[0.02]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            className="focus-visible:border-brand-teal focus-visible:ring-brand-aqua/30 h-11 rounded-lg border-slate-200 bg-white px-4 shadow-sm shadow-slate-900/[0.02]"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <Button
                        type="submit"
                        className="bg-brand-teal hover:bg-brand-plum mt-3 h-11 w-full rounded-lg font-semibold text-white transition"
                        tabIndex={3}
                        disabled={processing || locating}
                    >
                        {(processing || locating) && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {locating && !processing ? 'Getting location...' : 'Log in'}
                    </Button>
                </div>

                <p className="text-muted-foreground text-center text-xs">Access is monitored and restricted by your assigned role.</p>
                {locationMessage && (
                    <p role="status" aria-live="polite" className="text-center text-xs text-amber-700 dark:text-amber-400">
                        {locationMessage}
                    </p>
                )}
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
