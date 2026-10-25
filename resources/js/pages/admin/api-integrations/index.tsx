import InputError from "@/components/input-error";
import { MasterDialogHeader } from "@/components/master/master-dialog-header";
import { RowExpandButton } from "@/components/row-expand-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  Activity,
  Database,
  Edit3,
  FileText,
  Globe2,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, Fragment, useEffect, useState } from "react";
type Log = {
  id: number;
  status: string;
  http_status: number | null;
  attempt: number;
  duration_ms: number | null;
  message: string | null;
  created_at: string;
};
type Api = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  api_type: "sap" | "external";
  endpoint: string | null;
  credential_username: string;
  has_credential_password: boolean;
  subscription_name: string;
  has_api_token: boolean;
  target_table: string[] | null;
  retries: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  status: boolean;
  last_run_status: string | null;
  last_run_at: string | null;
  logs: Log[];
};
type Page<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
  prev_page_url: string | null;
  next_page_url: string | null;
};
type FormData = {
  name: string;
  code: string;
  description: string;
  api_type: "sap" | "external";
  endpoint: string;
  credential_username: string;
  credential_password: string;
  subscription_name: string;
  api_token: string;
  target_table: string;
  retries: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  status: boolean;
};
const empty: FormData = {
  name: "",
  code: "",
  description: "",
  api_type: "sap",
  endpoint: "",
  credential_username: "",
  credential_password: "",
  subscription_name: "",
  api_token: "",
  target_table: "",
  retries: 3,
  retry_delay_seconds: 10,
  timeout_seconds: 30,
  status: true,
};
export default function ApiIntegrations({
  integrations,
  filters,
  pageSizeOptions,
  stats,
  canManage,
  manageableCodes,
  runnableCodes,
  credentialSourceCode,
}: {
  integrations: Page<Api>;
  filters: { search: string; per_page: number };
  pageSizeOptions: number[];
  stats: { total: number; active: number };
  canManage: boolean;
  manageableCodes: string[];
  runnableCodes: string[];
  credentialSourceCode: string;
}) {
  const [search, setSearch] = useState(filters.search),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Api | null>(null),
    [logsFor, setLogsFor] = useState<Api | null>(null),
    [expandedId, setExpandedId] = useState<number | null>(null);
  const form = useForm<FormData>(empty);
  useEffect(() => {
    const hasActiveRun = integrations.data.some(
      (a) =>
        ["queued", "running"].includes(a.last_run_status ?? "") ||
        a.logs.some((log) => ["queued", "running"].includes(log.status)),
    );
    if (!hasActiveRun) return;
    const timer = window.setInterval(
      () => router.reload({ only: ["integrations"] }),
      3000,
    );
    return () => window.clearInterval(timer);
  }, [integrations.data]);
  useEffect(() => {
    setLogsFor((current) => {
      if (!current) return current;
      return integrations.data.find((api) => api.id === current.id) ?? current;
    });
  }, [integrations.data]);
  const load = (s = search, p = filters.per_page) =>
    router.get(
      "/admin/api-integrations",
      { search: s, per_page: p },
      { preserveState: true, replace: true },
    );
  const create = () => {
    setEditing(null);
    form.setData(empty);
    form.clearErrors();
    setOpen(true);
  };
  const edit = (a: Api) => {
    setEditing(a);
    form.setData({
      name: a.name,
      code: a.code,
      description: a.description ?? "",
      api_type: a.api_type ?? "sap",
      endpoint: a.endpoint ?? "",
      credential_username: a.credential_username ?? "",
      credential_password: "",
      subscription_name: a.subscription_name ?? "",
      api_token: "",
      target_table: a.target_table?.join(", ") ?? "",
      retries: a.retries,
      retry_delay_seconds: a.retry_delay_seconds,
      timeout_seconds: a.timeout_seconds,
      status: a.status,
    });
    form.clearErrors();
    setOpen(true);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const o = { preserveScroll: true, onSuccess: () => setOpen(false) };
    if (editing) form.put(`/admin/api-integrations/${editing.id}`, o);
    else form.post("/admin/api-integrations", o);
  };
  return (
    <AppLayout
      breadcrumbs={[
        { title: "API Integrations", href: "/admin/api-integrations" },
      ]}
    >
      <Head title="API Integrations" />
      <div className="min-h-full bg-slate-50/70 p-3 md:p-5">
        <section className="mx-auto w-full max-w-[1680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-cyan-50/60 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    <Globe2 className="size-4.5" />
                  </span>
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      API integrations
                    </h1>
                    <p className="text-xs text-slate-500">
                      Manage endpoints, credentials, destinations, and execution
                      history.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  <b className="text-slate-900">{stats.total}</b> total
                </span>
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <b>{stats.active}</b> active
                </span>
                {canManage && (
                  <Button
                    onClick={create}
                    className="bg-brand-teal text-white shadow-sm hover:bg-cyan-700"
                  >
                    <Plus className="size-4" />
                    Add integration
                  </Button>
                )}
              </div>
            </div>
            <div className="relative mt-4 w-full max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 border-slate-200 bg-white pl-9 shadow-none"
                value={search}
                placeholder="Search by name, code, endpoint, or table…"
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">
                <tr>
                  <th className="w-14 px-3 py-3"></th>
                  {[
                    "S.No.",
                    "Name",
                    "Endpoint",
                    "Method",
                    "Authentication",
                    "Save to table",
                    "Retries",
                    "Status",
                    "Last run",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {integrations.data.map((a, i) => (
                  <Fragment key={a.id}>
                    <tr
                      className={`transition-colors hover:bg-cyan-50/35 ${expandedId === a.id ? "bg-cyan-50/25" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <RowExpandButton
                          expanded={expandedId === a.id}
                          label={`${expandedId === a.id ? "Collapse" : "Expand"} ${a.name}`}
                          onClick={() =>
                            setExpandedId(expandedId === a.id ? null : a.id)
                          }
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-500">
                        {(integrations.from ?? 1) + i}
                      </td>
                      <td className="px-4 py-4">
                        <b className="text-slate-900">{a.name}</b>
                        <span
                          className="mt-0.5 block max-w-[260px] truncate text-xs text-slate-500"
                          title={a.description || a.code}
                        >
                          {a.description || a.code}
                        </span>
                      </td>
                      <td
                        className="max-w-sm px-4 py-4 text-xs"
                        title={a.endpoint ?? ""}
                      >
                        <code className="block max-w-[310px] truncate font-sans font-medium text-slate-700">
                          {a.endpoint || "Not configured"}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ring-1 ${a.api_type === "sap" ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-violet-50 text-violet-700 ring-violet-200"}`}
                        >
                          {a.api_type === "sap" ? "GET" : "POST"}
                        </span>
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-700">
                        <span className="font-medium">{a.api_type === "sap" ? "Basic" : "Subscription"}</span>
                        <span
                          className="mt-0.5 block max-w-[210px] truncate font-mono text-[10px] text-slate-400"
                          title="Encrypted database credentials"
                        >
                          Encrypted in database
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="flex max-w-[230px] flex-wrap gap-1">
                          {a.target_table?.length ? (
                            a.target_table.map((table) => (
                              <span
                                key={table}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600"
                              >
                                <Database className="size-3" />
                                {table}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">
                              Raw payload only
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">
                          {a.retries}
                        </span>{" "}
                        attempts
                        <span className="block text-[10px] text-slate-400">
                          {a.retry_delay_seconds}s delay
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          disabled={
                            !manageableCodes.includes(a.code.toLowerCase())
                          }
                          onClick={() =>
                            router.patch(
                              `/admin/api-integrations/${a.id}/status`,
                              { active: !a.status },
                              { preserveScroll: true },
                            )
                          }
                          className="flex items-center gap-2 text-xs font-semibold disabled:cursor-default"
                        >
                          <span
                            className={`relative h-5 w-9 rounded-full ring-1 ${a.status ? "bg-emerald-500 ring-emerald-500" : "bg-slate-300 ring-slate-300"}`}
                          >
                            <span
                              className={`absolute top-0.5 size-4 rounded-full bg-white shadow ${a.status ? "left-[18px]" : "left-0.5"}`}
                            />
                          </span>
                          <span
                            className={
                              a.status ? "text-emerald-700" : "text-slate-500"
                            }
                          >
                            {a.status ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold capitalize ${["success", "completed"].includes(a.last_run_status ?? "") ? "bg-emerald-50 text-emerald-700" : ["queued", "running"].includes(a.last_run_status ?? "") ? "bg-sky-50 text-sky-700" : a.last_run_status === "failed" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {a.last_run_status?.replaceAll("_", " ") ||
                            "Never run"}
                        </span>
                        {a.last_run_at && (
                          <span className="mt-1 block whitespace-nowrap text-[10px] text-slate-400">
                            {new Date(a.last_run_at).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedId === a.id && (
                      <tr>
                        <td
                          colSpan={10}
                          className="border-l-2 border-cyan-500 bg-slate-50 px-16 py-4"
                        >
                          <div className="flex items-center gap-2">
                            <div className="mr-auto">
                              <span className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                                Integration actions
                              </span>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Run, inspect logs, or update this connection.
                              </p>
                            </div>
                            {runnableCodes.includes(a.code.toLowerCase()) && (
                              <Button
                                onClick={() =>
                                  router.post(
                                    `/admin/api-integrations/${a.id}/run`,
                                    {},
                                    { preserveScroll: true },
                                  )
                                }
                                className="bg-brand-teal text-white hover:bg-cyan-700"
                              >
                                <Play className="size-3.5" />
                                Run
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => setLogsFor(a)}
                            >
                              <FileText className="size-3.5" />
                              Logs
                            </Button>
                            {manageableCodes.includes(a.code.toLowerCase()) && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => edit(a)}
                                >
                                  <Edit3 className="size-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-rose-200 text-rose-600"
                                  onClick={() =>
                                    window.confirm(
                                      `Delete ${a.name} and its logs?`,
                                    ) &&
                                    router.delete(
                                      `/admin/api-integrations/${a.id}`,
                                      { preserveScroll: true },
                                    )
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              Showing {integrations.from ?? 0}–{integrations.to ?? 0} of{" "}
              {integrations.total}
              <Select
                value={String(filters.per_page)}
                onValueChange={(v) => load(search, Number(v))}
              >
                <SelectTrigger className="h-8 w-20 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!integrations.prev_page_url}
                onClick={() =>
                  integrations.prev_page_url &&
                  router.get(integrations.prev_page_url)
                }
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!integrations.next_page_url}
                onClick={() =>
                  integrations.next_page_url &&
                  router.get(integrations.next_page_url)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 sm:p-0">
          <MasterDialogHeader
            title={editing ? "Edit API integration" : "Create API integration"}
          />
          <form onSubmit={submit}>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field label="Name" error={form.errors.name}>
                <Input
                  value={form.data.name}
                  placeholder="API name"
                  onChange={(e) => form.setData("name", e.target.value)}
                />
              </Field>
              <Field label="Code" error={form.errors.code}>
                <Input
                  value={form.data.code}
                  placeholder="Unique code"
                  onChange={(e) => form.setData("code", e.target.value)}
                />
              </Field>
              <Field label="Description">
                <Input
                  value={form.data.description}
                  placeholder="Description"
                  onChange={(e) => form.setData("description", e.target.value)}
                />
              </Field>
              <Field label="API Type" error={form.errors.api_type}>
                <Select
                  value={form.data.api_type}
                  onValueChange={(value: "sap" | "external") => form.setData("api_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sap">SAP API</SelectItem>
                    <SelectItem value="external">External API</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label={form.data.api_type === "external" ? "External API URL" : "SAP Endpoint"}
                  error={form.errors.endpoint}
                >
                  <Input
                    value={form.data.endpoint}
                    placeholder={
                      form.data.api_type === "external"
                        ? "https://external.example.com/api/resource"
                        : "/sap/opu/odata/..."
                    }
                    onChange={(e) => form.setData("endpoint", e.target.value)}
                  />
                </Field>
              </div>
              <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900 sm:col-span-2">
                {form.data.api_type === "external"
                  ? "POST · subscription credentials are encrypted before being stored in the database"
                  : ["production", "quality"].includes(form.data.code)
                    ? "GET · shared Basic credentials are encrypted on this environment API"
                    : `GET · uses shared Basic credentials from ${credentialSourceCode} API`}
              </div>
              {form.data.api_type === "sap" && ["production", "quality"].includes(form.data.code) ? (
                <>
                  <Field label="API_AUTH_USERNAME" error={form.errors.credential_username}>
                    <Input
                      autoComplete="off"
                      value={form.data.credential_username}
                      placeholder="API authentication username"
                      onChange={(e) => form.setData("credential_username", e.target.value)}
                    />
                  </Field>
                  <Field label="API_AUTH_PASSWORD" error={form.errors.credential_password}>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={form.data.credential_password}
                      placeholder={editing?.has_credential_password ? "•••••••••••• (saved)" : "API authentication password"}
                      onChange={(e) => form.setData("credential_password", e.target.value)}
                    />
                    {editing?.has_credential_password && !form.data.credential_password && (
                      <p className="mt-1 text-xs text-slate-500">
                        Password is saved securely. Leave blank to keep it unchanged.
                      </p>
                    )}
                  </Field>
                </>
              ) : form.data.api_type === "external" ? (
                <>
                  <Field label="Subscription Name" error={form.errors.subscription_name}>
                    <Input
                      autoComplete="off"
                      value={form.data.subscription_name}
                      placeholder="Subscription name"
                      onChange={(e) => form.setData("subscription_name", e.target.value)}
                    />
                  </Field>
                  <Field label="API Token" error={form.errors.api_token}>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={form.data.api_token}
                      placeholder={editing?.has_api_token ? "•••••••••••• (saved)" : "API token"}
                      onChange={(e) => form.setData("api_token", e.target.value)}
                    />
                    {editing?.has_api_token && !form.data.api_token && (
                      <p className="mt-1 text-xs text-slate-500">
                        Token is saved securely. Leave blank to keep it unchanged.
                      </p>
                    )}
                  </Field>
                </>
              ) : null}
              <Field
                label="Target tables (comma separated)"
                error={form.errors.target_table}
              >
                <Input
                  value={form.data.target_table}
                  onChange={(e) => form.setData("target_table", e.target.value)}
                />
              </Field>
              <Field label="Retries">
                <Input
                  type="number"
                  value={form.data.retries}
                  onChange={(e) =>
                    form.setData("retries", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Retry delay (seconds)">
                <Input
                  type="number"
                  value={form.data.retry_delay_seconds}
                  onChange={(e) =>
                    form.setData("retry_delay_seconds", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Timeout (seconds)">
                <Input
                  type="number"
                  value={form.data.timeout_seconds}
                  onChange={(e) =>
                    form.setData("timeout_seconds", Number(e.target.value))
                  }
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.data.status}
                  onChange={(e) => form.setData("status", e.target.checked)}
                />
                Active
              </label>
            </div>
            <DialogFooter className="border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={form.processing}
                className="bg-brand-teal text-white"
              >
                {form.processing ? "Saving…" : "Save API"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!logsFor} onOpenChange={(o) => !o && setLogsFor(null)}>
        <DialogContent className="max-w-4xl p-0 sm:p-0 [&>button]:hidden">
          <div className="relative">
            <MasterDialogHeader title={`${logsFor?.name ?? ""} · Run logs`} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close run logs"
              onClick={() => setLogsFor(null)}
              className="absolute top-5 right-5 border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <X className="size-5" />
            </Button>
          </div>
          <div className="max-h-[65vh] overflow-auto p-5">
            {logsFor?.logs.length ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase">
                  <tr>
                    {[
                      "Time",
                      "Status",
                      "Attempt",
                      "HTTP",
                      "Duration",
                      "Message",
                    ].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logsFor.logs.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold capitalize">
                        {l.status}
                      </td>
                      <td className="p-3">{l.attempt}</td>
                      <td className="p-3">{l.http_status ?? "—"}</td>
                      <td className="p-3">
                        {l.duration_ms ? `${l.duration_ms} ms` : "—"}
                      </td>
                      <td className="p-3">{l.message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid place-items-center py-16 text-slate-500">
                <Activity className="mb-2 size-8" />
                No run logs yet.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      <InputError message={error} />
    </div>
  );
}
