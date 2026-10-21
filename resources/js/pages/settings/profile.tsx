import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    FileBadge,
    GraduationCap,
    KeyRound,
    Mail,
    MapPin,
    Phone,
    Printer,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';

type EmployeeProfile = {
    employee_id: string | null;
    gender: string | null;
    marital_status: string | null;
    date_of_birth: string | null;
    anniversary_date: string | null;
    status: boolean;
    photo_url: string | null;
    company: string | null;
    sitting_location: string | null;
    department: string | null;
    designation: string | null;
    roles: string[];
    contacts: Array<{ id: number; type: string; value: string; primary: boolean; verified: boolean }>;
    addresses: Array<{ id: number; type: string; lines: string; location: string; latitude: number | null; longitude: number | null }>;
    educations: Array<{
        id: number;
        level: string | null;
        degree: string | null;
        institution: string | null;
        university: string | null;
        grade: string | null;
        period: string;
    }>;
};

type ProfileTab = 'personal' | 'contact' | 'address' | 'education' | 'login';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Profile', href: '/settings/profile' }];
const profileTabs: Array<{ id: ProfileTab; label: string; icon: typeof UserRound }> = [
    { id: 'personal', label: 'Personal & employment', icon: UserRound },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'address', label: 'Address & map', icon: MapPin },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'login', label: 'Login', icon: KeyRound },
];

