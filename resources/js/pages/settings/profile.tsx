import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
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
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#052f40] via-[#075a70] to-[#129cb2] sm:h-32">
                        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:42px_42px] opacity-20" />
                        <div className="absolute -top-24 -right-20 size-80 rounded-full border-[52px] border-white/10" />
                        <div className="absolute -bottom-28 left-1/3 size-64 rounded-full border-[40px] border-amber-400/15" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/45 to-transparent px-6 pt-10 pb-4 sm:px-8">
                            <p className="text-xs font-bold tracking-[0.22em] text-cyan-200 uppercase">APL Connect</p>
                            <p className="mt-1 max-w-xl text-sm text-white/75">Your complete employee profile and organisation record.</p>
                        </div>
                    </div>
                    <div className="relative px-5 sm:px-8">
                        <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:gap-5">
                            <div className="-mt-9 grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-cyan-50 text-xl font-bold text-cyan-700 shadow-lg sm:-mt-10 sm:size-24">
                                {employeeProfile.photo_url ? (
                                    <img src={employeeProfile.photo_url} alt={auth.user.name} className="size-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="min-w-0 flex-1 pb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-bold text-slate-900 sm:text-3xl">{auth.user.name}</h1>
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
                            </div>
                            <div className="grid grid-cols-2 gap-x-7 gap-y-2 pb-1 text-sm sm:flex sm:gap-8">
                                <HeroFact label="Employee ID" value={employeeProfile.employee_id} />
                                <HeroFact label="Location" value={employeeProfile.sitting_location} />
                            </div>
                        </div>
                        <div className="-mx-5 overflow-x-auto border-t border-slate-100 bg-white px-5 sm:-mx-8 sm:px-8">
                            <nav className="relative flex min-w-[620px] justify-between py-4" aria-label="Employee profile sections">
                                <span className="absolute top-[31px] right-[8%] left-[8%] h-0.5 bg-slate-200" aria-hidden="true" />
                                {profileTabs.map(({ id, label }, index) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setActiveTab(id)}
                                        className={`relative z-10 flex w-32 flex-col items-center gap-2 bg-white text-center text-[11px] font-semibold transition-colors ${activeTab === id ? 'text-cyan-700' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <span
                                            className={`grid size-9 place-items-center rounded-full border-2 shadow-sm ${activeTab === id ? 'border-cyan-500 bg-white text-cyan-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="max-w-28 truncate">{label}</span>
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
                            <div className="space-y-5">
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
                            </div>
                        </ProfilePanel>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <ProfilePanel icon={Phone} title="Contact details" description="Email addresses and phone numbers maintained in User Master">
                        <div className="space-y-5">
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
                        </div>
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
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            <ReadonlyProfileField label="Login email" icon={Mail} value={auth.user.email} />
                            <ReadonlyProfileField
                                label="Account status"
                                icon={ShieldCheck}
                                value={employeeProfile.status ? 'Active' : 'Inactive'}
                                success={employeeProfile.status}
                            />
                            <ReadonlyProfileField label="Assigned roles" icon={ShieldCheck} value={employeeProfile.roles.join(', ')} />
                        </div>
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
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="bg-brand-aqua/15 text-brand-teal grid size-10 shrink-0 place-items-center rounded-xl">
                    <Icon className="size-5" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900">{title}</h2>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}
function FormSection({ title, description, badge, children }: { title: string; description: string; badge?: string; children: React.ReactNode }) {
    return (
        <fieldset className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <legend className="sr-only">{title}</legend>
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
function HeroFact({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-[9px] font-bold tracking-[0.12em] text-slate-400 uppercase">{label}</p>
            <p className="mt-0.5 max-w-40 truncate font-semibold text-slate-700">{value || '—'}</p>
        </div>
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
    return (
        <div className="min-w-0 border-b border-slate-200 pb-3">
            <Label className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">{label}</Label>
            <div className="mt-2 flex min-h-6 items-center gap-2.5">
                <Icon className={`size-4 shrink-0 ${success ? 'text-emerald-500' : 'text-brand-teal'}`} />
                <span
                    className={`truncate text-sm font-semibold ${capitalize ? 'capitalize' : ''} ${success ? 'text-emerald-700' : value ? 'text-slate-800' : 'text-slate-400'}`}
                >
                    {value || empty}
                </span>
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