export default function Profile({ employeeProfile }: { employeeProfile: EmployeeProfile }) {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
    const [photoUploading, setPhotoUploading] = useState(false);
    const primaryPhone =
        employeeProfile.contacts.find((contact) => contact.type !== 'Email' && contact.primary) ??
        employeeProfile.contacts.find((contact) => contact.type !== 'Email');
    const initials =
        auth.user.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'U';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee profile" />
            <SettingsLayout>
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_55px_-32px_rgba(15,23,42,.45)] print:rounded-none print:shadow-none">
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#062f3f] via-[#075c70] to-[#0f8fa5] sm:h-36 print:hidden">
                        <img
                            src="/images/profile-hero-apl-apollo.png"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 size-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#032b3c]/95 via-[#063d50]/75 to-transparent" />
                        <div className="absolute top-4 right-5 rounded-xl border border-white/15 bg-slate-950/45 px-3 py-2 shadow-lg backdrop-blur-sm sm:top-5 sm:right-7">
                            <img src="/apl-apollo-logo-transparent.png" alt="APL Apollo Steel Pipes" className="h-8 w-auto object-contain sm:h-10" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 to-transparent px-6 pt-12 pb-5 sm:px-8">
                            <p className="text-[11px] font-bold tracking-[0.24em] text-cyan-200 uppercase">APL Connect · Employee Directory</p>
                            <p className="mt-1 max-w-xl text-sm text-white/80">Profile, employment and access information in one secure place.</p>
                        </div>
                    </div>
                    <div className="relative px-5 sm:px-8">
                        <div className="flex flex-col gap-4 pt-5 pb-6 sm:flex-row sm:items-end sm:gap-5 sm:pt-6">
                            <div className="relative -mt-10 size-20 shrink-0 sm:-mt-12 sm:size-24">
                                <div className="grid size-full place-items-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-cyan-50 to-white text-xl font-black text-cyan-700 shadow-xl">
                                    {employeeProfile.photo_url ? (
                                        <img src={employeeProfile.photo_url} alt={auth.user.name} className="size-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <label
                                    className={`absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-white bg-cyan-700 text-lg leading-none font-bold text-white shadow-lg transition hover:bg-cyan-800 ${photoUploading ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
                                    title="Upload profile photo"
                                    aria-label="Upload profile photo"
                                >
                                    <span aria-hidden="true">+</span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="sr-only"
                                        disabled={photoUploading}
                                        onChange={(event) => {
                                            const photo = event.target.files?.[0];
                                            if (!photo) return;

                                            setPhotoUploading(true);
                                            router.post(
                                                '/settings/profile/photo',
                                                { photo },
                                                {
                                                    forceFormData: true,
                                                    preserveScroll: true,
                                                    onFinish: () => {
                                                        setPhotoUploading(false);
                                                        event.target.value = '';
                                                    },
                                                },
                                            );
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="min-w-0 flex-1 pb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{auth.user.name}</h1>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${employeeProfile.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        {employeeProfile.status ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                                        Employee ID: {employeeProfile.employee_id || 'Not assigned'}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {[employeeProfile.designation, employeeProfile.department, employeeProfile.company].filter(Boolean).join(' · ') ||
                                        employeeProfile.roles.join(', ') ||
                                        'Employee'}
                                </p>
                                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                    <MapPin className="size-3.5 text-cyan-600" />
                                    {employeeProfile.sitting_location || 'Location not assigned'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 print:hidden"
                            >
                                <Printer className="size-4" />
                                Print profile
                            </button>
                        </div>
                        <div className="-mx-5 overflow-x-auto border-t border-slate-100 bg-slate-50/70 px-5 sm:-mx-8 sm:px-8 print:hidden">
                            <nav className="flex min-w-[680px] gap-2 py-3" aria-label="Employee profile sections">
                                {profileTabs.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setActiveTab(id)}
                                        className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${activeTab === id ? 'border-cyan-200 bg-white text-cyan-800 shadow-sm' : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-800'}`}
                                    >
                                        <Icon className={`size-4 shrink-0 ${activeTab === id ? 'text-cyan-600' : 'text-slate-400'}`} />
                                        <span className="truncate">{label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </section>

                {activeTab === 'personal' && (
                    <div className="grid gap-6">
                        <ProfilePanel
                            icon={UserRound}
                            title="Personal information"
                            description="Manage your account details and review your User Master record"
                        >
                            <form className="space-y-5" aria-label="Personal and employment profile">
                                <FormSection title="Account details" description="Account and sign-in identity information" badge="View only">
                                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                        <ReadonlyProfileField label="Full name" icon={UserRound} value={auth.user.name} />
                                        <ReadonlyProfileField label="Email address" icon={Mail} value={auth.user.email} />
                                        <ReadonlyProfileField
                                            label="Employee ID"
                                            icon={FileBadge}
                                            value={employeeProfile.employee_id}
                                            empty="Not assigned"
                                        />
                                        <ReadonlyProfileField label="Gender" icon={UserRound} value={employeeProfile.gender} capitalize />
                                        <ReadonlyProfileField
                                            label="Marital status"
                                            icon={BadgeCheck}
                                            value={employeeProfile.marital_status}
                                            capitalize
                                        />
                                        <ReadonlyProfileField label="Date of birth" icon={CalendarDays} value={employeeProfile.date_of_birth} />
                                        <ReadonlyProfileField label="Anniversary date" icon={CalendarDays} value={employeeProfile.anniversary_date} />
                                        <ReadonlyProfileField
                                            label="Account status"
                                            icon={ShieldCheck}
                                            value={employeeProfile.status ? 'Active' : 'Inactive'}
                                            success={employeeProfile.status}
                                        />
                                    </div>
                                </FormSection>
                                <FormSection
                                    title="Employment information"
                                    description="Current organisation assignment maintained in User Master"
                                    badge="Read only"
                                >
                                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                        <ReadonlyProfileField label="Company" icon={Building2} value={employeeProfile.company} />
                                        <ReadonlyProfileField label="Sitting location" icon={MapPin} value={employeeProfile.sitting_location} />
                                        <ReadonlyProfileField label="Department" icon={BriefcaseBusiness} value={employeeProfile.department} />
                                        <ReadonlyProfileField label="Designation" icon={BriefcaseBusiness} value={employeeProfile.designation} />
                                        <ReadonlyProfileField label="Assigned roles" icon={ShieldCheck} value={employeeProfile.roles.join(', ')} />
                                    </div>
                                </FormSection>
                            </form>
                        </ProfilePanel>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <ProfilePanel icon={Phone} title="Contact details" description="Email addresses and phone numbers maintained in User Master">
                        <form className="space-y-5" aria-label="Contact profile">
                            <FormSection
                                title="Contact information"
                                description="Primary contact details maintained against your employee record"
                                badge="Read only"
                            >
                                <div className="grid gap-5 md:grid-cols-2">
                                    <ReadonlyProfileField label="Phone number" icon={Phone} value={primaryPhone?.value} empty="No phone number" />
                                    <ReadonlyProfileField label="Primary email" icon={Mail} value={auth.user.email} />
                                </div>
                            </FormSection>
                        </form>
                    </ProfilePanel>
                )}

                {activeTab === 'address' && (
                    <ProfilePanel icon={MapPin} title="Addresses & map" description="Current and permanent address records">
                        {employeeProfile.addresses.length ? (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {employeeProfile.addresses.map((address) => (
                                    <AddressCard key={address.id} address={address} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState text="No addresses have been added." />
                        )}
                    </ProfilePanel>
                )}

                {activeTab === 'education' && (
                    <ProfilePanel icon={GraduationCap} title="Education" description="Qualifications, institutions and grades">
                        {employeeProfile.educations.length ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {employeeProfile.educations.map((education) => (
                                    <div key={education.id} className="rounded-xl border border-slate-200 p-5">
                                        <p className="font-bold text-slate-900">{education.degree || education.level || 'Qualification'}</p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {education.institution || education.university || 'Institution not provided'}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                                            {education.period && <span className="rounded-full bg-slate-100 px-2.5 py-1">{education.period}</span>}
                                            {education.grade && (
                                                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">Grade: {education.grade}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState text="No education details have been added." />
                        )}
                    </ProfilePanel>
                )}

                {activeTab === 'login' && (
                    <ProfilePanel icon={KeyRound} title="Login & access" description="Read-only account identity, status and access roles">
                        <form className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Login and access profile">
                            <ReadonlyProfileField label="Login email" icon={Mail} value={auth.user.email} />
                            <ReadonlyProfileField
                                label="Account status"
                                icon={ShieldCheck}
                                value={employeeProfile.status ? 'Active' : 'Inactive'}
                                success={employeeProfile.status}
                            />
                            <ReadonlyProfileField label="Assigned roles" icon={ShieldCheck} value={employeeProfile.roles.join(', ')} />
                        </form>
                    </ProfilePanel>
                )}
            </SettingsLayout>
        </AppLayout>
    );
}

function ProfilePanel({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: typeof UserRound;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,.45)] print:break-inside-avoid print:rounded-none print:shadow-none">
            <header className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 sm:px-6">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-black tracking-tight text-slate-900">{title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                </div>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}
function FormSection({ title, description, badge, children }: { title: string; description: string; badge?: string; children: React.ReactNode }) {
    return (
        <fieldset className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:break-inside-avoid print:rounded-none print:shadow-none">
            <legend className="sr-only">{title}</legend>
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                </div>
                {badge && (
                    <span className="bg-brand-aqua/10 text-brand-teal w-fit rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase">
                        {badge}
                    </span>
                )}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </fieldset>
    );
}
function ReadonlyProfileField({
    label,
    icon: Icon,
    value,
    empty = 'Not provided',
    capitalize = false,
    success = false,
}: {
    label: string;
    icon: typeof UserRound;
    value: string | null | undefined;
    empty?: string;
    capitalize?: boolean;
    success?: boolean;
}) {
    const fieldId = `profile-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    return (
        <div className="min-w-0">
            <Label htmlFor={fieldId} className="text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">
                {label}
            </Label>
            <div className="relative mt-2">
                <Icon
                    className={`pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 ${success ? 'text-emerald-500' : 'text-cyan-700'}`}
                />
                <input
                    id={fieldId}
                    type="text"
                    readOnly
                    value={value || empty}
                    className={`h-11 w-full cursor-default rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-10 text-sm font-semibold shadow-sm outline-none print:rounded-none print:bg-white print:shadow-none ${capitalize ? 'capitalize' : ''} ${success ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700' : value ? 'text-slate-800' : 'text-slate-400'}`}
                />
            </div>
        </div>
    );
}
function AddressCard({ address }: { address: EmployeeProfile['addresses'][number] }) {
    return (
        <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-brand-teal text-xs font-bold tracking-wide uppercase">{address.type} address</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{address.lines || '—'}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{address.location || 'Location not provided'}</p>
            {address.latitude && address.longitude && (
                <a
                    className="text-brand-teal mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                >
                    <MapPin className="size-3.5" /> View on map
                </a>
            )}
        </div>
    );
}
function EmptyState({ text }: { text: string }) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">{text}</div>;
}
