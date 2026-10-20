"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  LayoutDashboard,
  FolderOpen,
  MessagesSquare,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Check,
  Clock3,
  ShieldCheck,
  LogOut,
  CircleHelp,
  Menu,
  X,
  FileText,
  Users,
  Landmark,
  Wallet,
  Car,
  Home,
  CheckCircle2,
  CalendarDays,
  Download,
  Upload,
  Mail,
  LockKeyhole,
  AlertCircle,
  ListTodo,
  Circle,
  ExternalLink,
  Copy,
  Sparkles,
  Scale,
  ArrowLeft,
  Activity,
  Receipt,
  MoreHorizontal,
  Globe2,
  Send,
  Eye,
  BriefcaseBusiness,
} from "lucide-react";
import {
  api,
  money,
  dateLabel,
  human,
  stages,
  translate,
  type User,
  type Estate,
  type CaseDetail,
  type CaseRecord,
  type Document,
} from "@/lib/api";
import {
  Logo,
  Badge,
  Button,
  Empty,
  Loading,
  Field,
  ErrorBox,
  PageHeading,
  Modal,
  FileIcon,
  Stepper,
} from "./ui";

type FormField = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  value?: string;
};
type Dialog = {
  title: string;
  description?: string;
  fields: FormField[];
  submit: string;
  run: (values: Record<string, string>) => Promise<any>;
};
const accounts = [
  { role: "Lawyer", name: "Sarah Rahman", email: "sarah@demo.my", icon: Scale },
  { role: "Family", name: "Aina Abdullah", email: "aina@demo.my", icon: Users },
  {
    role: "Officer",
    name: "Daniel Azman",
    email: "daniel@demo.my",
    icon: Landmark,
  },
];
const assetSteps = [
  "identified",
  "evidence_checked",
  "claim_prepared",
  "submitted",
  "approved",
  "released",
];
const tone = (status: string) =>
  [
    "accepted",
    "completed",
    "released",
    "paid",
    "order_issued",
    "resolved",
  ].includes(status)
    ? "green"
    : [
          "correction_requested",
          "query",
          "open",
          "information_requested",
        ].includes(status)
      ? "amber"
      : ["under_review", "submitted", "responded", "approved"].includes(status)
        ? "blue"
        : "neutral";
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
const assetIcon = (type: string) =>
  type === "Property"
    ? Home
    : type === "Vehicle"
      ? Car
      : type === "Investment"
        ? Wallet
        : Landmark;

export default function EstateApp() {
  const [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [language, setLanguage] = useState("en");
  const [overview, setOverview] = useState<any>({
      estates: [],
      intakes: [],
      notifications: [],
    }),
    [detail, setDetail] = useState<CaseDetail | null>(null);
  const [view, setView] = useState("Dashboard"),
    [caseId, setCaseId] = useState<number | null>(null),
    [tab, setTab] = useState("Overview");
  const [mobileNav, setMobileNav] = useState(false),
    [search, setSearch] = useState(""),
    [dialog, setDialog] = useState<Dialog | null>(null);
  const [document, setDocument] = useState<Document | null>(null),
    [upload, setUpload] = useState<Document | "new" | null>(null);
  const [intake, setIntake] = useState<any | null>(null),
    [inviteLink, setInviteLink] = useState(""),
    [invitation, setInvitation] = useState<any | null>(null);
  const [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [info, setInfo] = useState(false);
  const reduce = useReducedMotion();
  const t = (s: string) => translate(s, language);
  const notify = useCallback((s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 4500);
  }, []);
  const refresh = useCallback(async (id?: number | null) => {
    const data = await api("/overview");
    setOverview(data);
    if (id) setDetail(await api(`/cases/${id}`));
  }, []);
  useEffect(() => {
    setLanguage(localStorage.getItem("estate-language") || "en");
    api<User>("/auth/me")
      .then(async (u) => {
        setUser(u);
        await refresh();
        const params = new URLSearchParams(location.hash.slice(1));
        if (params.get("case")) {
          const id = Number(params.get("case"));
          setDetail(await api(`/cases/${id}`));
          setCaseId(id);
          setTab(params.get("tab") || "Overview");
        }
        setView(params.get("view") || "Dashboard");
      })
      .catch(() => {})
      .finally(() => setBoot(false));
  }, [refresh]);
  useEffect(() => {
    if (!user) return;
    const token = new URLSearchParams(location.search).get("invite");
    if (token)
      api(`/invitations/${encodeURIComponent(token)}`)
        .then((v) => setInvitation({ ...v, token }))
        .catch((e) => setError(e.message));
  }, [user]);
  useEffect(() => {
    const fn = () => {
      const p = new URLSearchParams(location.hash.slice(1));
      const id = p.get("case");
      setView(p.get("view") || "Dashboard");
      setTab(p.get("tab") || "Overview");
      setCaseId(id ? Number(id) : null);
      if (id)
        api<CaseDetail>(`/cases/${id}`)
          .then(setDetail)
          .catch((e) => setError(e.message));
    };
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);
  const navigate = (
    v: string,
    id: number | null = null,
    nextTab = "Overview",
  ) => {
    setView(v);
    setCaseId(id);
    setTab(nextTab);
    setMobileNav(false);
    setSearch("");
    setError("");
    const p = new URLSearchParams({ view: v });
    if (id) {
      p.set("case", String(id));
      p.set("tab", nextTab);
    }
    history.pushState({}, "", `${location.pathname}${location.search}#${p}`);
    if (id) {
      setDetail(null);
      api<CaseDetail>(`/cases/${id}`)
        .then(setDetail)
        .catch((e) => setError(e.message));
    }
  };
  const openCase = (id: number, nextTab = "Overview") =>
    navigate("Cases", id, nextTab);
  const mutate = async (path: string, body: any, message: string) => {
    setPending(true);
    setError("");
    try {
      const data = await api(path, "POST", body);
      await refresh(caseId);
      notify(message);
      return data;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  };
  const act = (action: string, data: Record<string, any> = {}) =>
    mutate(`/cases/${caseId}/actions`, { action, data }, "Case updated");
  const ask = (value: Dialog) => {
    setError("");
    setDialog(value);
  };
  const caseAction = (
    action: string,
    title: string,
    fields: FormField[] = [],
    submit = "Confirm",
  ) => ask({ title, fields, submit, run: (values) => act(action, values) });
  const newCase = () =>
    ask({
      title: "Create an estate case",
      description:
        "Start with what you know. Invite the family to complete the rest.",
      submit: "Create case",
      fields: [
        { key: "deceased", label: "Name of the deceased", required: true },
        {
          key: "jurisdiction",
          label: "Jurisdiction",
          value: "Kuala Lumpur",
          required: true,
        },
        {
          key: "religion",
          label: "Religion",
          type: "select",
          options: [
            { value: "Muslim", label: "Muslim" },
            { value: "Non-Muslim", label: "Non-Muslim" },
          ],
        },
      ],
      run: async (values) => {
        const result = await mutate(
          "/cases",
          values,
          "Estate workspace created",
        );
        openCase(result.id);
        return result;
      },
    });
  const addRecord = (kind: string, fields: FormField[], title: string) =>
    ask({
      title,
      fields,
      submit: "Save record",
      run: (values) =>
        mutate(
          `/cases/${caseId}/records`,
          {
            kind,
            data: {
              ...values,
              ...(["asset", "liability", "fee"].includes(kind)
                ? { value: Number(values.value) }
                : {}),
            },
            owner_id: kind === "task" ? Number(values.owner_id) : undefined,
          },
          "Record saved",
        ),
    });
  const logout = async () => {
    await api("/auth/logout", "POST");
    setUser(null);
    setDetail(null);
    setCaseId(null);
    setView("Dashboard");
    history.replaceState({}, "", "/");
    notify("Signed out");
  };
  const unread = overview.notifications.filter(
    (n: CaseRecord) => !n.data.read,
  ).length;
  if (boot) return <Loading />;
  if (!user)
    return (
      <AuthScreen
        language={language}
        setLanguage={(lang) => {
          setLanguage(lang);
          localStorage.setItem("estate-language", lang);
        }}
        onLogin={async (u) => {
          setUser(u);
          setView("Dashboard");
          await refresh();
        }}
      />
    );
  const family = user.role === "family",
    officer = user.role === "officer",
    lawyer = user.role === "lawyer";
  const nav = family
    ? [
        ["Dashboard", LayoutDashboard, "Overview"],
        ["My tasks", ListTodo, "My tasks"],
        ["Documents", FileText, "Documents"],
        ["Assets", Wallet, "Assets"],
        ["Updates", Bell, "Updates"],
      ]
    : officer
      ? [
          ["Dashboard", LayoutDashboard, "Dashboard"],
          ["Applications", FolderOpen, "Applications"],
          ["Hearings", CalendarDays, "Hearings"],
          ["Notifications", Bell, "Notifications"],
        ]
      : [
          ["Dashboard", LayoutDashboard, "Dashboard"],
          ["Enquiries", MessagesSquare, "Enquiries"],
          ["Cases", FolderOpen, "Cases"],
          ["Notifications", Bell, "Notifications"],
        ];
  const tabs = officer
    ? [
        "Summary",
        "Submitted documents",
        "Queries",
        "Hearing",
        "Decision",
        "History",
      ]
    : family
      ? ["Overview", "My tasks", "Documents", "Assets", "Updates"]
      : [
          "Overview",
          "People",
          "Assets & liabilities",
          "Documents",
          "Tasks",
          "Applications",
          "Fees",
          "Activity",
        ];
  const currentTab = officer && tab === "Overview" ? "Summary" : tab;
  const records = detail?.records || {};
  const assets = records.asset || [];
  const tasks = records.task || [];
  const latest = detail?.submissions[0];
  const headerTitle = caseId
    ? detail?.estate.reference || "Estate case"
    : t(view === "Dashboard" && family ? "Overview" : view);
  const primaryEstate = overview.estates[0];
  const chooseFamilySection = (label: string) => {
    if (
      ["My tasks", "Documents", "Assets", "Updates"].includes(label) &&
      primaryEstate
    )
      openCase(primaryEstate.id, label);
    else navigate(label);
  };
  const showTask = (r: CaseRecord) => (
    <div className="task-row" key={r.id}>
      <span
        className={`task-check ${r.data.status === "completed" ? "checked" : ""}`}
      >
        {r.data.status === "completed" ? (
          <Check size={16} />
        ) : (
          <Circle size={17} />
        )}
      </span>
      <div className="grow">
        <strong>{r.data.title}</strong>
        <p>{r.data.description}</p>
        {r.data.response && (
          <div className="response">
            <strong>Response</strong> {r.data.response}
          </div>
        )}
        <div className="tiny muted">
          Assigned to{" "}
          {detail?.members.find((m) => m.user.id === r.owner_id)?.user.name ||
            detail?.lawyer.name}
        </div>
      </div>
      <div className="task-actions">
        <Badge tone={tone(r.data.status)}>{human(r.data.status)}</Badge>
        {r.owner_id === user.id && r.data.status !== "completed" && (
          <Button
            kind="secondary"
            onClick={() =>
              ask({
                title: "Respond to request",
                description: r.data.description,
                fields: [
                  {
                    key: "response",
                    label: "Your response",
                    type: "textarea",
                    required: true,
                  },
                ],
                submit: "Send response",
                run: (v) =>
                  mutate(
                    `/records/${r.id}/action`,
                    { action: "respond", data: v },
                    "Response sent",
                  ),
              })
            }
          >
            {t("Respond")}
            <Send size={13} />
          </Button>
        )}
        {lawyer && r.data.status === "responded" && (
          <Button
            kind="secondary"
            disabled={pending}
            onClick={() =>
              mutate(
                `/records/${r.id}/action`,
                { action: "complete" },
                "Task reviewed and completed",
              ).catch(() => {})
            }
          >
            Complete review
          </Button>
        )}
        {lawyer && r.data.status !== "completed" && (
          <button
            className="text-link tiny"
            onClick={() =>
              ask({
                title: "Assign task",
                fields: [
                  {
                    key: "owner_id",
                    label: "Assigned person",
                    type: "select",
                    options: [
                      {
                        value: String(detail?.lawyer.id),
                        label: detail?.lawyer.name || "Lawyer",
                      },
                      ...(detail?.members || []).map((m) => ({
                        value: String(m.user.id),
                        label: m.user.name,
                      })),
                    ],
                  },
                ],
                submit: "Assign",
                run: (v) =>
                  mutate(
                    `/records/${r.id}/action`,
                    {
                      action: "assign",
                      data: { owner_id: Number(v.owner_id) },
                    },
                    "Task reassigned",
                  ),
              })
            }
          >
            Reassign
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`app-shell ${family ? "family-mode" : ""}`}>
      {mobileNav && (
        <div className="nav-scrim" onClick={() => setMobileNav(false)} />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <Logo />
        <button
          className="mobile-nav-close icon-btn"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        <div className="workspace-switch">
          <span className="organisation-icon">
            {officer ? (
              <Landmark size={18} />
            ) : family ? (
              <Users size={18} />
            ) : (
              <Scale size={18} />
            )}
          </span>
          <span>
            <strong>
              {family
                ? "Family workspace"
                : officer
                  ? "Agency workspace"
                  : "Rahman & Partners"}
            </strong>
            <small>
              {family
                ? "Your shared estate journey"
                : officer
                  ? "JKPTG · Demo office"
                  : "Legal workspace"}
            </small>
          </span>
          <ChevronDown size={14} />
        </div>
        <span className="nav-label">
          {family ? "YOUR WORKSPACE" : "WORKSPACE"}
        </span>
        <nav aria-label="Main navigation">
          {nav.map(([key, Icon, label]) => {
            const NavIcon = Icon as typeof Home;
            const selected = caseId
              ? family
                ? tab === key
                : key === "Cases" || key === "Applications"
              : view === key;
            return (
              <button
                key={key as string}
                className={`nav-item ${selected ? "selected" : ""}`}
                onClick={() =>
                  family
                    ? chooseFamilySection(key as string)
                    : navigate(key as string)
                }
              >
                <NavIcon size={19} />
                <span>{t(label as string)}</span>
                {key === "Enquiries" &&
                  overview.intakes.filter((i: any) => i.status === "submitted")
                    .length > 0 && (
                    <span className="nav-count">
                      {
                        overview.intakes.filter(
                          (i: any) => i.status === "submitted",
                        ).length
                      }
                    </span>
                  )}
                {["Notifications", "Updates"].includes(key as string) &&
                  unread > 0 && <span className="nav-count">{unread}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-orbit">
              <ShieldCheck size={22} />
            </span>
            <strong>A little guidance goes a long way.</strong>
            <p>Understand every step of the estate journey.</p>
            <button onClick={() => setInfo(true)}>
              Explore guidance <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="nav-item" onClick={() => setInfo(true)}>
            <CircleHelp size={18} />
            {t("Help & guidance")}
            <ArrowUpRight size={14} />
          </button>
          <div className="user-block">
            <span className="avatar">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{t(human(user.role))} account</small>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              className="icon-btn"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn hamburger"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span className="muted">Workspace</span>
            <ChevronRight size={13} />
            <span>{headerTitle}</span>
          </div>
          <div className="topbar-tools">
            <span className="demo-pill">
              <span />
              Proof of concept
            </span>
            <button
              className="language-button"
              onClick={() => {
                const lang = language === "en" ? "bm" : "en";
                setLanguage(lang);
                localStorage.setItem("estate-language", lang);
              }}
              aria-label="Change language"
            >
              <Globe2 size={15} />
              {language === "en" ? "EN" : "BM"}
            </button>
            <button
              className="notification-button icon-btn"
              aria-label="Notifications"
              onClick={() => navigate("Notifications")}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>
            <span className="avatar small-avatar">{initials(user.name)}</span>
          </div>
        </header>
        <main className="main-content" id="main-content">
          <ErrorBox message={error} />
          <AnimatePresence mode="wait">
            <motion.div
              key={caseId ? `case-${caseId}` : view}
              initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            >
              {caseId ? (
                detail ? (
                  <>
                    <div className="case-back">
                      <button
                        className="text-link"
                        onClick={() =>
                          navigate(
                            officer
                              ? "Applications"
                              : family
                                ? "Dashboard"
                                : "Cases",
                          )
                        }
                      >
                        <ArrowLeft size={15} />{" "}
                        {officer
                          ? "Applications"
                          : family
                            ? "Your workspace"
                            : "All estate cases"}
                      </button>
                      <span className="muted tiny">
                        {detail.estate.reference}
                      </span>
                    </div>
                    <PageHeading
                      eyebrow={`${detail.estate.jurisdiction.toUpperCase()} · ${detail.estate.religion.toUpperCase()} ESTATE`}
                      title={detail.estate.deceased}
                      description={
                        officer
                          ? "Review the submitted evidence and record the next step."
                          : `Managed by ${detail.lawyer.name} · ${detail.lawyer.organisation}`
                      }
                      action={
                        <div className="button-row">
                          <a
                            className="btn secondary"
                            href={`/api/cases/${caseId}/summary`}
                          >
                            <Download size={16} />
                            {t("Download summary")}
                          </a>
                          {lawyer && (
                            <Button
                              onClick={() =>
                                ask({
                                  title: "Invite a family member",
                                  description:
                                    "Create a private link for the invited email. No email is sent in this demo.",
                                  fields: [
                                    {
                                      key: "email",
                                      label: "Email address",
                                      type: "email",
                                      required: true,
                                    },
                                    {
                                      key: "coordinator",
                                      label: "Case role",
                                      type: "select",
                                      options: [
                                        {
                                          value: "false",
                                          label: "Family member",
                                        },
                                        {
                                          value: "true",
                                          label: "Family coordinator",
                                        },
                                      ],
                                    },
                                  ],
                                  submit: "Create invitation",
                                  run: async (v) => {
                                    const inv = await mutate(
                                      `/cases/${caseId}/invitations`,
                                      {
                                        email: v.email,
                                        coordinator: v.coordinator === "true",
                                      },
                                      "Invitation created",
                                    );
                                    setInviteLink(
                                      `${location.origin}/?invite=${inv.token}`,
                                    );
                                  },
                                })
                              }
                            >
                              <Plus size={16} />
                              {t("Invite family")}
                            </Button>
                          )}
                        </div>
                      }
                    />
                    <div className="case-status-line">
                      <Badge
                        tone={detail.estate.stage === 6 ? "green" : "blue"}
                      >
                        {detail.estate.stage === 6
                          ? "Completed"
                          : t(stages[detail.estate.stage])}
                      </Badge>
                      <span className="tiny muted">
                        {detail.estate.stage === 6
                          ? "All asset releases reconciled"
                          : "Progress follows recorded actions and evidence"}
                      </span>
                    </div>
                    <div
                      className="case-tabs"
                      role="tablist"
                      aria-label="Case sections"
                    >
                      {tabs.map((s) => (
                        <button
                          key={s}
                          role="tab"
                          aria-selected={currentTab === s}
                          className={currentTab === s ? "active" : ""}
                          onClick={() => {
                            setTab(s);
                            history.replaceState(
                              {},
                              "",
                              `${location.pathname}${location.search}#${new URLSearchParams({ view: "Cases", case: String(caseId), tab: s })}`,
                            );
                          }}
                        >
                          {t(s)}
                          {s === "My tasks" &&
                            tasks.filter((r) => r.data.status !== "completed")
                              .length > 0 && (
                              <span>
                                {
                                  tasks.filter(
                                    (r) => r.data.status !== "completed",
                                  ).length
                                }
                              </span>
                            )}
                        </button>
                      ))}
                    </div>
                    {["Overview", "Summary"].includes(currentTab) && (
                      <>
                        <div className="panel journey-panel">
                          <div className="panel-heading">
                            <h2>{t("Case journey")}</h2>
                            <span className="tiny muted">
                              {detail.estate.stage === 6
                                ? "Complete"
                                : `Stage ${detail.estate.stage + 1} of 6`}
                            </span>
                          </div>
                          <Stepper
                            stage={detail.estate.stage}
                            labels={stages.map(t)}
                          />
                        </div>
                        {tasks.find((r) => r.data.status !== "completed") && (
                          <div className="action-banner">
                            <span className="action-symbol">
                              <AlertCircle size={22} />
                            </span>
                            <div>
                              <span className="eyebrow">
                                {t("Next action")}
                              </span>
                              <h3>
                                {
                                  tasks.find(
                                    (r) => r.data.status !== "completed",
                                  )!.data.title
                                }
                              </h3>
                              <p>
                                {
                                  tasks.find(
                                    (r) => r.data.status !== "completed",
                                  )!.data.description
                                }
                              </p>
                            </div>
                            <Button
                              kind="secondary"
                              onClick={() =>
                                setTab(family ? "My tasks" : "Tasks")
                              }
                            >
                              View request <ArrowRight size={16} />
                            </Button>
                          </div>
                        )}
                        <div className="content-columns">
                          <div>
                            <section className="panel">
                              <div className="panel-heading">
                                <h2>{t("Asset progress")}</h2>
                                <span className="tiny muted">
                                  {
                                    assets.filter(
                                      (a) => a.data.status === "released",
                                    ).length
                                  }{" "}
                                  of {assets.length} released
                                </span>
                              </div>
                              {officer ? (
                                <SnapshotSummary submission={latest} />
                              ) : assets.length ? (
                                assets.map((a) => {
                                  const Icon = assetIcon(a.data.type);
                                  return (
                                    <div className="asset-compact" key={a.id}>
                                      <span className="asset-icon">
                                        <Icon size={20} />
                                      </span>
                                      <div className="grow">
                                        <strong>{a.data.name}</strong>
                                        <p>
                                          {a.data.type} · {money(a.data.value)}
                                        </p>
                                      </div>
                                      <Badge tone={tone(a.data.status)}>
                                        {human(a.data.status)}
                                      </Badge>
                                    </div>
                                  );
                                })
                              ) : (
                                <Empty
                                  title="Start the asset inventory"
                                  description="Add the property, accounts and other interests involved in the estate."
                                />
                              )}
                              <div className="panel-footer">
                                <span className="tiny muted">
                                  {officer
                                    ? "Submission snapshot · no live private case access"
                                    : "An order is a milestone. Actual releases finish the journey."}
                                </span>
                                {!officer && (
                                  <button
                                    className="text-link"
                                    onClick={() =>
                                      setTab(
                                        family
                                          ? "Assets"
                                          : "Assets & liabilities",
                                      )
                                    }
                                  >
                                    View assets <ArrowRight size={14} />
                                  </button>
                                )}
                              </div>
                            </section>
                            {!officer && (
                              <section className="panel">
                                <div className="panel-heading">
                                  <h2>Family intake</h2>
                                  {detail.is_coordinator && (
                                    <button
                                      className="text-link"
                                      onClick={() =>
                                        ask({
                                          title: "Update family information",
                                          description:
                                            "Record what is known and flag anything that needs professional review.",
                                          fields: [
                                            {
                                              key: "story",
                                              label: "Circumstances",
                                              type: "textarea",
                                              value:
                                                detail.estate.details.story ||
                                                "",
                                            },
                                            {
                                              key: "family",
                                              label:
                                                "Known family and relationships",
                                              type: "textarea",
                                              value:
                                                detail.estate.details.family ||
                                                "",
                                            },
                                            {
                                              key: "assets",
                                              label: "Known asset information",
                                              type: "textarea",
                                              value:
                                                detail.estate.details.assets ||
                                                "",
                                            },
                                            {
                                              key: "documents",
                                              label: "Known documents",
                                              value:
                                                detail.estate.details
                                                  .documents || "",
                                            },
                                            {
                                              key: "nomination",
                                              label:
                                                "Will or nomination information",
                                              value:
                                                detail.estate.details
                                                  .nomination || "Not sure",
                                            },
                                          ],
                                          submit: "Save information",
                                          run: async (v) => {
                                            await api(
                                              `/cases/${caseId}/details`,
                                              "PUT",
                                              { data: v },
                                            );
                                            await refresh(caseId);
                                            notify("Family information saved");
                                          },
                                        })
                                      }
                                    >
                                      Update details <ArrowRight size={14} />
                                    </button>
                                  )}
                                </div>
                                <div className="intake-summary">
                                  <p>
                                    {detail.estate.details.story ||
                                      "Add the circumstances so your lawyer can prepare the right next steps."}
                                  </p>
                                  {detail.estate.details.family && (
                                    <p>
                                      <strong>Family:</strong>{" "}
                                      {detail.estate.details.family}
                                    </p>
                                  )}
                                  {detail.estate.details.assets && (
                                    <p>
                                      <strong>Assets:</strong>{" "}
                                      {detail.estate.details.assets}
                                    </p>
                                  )}
                                  <div className="tiny muted">
                                    Information is supplied by the family and
                                    requires professional review.
                                  </div>
                                </div>
                              </section>
                            )}
                            <section className="panel">
                              <div className="panel-heading">
                                <h2>{t("Latest activity")}</h2>
                                <button
                                  className="text-link"
                                  onClick={() =>
                                    setTab(
                                      officer
                                        ? "History"
                                        : family
                                          ? "Updates"
                                          : "Activity",
                                    )
                                  }
                                >
                                  View all <ArrowRight size={14} />
                                </button>
                              </div>
                              <Timeline
                                records={(records.activity || []).slice(0, 4)}
                              />
                            </section>
                          </div>
                          <div>
                            <section className="panel">
                              <div className="panel-heading">
                                <h2>
                                  {officer
                                    ? "Processing actions"
                                    : "At a glance"}
                                </h2>
                                <MoreHorizontal size={18} className="muted" />
                              </div>
                              <div className="key-values">
                                <div>
                                  <span>Case reference</span>
                                  <strong>{detail.estate.reference}</strong>
                                </div>
                                <div>
                                  <span>Jurisdiction</span>
                                  <strong>{detail.estate.jurisdiction}</strong>
                                </div>
                                <div>
                                  <span>Route</span>
                                  <strong>Small estate · demo</strong>
                                </div>
                                <div>
                                  <span>Processing office</span>
                                  <strong>JKPTG · Simulated</strong>
                                </div>
                              </div>
                              <div className="case-commands">
                                {lawyer && (
                                  <>
                                    {detail.estate.stage <= 2 && (
                                      <Button
                                        kind="secondary"
                                        disabled={pending}
                                        onClick={() =>
                                          act("ready").catch(() => {})
                                        }
                                      >
                                        Complete legal review{" "}
                                        <Check size={16} />
                                      </Button>
                                    )}
                                    {[2, 3].includes(detail.estate.stage) && (
                                      <Button
                                        disabled={pending}
                                        onClick={() =>
                                          act("submit").catch(() => {})
                                        }
                                      >
                                        {latest
                                          ? "Resubmit application"
                                          : "Submit application"}{" "}
                                        <Send size={15} />
                                      </Button>
                                    )}
                                    {detail.estate.stage === 4 && (
                                      <Button
                                        onClick={() =>
                                          act("implement").catch(() => {})
                                        }
                                      >
                                        Start asset implementation{" "}
                                        <ArrowRight size={16} />
                                      </Button>
                                    )}
                                    {detail.estate.stage === 5 && (
                                      <Button
                                        onClick={() =>
                                          act("complete").catch(() => {})
                                        }
                                      >
                                        Reconcile and complete{" "}
                                        <CheckCircle2 size={16} />
                                      </Button>
                                    )}
                                  </>
                                )}
                                {officer && detail.estate.stage === 3 && (
                                  <>
                                    <Button
                                      kind="secondary"
                                      onClick={() =>
                                        caseAction(
                                          "query",
                                          "Request a correction",
                                          [
                                            {
                                              key: "reason",
                                              label:
                                                "What needs to be corrected?",
                                              type: "textarea",
                                              required: true,
                                            },
                                          ],
                                          "Send query",
                                        )
                                      }
                                    >
                                      Request correction{" "}
                                      <MessagesSquare size={15} />
                                    </Button>
                                    <Button
                                      kind="secondary"
                                      onClick={() => setTab("Hearing")}
                                    >
                                      Schedule hearing{" "}
                                      <CalendarDays size={15} />
                                    </Button>
                                    <Button onClick={() => setTab("Decision")}>
                                      Record decision <ArrowRight size={16} />
                                    </Button>
                                  </>
                                )}
                                {family && (
                                  <Button
                                    kind="secondary"
                                    onClick={() => setTab("Documents")}
                                  >
                                    View documents <FileText size={16} />
                                  </Button>
                                )}
                              </div>
                            </section>
                            <section className="panel">
                              <div className="panel-heading">
                                <h2>Next appointment</h2>
                                <CalendarDays size={18} className="muted" />
                              </div>
                              <div className="appointment">
                                <span className="calendar-tile">
                                  <CalendarDays size={24} />
                                </span>
                                <strong>
                                  {records.hearing?.[0]
                                    ? "Estate hearing"
                                    : "Awaiting scheduling"}
                                </strong>
                                <p>
                                  {records.hearing?.[0]
                                    ? `${dateLabel(records.hearing[0].data.date)} · ${records.hearing[0].data.location}`
                                    : "Hearing details will appear once the office records an appointment."}
                                </p>
                              </div>
                            </section>
                            <div className="trust-note">
                              <ShieldCheck size={19} />
                              <p>
                                {officer
                                  ? "All agency decisions in this workspace are simulations."
                                  : "Your information is shared only with authorised case participants."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {["Documents", "Submitted documents"].includes(
                      currentTab,
                    ) && (
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>{t(currentTab)}</h2>
                            <p className="tiny muted">
                              {officer
                                ? "Only evidence published in your assigned submissions."
                                : "Keep originals safe. Each new upload preserves the previous revision."}
                            </p>
                          </div>
                          {!officer && (
                            <Button onClick={() => setUpload("new")}>
                              <Upload size={16} />
                              {t("Upload document")}
                            </Button>
                          )}
                        </div>
                        <div className="document-list">
                          {detail.documents.length ? (
                            detail.documents.map((d) => (
                              <button
                                className="document-row"
                                key={d.id}
                                onClick={() => setDocument(d)}
                              >
                                <FileIcon />
                                <div className="grow">
                                  <strong>{d.category}</strong>
                                  <p>
                                    {d.name} · Revision {d.revision}
                                    {d.visibility === "private"
                                      ? " · Private"
                                      : ""}
                                  </p>
                                  {d.comment && (
                                    <small className="amber-text">
                                      {d.comment}
                                    </small>
                                  )}
                                </div>
                                <Badge tone={tone(d.status)}>
                                  {human(d.status)}
                                </Badge>
                                <ChevronRight size={17} className="muted" />
                              </button>
                            ))
                          ) : (
                            <Empty
                              title="No documents available"
                              description={
                                officer
                                  ? "The lawyer has not published any evidence to your office."
                                  : "Upload the first document to start building the case file."
                              }
                            />
                          )}
                        </div>
                      </section>
                    )}
                    {["Tasks", "My tasks"].includes(currentTab) && (
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>{t(currentTab)}</h2>
                            <p className="tiny muted">
                              Clear requests. Named owners. One shared history.
                            </p>
                          </div>
                          {lawyer && (
                            <Button
                              onClick={() =>
                                addRecord(
                                  "task",
                                  [
                                    {
                                      key: "title",
                                      label: "Task title",
                                      required: true,
                                    },
                                    {
                                      key: "description",
                                      label: "What is required?",
                                      type: "textarea",
                                      required: true,
                                    },
                                    {
                                      key: "owner_id",
                                      label: "Assign to",
                                      type: "select",
                                      options: [
                                        {
                                          value: String(detail.lawyer.id),
                                          label: detail.lawyer.name,
                                        },
                                        ...detail.members.map((m) => ({
                                          value: String(m.user.id),
                                          label: m.user.name,
                                        })),
                                      ],
                                    },
                                  ],
                                  "Assign a task",
                                )
                              }
                            >
                              <Plus size={16} />
                              Assign task
                            </Button>
                          )}
                        </div>
                        {tasks.length ? (
                          tasks.map(showTask)
                        ) : (
                          <Empty
                            title="You’re all caught up"
                            description="New requests will appear here when someone needs your help."
                          />
                        )}
                      </section>
                    )}
                    {["Assets", "Assets & liabilities"].includes(
                      currentTab,
                    ) && (
                      <>
                        <section className="panel">
                          <div className="panel-heading">
                            <div>
                              <h2>Estate assets</h2>
                              <p className="tiny muted">
                                Track each release independently, with
                                supporting evidence.
                              </p>
                            </div>
                            {detail.is_coordinator && (
                              <Button
                                onClick={() =>
                                  addRecord(
                                    "asset",
                                    [
                                      {
                                        key: "name",
                                        label: "Asset name",
                                        required: true,
                                      },
                                      {
                                        key: "type",
                                        label: "Asset type",
                                        type: "select",
                                        options: [
                                          "Property",
                                          "Bank account",
                                          "Investment",
                                          "Vehicle",
                                        ].map((v) => ({ value: v, label: v })),
                                      },
                                      {
                                        key: "value",
                                        label: "Estimated value (RM)",
                                        type: "number",
                                        required: true,
                                      },
                                      {
                                        key: "description",
                                        label: "Ownership and nomination notes",
                                        type: "textarea",
                                      },
                                    ],
                                    "Add an estate asset",
                                  )
                                }
                              >
                                <Plus size={16} />
                                {t("Add asset")}
                              </Button>
                            )}
                          </div>
                          {assets.map((a) => {
                            const Icon = assetIcon(a.data.type);
                            return (
                              <div className="asset-detail" key={a.id}>
                                <div className="asset-detail-top">
                                  <span className="asset-icon">
                                    <Icon size={22} />
                                  </span>
                                  <div className="grow">
                                    <strong>{a.data.name}</strong>
                                    <p>{a.data.description || a.data.type}</p>
                                  </div>
                                  <strong className="asset-value">
                                    {money(a.data.value)}
                                  </strong>
                                  <Badge tone={tone(a.data.status)}>
                                    {human(a.data.status)}
                                  </Badge>
                                </div>
                                <div className="asset-track">
                                  {assetSteps.map((s, i) => (
                                    <span
                                      key={s}
                                      className={
                                        assetSteps.indexOf(a.data.status) >= i
                                          ? "filled"
                                          : ""
                                      }
                                      title={human(s)}
                                    />
                                  ))}
                                </div>
                                {a.data.evidence && (
                                  <div className="evidence-line">
                                    <CheckCircle2 size={14} />
                                    Release evidence: {a.data.evidence}
                                  </div>
                                )}
                                {lawyer && a.data.status !== "released" && (
                                  <div className="asset-detail-actions">
                                    <button
                                      className="text-link"
                                      onClick={() => {
                                        const next =
                                          a.data.status === "query"
                                            ? "submitted"
                                            : assetSteps[
                                                assetSteps.indexOf(
                                                  a.data.status,
                                                ) + 1
                                              ];
                                        ask({
                                          title: `Update ${a.data.name}`,
                                          description: `Next stage: ${human(next)}`,
                                          fields:
                                            next === "released"
                                              ? [
                                                  {
                                                    key: "evidence",
                                                    label:
                                                      "Release or registration evidence",
                                                    type: "textarea",
                                                    required: true,
                                                    placeholder:
                                                      "Receipt reference, date and beneficiary / registered owner",
                                                  },
                                                ]
                                              : [],
                                          submit: `Mark ${human(next).toLowerCase()}`,
                                          run: (v) =>
                                            mutate(
                                              `/records/${a.id}/action`,
                                              {
                                                action: "status",
                                                data: { status: next, ...v },
                                              },
                                              "Asset progress recorded",
                                            ),
                                        });
                                      }}
                                    >
                                      Update progress <ArrowRight size={14} />
                                    </button>
                                    {a.data.status === "submitted" && (
                                      <button
                                        className="text-link"
                                        onClick={() =>
                                          mutate(
                                            `/records/${a.id}/action`,
                                            {
                                              action: "status",
                                              data: { status: "query" },
                                            },
                                            "Asset query recorded",
                                          ).catch(() => {})
                                        }
                                      >
                                        Record query
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {!assets.length && (
                            <Empty
                              title="No assets recorded"
                              description="Record assets and estimated values to build the estate inventory."
                            />
                          )}
                        </section>
                        <section className="panel">
                          <div className="panel-heading">
                            <h2>Liabilities & obligations</h2>
                            {detail.is_coordinator && (
                              <Button
                                kind="secondary"
                                onClick={() =>
                                  addRecord(
                                    "liability",
                                    [
                                      {
                                        key: "name",
                                        label: "Liability or obligation",
                                        required: true,
                                      },
                                      {
                                        key: "value",
                                        label: "Estimated amount (RM)",
                                        type: "number",
                                        required: true,
                                      },
                                      {
                                        key: "description",
                                        label: "Notes",
                                        type: "textarea",
                                      },
                                    ],
                                    "Add a liability",
                                  )
                                }
                              >
                                <Plus size={15} />
                                Add liability
                              </Button>
                            )}
                          </div>
                          {(records.liability || []).map((r) => (
                            <div key={r.id} className="asset-compact">
                              <span className="asset-icon">
                                <Receipt size={19} />
                              </span>
                              <div className="grow">
                                <strong>{r.data.name}</strong>
                                <p>{r.data.description}</p>
                              </div>
                              <strong>{money(r.data.value)}</strong>
                            </div>
                          ))}
                          {!records.liability?.length && (
                            <Empty
                              title="No liabilities recorded"
                              description="Confirm obligations before any final distribution."
                            />
                          )}
                          <div className="panel-footer tiny muted">
                            Illustrative inventory. Final entitlements require
                            professional review.
                          </div>
                        </section>
                      </>
                    )}
                    {currentTab === "People" && (
                      <>
                        <section className="panel">
                          <div className="panel-heading">
                            <h2>Family & relationships</h2>
                            <Button
                              onClick={() =>
                                addRecord(
                                  "person",
                                  [
                                    {
                                      key: "name",
                                      label: "Full name",
                                      required: true,
                                    },
                                    {
                                      key: "relationship",
                                      label: "Relationship to the deceased",
                                      required: true,
                                    },
                                    {
                                      key: "location",
                                      label: "Current location",
                                    },
                                  ],
                                  "Add a family member",
                                )
                              }
                            >
                              <Plus size={16} />
                              {t("Add person")}
                            </Button>
                          </div>
                          <div className="people-grid">
                            {(records.person || []).map((r) => (
                              <div className="person-card" key={r.id}>
                                <span className="avatar large-avatar">
                                  {initials(r.data.name)}
                                </span>
                                <h3>{r.data.name}</h3>
                                <p>{r.data.relationship}</p>
                                <span className="tiny muted">
                                  <Globe2 size={12} />
                                  {r.data.location || "Location not recorded"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                        <section className="panel">
                          <div className="panel-heading">
                            <h2>Workspace access</h2>
                          </div>
                          {detail.members.map((m) => (
                            <div className="access-row" key={m.user.id}>
                              <span className="avatar">
                                {initials(m.user.name)}
                              </span>
                              <div className="grow">
                                <strong>{m.user.name}</strong>
                                <p>{m.user.email}</p>
                              </div>
                              <Badge>
                                {m.coordinator
                                  ? "Coordinator"
                                  : "Family member"}
                              </Badge>
                            </div>
                          ))}
                          {detail.invitations.map((i) => (
                            <div className="access-row" key={i.token}>
                              <Mail size={19} />
                              <div className="grow">
                                <strong>{i.email}</strong>
                                <p>
                                  {i.accepted
                                    ? "Invitation accepted"
                                    : "Invitation awaiting acceptance"}
                                </p>
                              </div>
                              {!i.accepted && (
                                <button
                                  className="text-link"
                                  onClick={() =>
                                    setInviteLink(
                                      `${location.origin}/?invite=${i.token}`,
                                    )
                                  }
                                >
                                  View link <Copy size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </section>
                        <section className="panel">
                          <div className="panel-heading">
                            <h2>Private professional notes</h2>
                            <Button
                              kind="secondary"
                              onClick={() =>
                                addRecord(
                                  "note",
                                  [
                                    {
                                      key: "title",
                                      label: "Note title",
                                      required: true,
                                    },
                                    {
                                      key: "description",
                                      label: "Private note",
                                      type: "textarea",
                                      required: true,
                                    },
                                  ],
                                  "Add a private note",
                                )
                              }
                            >
                              <Plus size={15} />
                              Add note
                            </Button>
                          </div>
                          {(records.note || []).map((r) => (
                            <div className="note" key={r.id}>
                              <LockKeyhole size={15} />
                              <div>
                                <strong>{r.data.title}</strong>
                                <p>{r.data.description}</p>
                              </div>
                            </div>
                          ))}
                        </section>
                      </>
                    )}
                    {currentTab === "Fees" && (
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>Fees & estimates</h2>
                            <p className="tiny muted">
                              Illustrative demo amounts. No money is collected.
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              addRecord(
                                "fee",
                                [
                                  {
                                    key: "name",
                                    label: "Fee description",
                                    required: true,
                                  },
                                  {
                                    key: "value",
                                    label: "Amount (RM)",
                                    type: "number",
                                    required: true,
                                  },
                                ],
                                "Add a fee estimate",
                              )
                            }
                          >
                            <Plus size={16} />
                            Add estimate
                          </Button>
                        </div>
                        {(records.fee || []).map((r) => (
                          <div className="asset-compact" key={r.id}>
                            <span className="asset-icon">
                              <Receipt size={20} />
                            </span>
                            <div className="grow">
                              <strong>{r.data.name}</strong>
                              <p>
                                Simulated ·{" "}
                                {r.data.description || "Demo estimate"}
                              </p>
                            </div>
                            <strong>{money(r.data.value)}</strong>
                            <Badge tone={tone(r.data.status)}>
                              {human(r.data.status)}
                            </Badge>
                            {r.data.status !== "paid" && (
                              <button
                                className="text-link"
                                onClick={() =>
                                  mutate(
                                    `/records/${r.id}/action`,
                                    { action: "paid" },
                                    "Simulated payment recorded",
                                  ).catch(() => {})
                                }
                              >
                                Record paid
                              </button>
                            )}
                          </div>
                        ))}
                        {!records.fee?.length && (
                          <Empty
                            title="No fee estimates"
                            description="Add estimates when the applicable charges are known."
                          />
                        )}
                      </section>
                    )}
                    {currentTab === "Applications" && (
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>Agency submissions</h2>
                            <p className="tiny muted">
                              Each submission preserves a fixed version of the
                              published evidence.
                            </p>
                          </div>
                          {[2, 3].includes(detail.estate.stage) && (
                            <Button
                              onClick={() => act("submit").catch(() => {})}
                            >
                              <Send size={15} />
                              {latest ? "Resubmit" : "Submit application"}
                            </Button>
                          )}
                        </div>
                        {detail.submissions.length ? (
                          detail.submissions.map((s) => (
                            <div className="submission-row" key={s.id}>
                              <span className="asset-icon">
                                <Landmark size={22} />
                              </span>
                              <div className="grow">
                                <strong>JKPTG · Revision {s.revision}</strong>
                                <p>
                                  {dateLabel(s.created)} ·{" "}
                                  {s.snapshot.document_ids.length} documents ·
                                  Simulated processing
                                </p>
                              </div>
                              <Badge tone={tone(s.status)}>
                                {human(s.status)}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <Empty
                            title="Your application is being prepared"
                            description="Accept the shared document revisions, complete legal review, then publish the first submission."
                          />
                        )}
                      </section>
                    )}
                    {currentTab === "Queries" && (
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Agency queries</h2>
                          {detail.estate.stage === 3 && (
                            <Button
                              onClick={() =>
                                caseAction(
                                  "query",
                                  "Request a correction",
                                  [
                                    {
                                      key: "reason",
                                      label: "Required correction",
                                      type: "textarea",
                                      required: true,
                                    },
                                  ],
                                  "Send query",
                                )
                              }
                            >
                              <Plus size={16} />
                              New query
                            </Button>
                          )}
                        </div>
                        {(records.query || []).map((q) => (
                          <div className="task-row" key={q.id}>
                            <MessagesSquare size={20} />
                            <div className="grow">
                              <strong>{q.data.title}</strong>
                              <p>{q.data.description}</p>
                              {(latest?.snapshot.responses || [])
                                .filter(
                                  (response: any) => response.query_id === q.id,
                                )
                                .map((response: any, index: number) => (
                                  <div className="response" key={index}>
                                    <strong>Reviewed response:</strong>{" "}
                                    {response.response}
                                  </div>
                                ))}
                              <span className="tiny muted">
                                Requested against revision{" "}
                                {q.data.submission_revision}
                              </span>
                            </div>
                            <Badge tone={tone(q.data.status)}>
                              {human(q.data.status)}
                            </Badge>
                            {q.data.status !== "resolved" && (
                              <Button
                                kind="secondary"
                                onClick={() =>
                                  mutate(
                                    `/records/${q.id}/action`,
                                    { action: "resolve" },
                                    "Query resolved after resubmission review",
                                  ).catch(() => {})
                                }
                              >
                                Resolve query
                              </Button>
                            )}
                          </div>
                        ))}
                        {!records.query?.length && (
                          <Empty
                            title="No queries raised"
                            description="Request specific corrections to help the lawyer submit the right evidence."
                          />
                        )}
                      </section>
                    )}
                    {currentTab === "Hearing" && (
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Hearing arrangements</h2>
                          {detail.estate.stage === 3 && (
                            <Button
                              onClick={() =>
                                caseAction(
                                  "hearing",
                                  "Schedule a simulated hearing",
                                  [
                                    {
                                      key: "date",
                                      label: "Date and time",
                                      type: "datetime-local",
                                      required: true,
                                    },
                                    {
                                      key: "location",
                                      label: "Location",
                                      value:
                                        "JKPTG Kuala Lumpur · Demo hearing room",
                                      required: true,
                                    },
                                  ],
                                  "Save hearing",
                                )
                              }
                            >
                              <CalendarDays size={16} />
                              Schedule hearing
                            </Button>
                          )}
                        </div>
                        {(records.hearing || []).map((r) => (
                          <div className="hearing-row" key={r.id}>
                            <span className="calendar-tile">
                              <CalendarDays size={25} />
                            </span>
                            <div>
                              <h3>{dateLabel(r.data.date)}</h3>
                              <p>
                                {new Date(r.data.date).toLocaleTimeString(
                                  "en-MY",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}{" "}
                                · {r.data.location}
                              </p>
                              <Badge tone="blue">Simulated appointment</Badge>
                            </div>
                          </div>
                        ))}
                        {!records.hearing?.length && (
                          <Empty
                            title="No hearing scheduled"
                            description="Record the appointment once the submitted evidence is ready."
                          />
                        )}
                      </section>
                    )}
                    {currentTab === "Decision" && (
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Decision & order</h2>
                          <Badge tone="amber">Simulation</Badge>
                        </div>
                        {records.decision?.length ? (
                          records.decision.map((r) => (
                            <div className="decision-card" key={r.id}>
                              <ShieldCheck size={35} />
                              <h2>{r.data.title}</h2>
                              <p>{r.data.reference}</p>
                              <p>{r.data.description}</p>
                              <span className="tiny muted">
                                This demo record is not an official grant or
                                distribution order.
                              </span>
                            </div>
                          ))
                        ) : (
                          <Empty
                            title="No decision recorded"
                            description="Resolve queries and record the simulated hearing before issuing an order."
                            action={
                              detail.estate.stage === 3 ? (
                                <Button
                                  onClick={() =>
                                    caseAction(
                                      "decision",
                                      "Issue simulated distribution order",
                                      [
                                        {
                                          key: "reason",
                                          label: "Decision and review notes",
                                          type: "textarea",
                                          required: true,
                                        },
                                      ],
                                      "Issue simulated order",
                                    )
                                  }
                                >
                                  <ShieldCheck size={16} />
                                  Record simulated decision
                                </Button>
                              ) : undefined
                            }
                          />
                        )}
                      </section>
                    )}
                    {["Activity", "Updates", "History"].includes(
                      currentTab,
                    ) && (
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Case history</h2>
                          <Badge>Evidence-based updates</Badge>
                        </div>
                        <Timeline records={records.activity || []} />
                      </section>
                    )}
                  </>
                ) : (
                  <Loading />
                )
              ) : (
                <>
                  {view === "Dashboard" && (
                    <>
                      <PageHeading
                        eyebrow={
                          family
                            ? "YOUR FAMILY WORKSPACE"
                            : officer
                              ? "AGENCY WORKSPACE"
                              : "YOUR LEGAL WORKSPACE"
                        }
                        title={`${t("Good morning")}, ${user.name.split(" ")[0]}.`}
                        description={
                          family
                            ? t("Your next steps, all in one place.")
                            : officer
                              ? "A clear view of every application that needs you."
                              : "Here’s what’s happening with your estate cases today."
                        }
                        action={
                          lawyer ? (
                            <Button onClick={newCase}>
                              <Plus size={17} />
                              {t("New estate case")}
                            </Button>
                          ) : family ? (
                            <Button
                              kind="secondary"
                              onClick={() =>
                                setIntake({ data: {}, status: "draft" })
                              }
                            >
                              <Plus size={17} />
                              {t("Start an enquiry")}
                            </Button>
                          ) : undefined
                        }
                      />
                      <div className="welcome-panel">
                        <div className="welcome-copy">
                          <span className="eyebrow">
                            <span className="little-line" />
                            {family
                              ? "ONE FAMILY. ONE SHARED JOURNEY."
                              : "THOUGHTFUL WORK. MEANINGFUL PROGRESS."}
                          </span>
                          <h2>
                            {family
                              ? t("A clear path forward.")
                              : officer
                                ? "Every decision moves a family forward."
                                : t("Every family deserves clarity.")}
                          </h2>
                          <p>
                            {family
                              ? "Your documents, next steps and case updates, brought together. You don’t have to navigate this alone."
                              : officer
                                ? "Review the evidence, make the next step clear, and keep everyone informed."
                                : "Bring the people, paperwork and progress together. Help families move forward, one considered step at a time."}
                          </p>
                          <button
                            className="hero-link"
                            onClick={() =>
                              lawyer
                                ? navigate("Cases")
                                : officer
                                  ? navigate("Applications")
                                  : primaryEstate
                                    ? openCase(primaryEstate.id)
                                    : setIntake({ data: {}, status: "draft" })
                            }
                          >
                            {family
                              ? primaryEstate
                                ? t("Continue to case")
                                : t("Start an enquiry")
                              : officer
                                ? "View assigned applications"
                                : "View your cases"}
                            <ArrowRight size={16} />
                          </button>
                        </div>
                        <div className="welcome-art" aria-hidden="true">
                          <div className="orbit orbit-one" />
                          <div className="orbit orbit-two" />
                          <div className="art-dot dot-one" />
                          <div className="art-dot dot-two" />
                          <div className="art-document">
                            <span className="art-icon">
                              <ShieldCheck size={28} />
                            </span>
                            <div className="art-line" />
                            <div className="art-line short" />
                            <div className="art-check">
                              <span>
                                <Check size={13} />
                              </span>
                              <i />
                            </div>
                            <div className="art-check">
                              <span>
                                <Check size={13} />
                              </span>
                              <i />
                            </div>
                            <div className="art-check">
                              <span className="unfilled" />
                              <i />
                            </div>
                          </div>
                          <div className="art-float">
                            <CheckCircle2 size={17} />
                            <span>A step closer, together.</span>
                          </div>
                        </div>
                      </div>
                      <div className="stats-grid">
                        <Stat
                          icon={FolderOpen}
                          label={t(officer ? "Applications" : "Active cases")}
                          value={
                            overview.estates.filter((e: Estate) => e.stage < 6)
                              .length
                          }
                          caption={
                            family
                              ? "Your shared estate workspaces"
                              : "Across your workspace"
                          }
                          color="blue"
                        />
                        <Stat
                          icon={Clock3}
                          label={t("Needs attention")}
                          value={overview.estates.reduce(
                            (n: number, e: Estate) => n + e.tasks_count,
                            0,
                          )}
                          caption={
                            family
                              ? "Requests assigned to you"
                              : "Open case tasks"
                          }
                          color="amber"
                        />
                        <Stat
                          icon={lawyer ? MessagesSquare : CheckCircle2}
                          label={t(lawyer ? "New enquiries" : "Asset progress")}
                          value={
                            lawyer
                              ? overview.intakes.filter(
                                  (i: any) => i.status === "submitted",
                                ).length
                              : overview.estates.reduce(
                                  (n: number, e: Estate) =>
                                    n + e.released_count,
                                  0,
                                )
                          }
                          caption={
                            lawyer
                              ? "Families waiting for a response"
                              : "Assets with release recorded"
                          }
                          color="green"
                        />
                      </div>
                      <div className="dashboard-columns">
                        <section className="panel">
                          <div className="panel-heading">
                            <div>
                              <h2>
                                {family
                                  ? t("Your estate workspace")
                                  : officer
                                    ? "Assigned applications"
                                    : "Active estate cases"}
                              </h2>
                              <p className="tiny muted">
                                {family
                                  ? "Your family’s information and progress, together."
                                  : "A shared view of the next step for every family."}
                              </p>
                            </div>
                            <button
                              className="text-link"
                              onClick={() =>
                                navigate(officer ? "Applications" : "Cases")
                              }
                            >
                              {t("View all")}
                              <ArrowRight size={14} />
                            </button>
                          </div>
                          <CasesTable
                            estates={overview.estates.slice(0, 4)}
                            open={openCase}
                            language={language}
                          />
                        </section>
                        <section className="panel">
                          <div className="panel-heading">
                            <h2>{lawyer ? "New enquiries" : "Your updates"}</h2>
                            <span className="mini-icon">
                              <Bell size={17} />
                            </span>
                          </div>
                          {lawyer
                            ? overview.intakes
                                .filter((i: any) => i.status === "submitted")
                                .slice(0, 3)
                                .map((i: any) => (
                                  <button
                                    className="enquiry-preview"
                                    key={i.id}
                                    onClick={() => navigate("Enquiries")}
                                  >
                                    <span className="avatar soft-avatar">
                                      {initials(i.applicant.name)}
                                    </span>
                                    <div className="grow">
                                      <strong>{i.applicant.name}</strong>
                                      <p>Estate of {i.data.deceased}</p>
                                      <span className="tiny muted">
                                        Awaiting your review
                                      </span>
                                    </div>
                                    <ArrowUpRight size={17} />
                                  </button>
                                ))
                            : overview.notifications
                                .slice(0, 3)
                                .map((n: CaseRecord) => (
                                  <div className="notice-preview" key={n.id}>
                                    <span className="notice-dot" />
                                    <div>
                                      <strong>{n.data.title}</strong>
                                      <p>{n.data.detail}</p>
                                    </div>
                                  </div>
                                ))}
                          {(lawyer
                            ? !overview.intakes.some(
                                (i: any) => i.status === "submitted",
                              )
                            : !overview.notifications.length) && (
                            <Empty
                              title={
                                officer
                                  ? "Ready when you are"
                                  : "You’re up to date"
                              }
                              description={
                                officer
                                  ? "Submitted applications will bring new activity here."
                                  : "New updates will appear here."
                              }
                            />
                          )}
                          <div className="panel-footer">
                            <button
                              className="text-link"
                              onClick={() =>
                                navigate(lawyer ? "Enquiries" : "Notifications")
                              }
                            >
                              {lawyer ? "View enquiries" : "All notifications"}
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </section>
                      </div>
                      {family && overview.intakes.length > 0 && (
                        <section className="panel">
                          <div className="panel-heading">
                            <h2>Your enquiries</h2>
                          </div>
                          {overview.intakes.map((i: any) => (
                            <div className="submission-row" key={i.id}>
                              <MessagesSquare size={20} />
                              <div className="grow">
                                <strong>
                                  {i.data.deceased || "Draft estate enquiry"}
                                </strong>
                                <p>
                                  {i.response ||
                                    "Your assigned lawyer will respond here."}
                                </p>
                              </div>
                              <Badge tone={tone(i.status)}>
                                {human(i.status)}
                              </Badge>
                              {["draft", "information_requested"].includes(
                                i.status,
                              ) && (
                                <Button
                                  kind="secondary"
                                  onClick={() => setIntake(i)}
                                >
                                  Continue
                                </Button>
                              )}
                              {i.estate_id && (
                                <Button
                                  kind="secondary"
                                  onClick={() => openCase(i.estate_id)}
                                >
                                  Open case
                                </Button>
                              )}
                            </div>
                          ))}
                        </section>
                      )}
                    </>
                  )}
                  {["Cases", "Applications"].includes(view) && (
                    <>
                      <PageHeading
                        eyebrow="SHARED CASE MANAGEMENT"
                        title={t(view)}
                        description={
                          officer
                            ? "Only submissions assigned to your office appear here."
                            : "The people, evidence and next steps behind every estate."
                        }
                        action={
                          lawyer ? (
                            <Button onClick={newCase}>
                              <Plus size={17} />
                              {t("New estate case")}
                            </Button>
                          ) : undefined
                        }
                      />
                      <section className="panel">
                        <div className="table-toolbar">
                          <div className="search-input">
                            <Search size={17} />
                            <input
                              aria-label="Search cases"
                              placeholder={t("Search cases")}
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>
                          <span className="tiny muted">
                            {overview.estates.length} cases in your workspace
                          </span>
                        </div>
                        <CasesTable
                          estates={overview.estates.filter((e: Estate) =>
                            `${e.deceased} ${e.reference}`
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                          )}
                          open={openCase}
                          language={language}
                        />
                      </section>
                    </>
                  )}
                  {view === "Enquiries" && (
                    <>
                      <PageHeading
                        eyebrow="THE FIRST STEP"
                        title={t("Enquiries")}
                        description="Welcome new families into a clearer estate journey."
                      />
                      <div className="enquiry-grid">
                        {overview.intakes.map((i: any) => (
                          <section className="panel enquiry-card" key={i.id}>
                            <div className="enquiry-card-head">
                              <span className="avatar large-avatar">
                                {initials(i.applicant.name)}
                              </span>
                              <Badge tone={tone(i.status)}>
                                {human(i.status)}
                              </Badge>
                            </div>
                            <h2>{i.applicant.name}</h2>
                            <p className="tiny muted">{i.applicant.email}</p>
                            <h3>Estate of {i.data.deceased}</h3>
                            <p>
                              {i.data.story ||
                                "No additional circumstances provided."}
                            </p>
                            <div className="enquiry-meta">
                              <span>{i.data.jurisdiction}</span>
                              <span>{i.data.religion}</span>
                              <span>{dateLabel(i.created)}</span>
                            </div>
                            {i.response && (
                              <div className="response">{i.response}</div>
                            )}
                            {["submitted", "information_requested"].includes(
                              i.status,
                            ) && (
                              <div className="enquiry-actions">
                                <Button
                                  onClick={async () => {
                                    try {
                                      const result = await mutate(
                                        `/intakes/${i.id}/review`,
                                        { action: "accept" },
                                        "Enquiry accepted",
                                      );
                                      openCase(result.estate_id);
                                    } catch {}
                                  }}
                                >
                                  Accept enquiry <ArrowRight size={16} />
                                </Button>
                                <Button
                                  kind="secondary"
                                  onClick={() =>
                                    ask({
                                      title: "Request more information",
                                      fields: [
                                        {
                                          key: "reason",
                                          label:
                                            "What does the family need to provide?",
                                          type: "textarea",
                                          required: true,
                                        },
                                      ],
                                      submit: "Send request",
                                      run: (v) =>
                                        mutate(
                                          `/intakes/${i.id}/review`,
                                          { action: "request", data: v },
                                          "Information request sent",
                                        ),
                                    })
                                  }
                                >
                                  Request information
                                </Button>
                                <button
                                  className="text-link muted tiny"
                                  onClick={() =>
                                    ask({
                                      title: "Decline enquiry",
                                      fields: [
                                        {
                                          key: "reason",
                                          label: "Reason for declining",
                                          type: "textarea",
                                          required: true,
                                        },
                                      ],
                                      submit: "Decline enquiry",
                                      run: (v) =>
                                        mutate(
                                          `/intakes/${i.id}/review`,
                                          { action: "decline", data: v },
                                          "Enquiry declined",
                                        ),
                                    })
                                  }
                                >
                                  Decline with a reason
                                </button>
                              </div>
                            )}
                            {i.estate_id && (
                              <Button
                                kind="secondary"
                                onClick={() => openCase(i.estate_id)}
                              >
                                View estate case <ArrowRight size={15} />
                              </Button>
                            )}
                          </section>
                        ))}
                      </div>
                      {!overview.intakes.length && (
                        <Empty
                          title="No enquiries waiting"
                          description="New families can create an account and send an intake request."
                        />
                      )}
                    </>
                  )}
                  {["Notifications", "Updates"].includes(view) && (
                    <>
                      <PageHeading
                        eyebrow="STAY IN THE LOOP"
                        title={t("Notifications")}
                        description="Meaningful updates from your shared estate workspace."
                      />
                      <section className="panel">
                        {overview.notifications.map((n: CaseRecord) => (
                          <button
                            className={`notification-row ${!n.data.read ? "unread" : ""}`}
                            key={n.id}
                            onClick={async () => {
                              try {
                                await mutate(
                                  `/records/${n.id}/action`,
                                  { action: "read" },
                                  "Notification marked as read",
                                );
                                openCase(n.estate_id);
                              } catch {}
                            }}
                          >
                            <span className="notification-icon">
                              <Bell size={19} />
                            </span>
                            <div className="grow">
                              <strong>{n.data.title}</strong>
                              <p>{n.data.detail}</p>
                              <span className="tiny muted">
                                {dateLabel(n.created)}
                              </span>
                            </div>
                            {!n.data.read && <span className="notice-dot" />}
                            <ChevronRight size={17} />
                          </button>
                        ))}
                        {!overview.notifications.length && (
                          <Empty
                            title="You’re up to date"
                            description="Case requests, decisions and updates will appear here."
                          />
                        )}
                      </section>
                    </>
                  )}
                  {view === "Hearings" && (
                    <>
                      <PageHeading
                        eyebrow="UPCOMING APPOINTMENTS"
                        title={t("Hearings")}
                        description="Open an assigned application to review or schedule its hearing."
                      />
                      <section className="panel">
                        <CasesTable
                          estates={overview.estates}
                          open={(id) => openCase(id, "Hearing")}
                          language={language}
                        />
                      </section>
                    </>
                  )}
                  {family &&
                    ["My tasks", "Documents", "Assets"].includes(view) && (
                      <Empty
                        title="Your workspace starts with a case"
                        description="Accept a lawyer’s invitation or send a public enquiry to get started."
                        action={
                          <Button
                            onClick={() =>
                              setIntake({ data: {}, status: "draft" })
                            }
                          >
                            Start an enquiry <ArrowRight size={16} />
                          </Button>
                        }
                      />
                    )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <footer className="page-footer">
            <span>
              <Logo compact />
              Estate Unlock <i>·</i> A clear path forward.
            </span>
            <span>
              Demonstration only <i>·</i>
              <button onClick={() => setInfo(true)}>
                About this demo <ArrowUpRight size={12} />
              </button>
            </span>
          </footer>
        </main>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle2 size={19} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {dialog && <FormDialog dialog={dialog} onClose={() => setDialog(null)} />}
      {intake && (
        <IntakeDialog
          intake={intake}
          onClose={() => setIntake(null)}
          onSave={async (saved) => {
            await refresh();
            notify(
              saved.status === "submitted"
                ? "Enquiry submitted to the law firm"
                : "Draft saved",
            );
            setIntake(null);
          }}
        />
      )}
      {upload && detail && (
        <UploadDialog
          previous={upload === "new" ? null : upload}
          estateId={detail.estate.id}
          onClose={() => setUpload(null)}
          onSave={async () => {
            setUpload(null);
            setDocument(null);
            await refresh(caseId);
            notify("Document uploaded. Your lawyer can now review it.");
          }}
        />
      )}
      {document && (
        <Modal title={document.category} wide onClose={() => setDocument(null)}>
          <div className="document-preview-layout">
            <iframe
              src={`/api/documents/${document.id}/file`}
              title={`${document.category} preview`}
            />
            <div className="document-review">
              <Badge tone={tone(document.status)}>
                {human(document.status)}
              </Badge>
              <h3>{document.name}</h3>
              <p>
                Revision {document.revision} ·{" "}
                {document.visibility === "private"
                  ? "Private document"
                  : "Shared case document"}
              </p>
              {document.comment && (
                <div className="response">{document.comment}</div>
              )}
              <a
                href={`/api/documents/${document.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="btn secondary"
              >
                <ExternalLink size={15} />
                Open original
              </a>
              {lawyer && (
                <>
                  <Button
                    onClick={async () => {
                      try {
                        await mutate(
                          `/documents/${document.id}/review`,
                          { action: "accepted" },
                          "Document accepted",
                        );
                        setDocument(null);
                      } catch {}
                    }}
                  >
                    Mark accepted <Check size={16} />
                  </Button>
                  <Button
                    kind="secondary"
                    onClick={() => {
                      const doc = document;
                      setDocument(null);
                      ask({
                        title: "Request a document correction",
                        fields: [
                          {
                            key: "comment",
                            label: "What needs to change?",
                            type: "textarea",
                            required: true,
                          },
                        ],
                        submit: "Send correction request",
                        run: (v) =>
                          mutate(
                            `/documents/${doc.id}/review`,
                            { action: "correction_requested", data: v },
                            "Correction request sent",
                          ),
                      });
                    }}
                  >
                    Request correction
                  </Button>
                  <Button
                    kind="ghost"
                    onClick={async () => {
                      try {
                        await mutate(
                          `/documents/${document.id}/review`,
                          { action: "under_review" },
                          "Document under review",
                        );
                        setDocument(null);
                      } catch {}
                    }}
                  >
                    Mark under review
                  </Button>
                </>
              )}
              {!officer && (lawyer || document.owner_id === user.id) && (
                <Button
                  kind="secondary"
                  onClick={() => {
                    setUpload(document);
                    setDocument(null);
                  }}
                >
                  <Upload size={15} />
                  Upload new revision
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {inviteLink && (
        <Modal
          title="Your invitation is ready"
          onClose={() => setInviteLink("")}
        >
          <div className="modal-body">
            <span className="success-orbit">
              <Mail size={29} />
            </span>
            <p>
              Share this link with the invited family member. They must sign in
              using the invited email address.
            </p>
            <div className="copy-field">
              <input aria-label="Invitation link" readOnly value={inviteLink} />
              <Button
                kind="secondary"
                onClick={() =>
                  navigator.clipboard
                    .writeText(inviteLink)
                    .then(() => notify("Invitation link copied"))
                    .catch(() => notify("Select the link and copy it manually"))
                }
              >
                <Copy size={15} />
                Copy
              </Button>
            </div>
            <p className="tiny muted">
              No email is sent in this demonstration.
            </p>
          </div>
        </Modal>
      )}
      {invitation && (
        <Modal title="You’ve been invited" onClose={() => setInvitation(null)}>
          <div className="modal-body">
            <span className="success-orbit">
              <Users size={28} />
            </span>
            <h3>Estate of {invitation.deceased}</h3>
            <p>This invitation is for {invitation.email}.</p>
            <Button
              onClick={async () => {
                try {
                  const result = await api(
                    `/invitations/${invitation.token}/accept`,
                    "POST",
                  );
                  setInvitation(null);
                  history.replaceState({}, "", "/");
                  await refresh();
                  openCase(result.estate_id);
                  notify("Welcome to your family workspace");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Accept invitation <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {info && (
        <Modal title="A clearer estate journey" onClose={() => setInfo(false)}>
          <div className="modal-body guidance">
            <ShieldCheck size={32} />
            <p>
              Estate Unlock brings family tasks, professional review and
              application progress into one shared workspace.
            </p>
            <h3>How this demonstration works</h3>
            <p>
              Use the seeded accounts to follow a fictional Muslim small estate.
              Upload documents, resolve requests and record simulated agency
              decisions. No official application or payment is sent.
            </p>
            <h3>Your next step</h3>
            <p>
              Check the highlighted request on your case overview. Every request
              shows who is responsible and what evidence is needed.
            </p>
            <h3>Professional review matters</h3>
            <p>
              Asset values and entitlements are illustrative. Jurisdiction,
              nomination and legal authority must be verified by the appropriate
              professional and authority.
            </p>
            <a
              className="text-link"
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
            >
              Developer API reference <ExternalLink size={14} />
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  caption,
  color,
}: {
  icon: typeof Home;
  label: string;
  value: number;
  caption: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={19} />
        </span>
      </div>
      <strong>{String(value).padStart(2, "0")}</strong>
      <p>{caption}</p>
    </div>
  );
}
function CasesTable({
  estates,
  open,
  language,
}: {
  estates: Estate[];
  open: (id: number) => void;
  language: string;
}) {
  return estates.length ? (
    <div className="table-scroll">
      <table className="case-table">
        <thead>
          <tr>
            <th>ESTATE / CASE</th>
            <th>CURRENT STAGE</th>
            <th>JURISDICTION</th>
            <th aria-label="Open case" />
          </tr>
        </thead>
        <tbody>
          {estates.map((e) => (
            <tr key={e.id}>
              <td>
                <button className="estate-name" onClick={() => open(e.id)}>
                  <span className="estate-monogram">
                    {initials(e.deceased)}
                  </span>
                  <span>
                    <strong>{e.deceased}</strong>
                    <small>{e.reference}</small>
                  </span>
                </button>
              </td>
              <td>
                <Badge
                  tone={
                    e.stage === 6 ? "green" : e.stage === 1 ? "amber" : "blue"
                  }
                >
                  {translate(
                    e.stage === 6 ? "Completed" : stages[e.stage],
                    language,
                  )}
                </Badge>
              </td>
              <td className="muted">{e.jurisdiction}</td>
              <td>
                <button
                  className="icon-btn table-arrow"
                  aria-label={`Open estate of ${e.deceased}`}
                  onClick={() => open(e.id)}
                >
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="No cases to show"
      description="Accepted enquiries and assigned applications will appear here."
    />
  );
}
function Timeline({ records }: { records: CaseRecord[] }) {
  return records.length ? (
    <div className="timeline">
      {records.map((r, i) => (
        <div className="timeline-item" key={r.id}>
          <span className={`timeline-marker ${i === 0 ? "latest" : ""}`}>
            {i === 0 ? <Check size={11} /> : null}
          </span>
          <div>
            <strong>{r.data.title}</strong>
            <p>{r.data.detail}</p>
            <small>
              {r.data.actor} <span>·</span> {dateLabel(r.created)}
            </small>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty
      title="The journey starts here"
      description="Confirmed case activity will appear in this history."
    />
  );
}
function SnapshotSummary({ submission }: { submission: any }) {
  return submission ? (
    <div className="snapshot-summary">
      <div>
        <span>Submission revision</span>
        <strong>{submission.revision}</strong>
      </div>
      <div>
        <span>Published documents</span>
        <strong>{submission.snapshot.document_ids.length}</strong>
      </div>
      <div>
        <span>Estate inventory</span>
        <strong>
          {
            submission.snapshot.records.filter((r: any) => r.kind === "asset")
              .length
          }{" "}
          assets
        </strong>
      </div>
      <p>
        The agency view is based on the published submission. Private
        professional notes and later uploads are excluded.
      </p>
    </div>
  ) : (
    <Empty title="No submission" />
  );
}

function FormDialog({
  dialog,
  onClose,
}: {
  dialog: Dialog;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        dialog.fields.map((f) => [
          f.key,
          f.value || f.options?.[0]?.value || "",
        ]),
      ),
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title={dialog.title} onClose={onClose}>
      <form
        className="modal-body form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await dialog.run(values);
            onClose();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {dialog.description && <p>{dialog.description}</p>}
        <ErrorBox message={error} />
        {dialog.fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === "textarea" ? (
              <textarea
                value={values[f.key]}
                required={f.required}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            ) : f.type === "select" ? (
              <select
                value={values[f.key]}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              >
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "0.01" : undefined}
                value={values[f.key]}
                required={f.required}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            )}
          </Field>
        ))}
        <div className="modal-actions">
          <Button kind="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : dialog.submit}
            <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UploadDialog({
  previous,
  estateId,
  onClose,
  onSave,
}: {
  previous: Document | null;
  estateId: number;
  onClose: () => void;
  onSave: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [category, setCategory] = useState(
      previous?.category || "Supporting document",
    ),
    [visibility, setVisibility] = useState(previous?.visibility || "shared"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={previous ? "Upload a new revision" : "Upload a document"}
      onClose={onClose}
    >
      <form
        className="modal-body form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!file) {
            setError("Choose a document to upload.");
            return;
          }
          setBusy(true);
          const data = new FormData();
          data.append("file", file);
          data.append("category", category);
          data.append("visibility", visibility);
          if (previous) data.append("supersedes_id", String(previous.id));
          try {
            await api(`/cases/${estateId}/documents`, "POST", data);
            onSave();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ErrorBox message={error} />
        <div className="upload-zone">
          <Upload size={30} />
          <strong>{file ? file.name : "Choose your document"}</strong>
          <p>PDF, PNG, JPEG or text · up to 10 MB</p>
          <input
            aria-label="Choose document file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <Field label="Document category">
          <input
            required
            value={category}
            disabled={!!previous}
            onChange={(e) => setCategory(e.target.value)}
          />
        </Field>
        <Field
          label="Who can see this?"
          hint="Private documents are visible only to the owner and the assigned law firm."
        >
          <select
            value={visibility}
            disabled={!!previous}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="shared">Shared with the case</option>
            <option value="private">Private to me and my lawyer</option>
          </select>
        </Field>
        {previous && (
          <p className="tiny muted">
            Revision {previous.revision} remains in the history. This creates
            revision {previous.revision + 1}.
          </p>
        )}
        <div className="modal-actions">
          <Button kind="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Upload document"}
            <Upload size={15} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function IntakeDialog({
  intake,
  onClose,
  onSave,
}: {
  intake: any;
  onClose: () => void;
  onSave: (v: any) => void;
}) {
  const [data, setData] = useState<any>({
      jurisdiction: "Kuala Lumpur",
      religion: "Muslim",
      ...intake.data,
    }),
    [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [draftId, setDraftId] = useState<number | undefined>(intake.id);
  const update = (key: string, value: any) =>
    setData({
      ...data,
      [key]: value,
      confirmed: key === "confirmed" ? value : false,
    });
  const save = async (submit: boolean) => {
    setBusy(true);
    setError("");
    try {
      const saved = await api(
        draftId ? `/intakes/${draftId}` : "/intakes",
        draftId ? "PUT" : "POST",
        { data, submit },
      );
      setDraftId(saved.id);
      onSave(saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Tell us about the estate" wide onClose={onClose}>
      <div className="modal-body intake-body">
        <div className="intake-progress">
          {["Circumstances", "Estate details", "Review & send"].map((s, i) => (
            <button
              className={step === i ? "active" : ""}
              key={s}
              onClick={() => setStep(i)}
            >
              <span>{i < step ? <Check size={12} /> : i + 1}</span>
              {s}
            </button>
          ))}
        </div>
        <ErrorBox message={error} />
        {intake.response && (
          <div className="response">
            <strong>Your lawyer requested:</strong> {intake.response}
          </div>
        )}
        {step === 0 && (
          <div className="form-stack">
            <div>
              <h3>A few words can be a good start.</h3>
              <p>
                Tell us what happened and where you need help. You can come back
                to this later.
              </p>
            </div>
            <Field label="Your circumstances">
              <textarea
                rows={5}
                placeholder="My father passed away. He left a house and some savings, and I’m not sure where to start…"
                value={data.story || ""}
                onChange={(e) => update("story", e.target.value)}
              />
            </Field>
            <button
              className="extract-button"
              onClick={() => {
                setData({
                  ...data,
                  deceased: data.deceased || "Ahmad bin Abdullah",
                  jurisdiction: "Kuala Lumpur",
                  religion: "Muslim",
                  assets:
                    data.assets ||
                    "Family home, bank savings, ASNB units and a vehicle",
                  demo_extraction: true,
                  confirmed: false,
                });
                setStep(1);
              }}
            >
              <Sparkles size={18} />
              <span>
                <strong>Try the assisted intake example</strong>
                <small>
                  Simulated extraction · uses the fictional demo scenario
                </small>
              </span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}
        {step === 1 && (
          <div className="form-stack">
            {data.demo_extraction && (
              <div className="info-box">
                <Sparkles size={17} />
                These are fictional example facts. Edit them before confirming.
              </div>
            )}
            <div className="form-grid">
              <Field label="Name of the deceased">
                <input
                  value={data.deceased || ""}
                  onChange={(e) => update("deceased", e.target.value)}
                />
              </Field>
              <Field label="Date of death">
                <input
                  type="date"
                  value={data.death_date || ""}
                  onChange={(e) => update("death_date", e.target.value)}
                />
              </Field>
              <Field label="Jurisdiction">
                <input
                  value={data.jurisdiction}
                  onChange={(e) => update("jurisdiction", e.target.value)}
                />
              </Field>
              <Field label="Religion">
                <select
                  value={data.religion}
                  onChange={(e) => update("religion", e.target.value)}
                >
                  <option>Muslim</option>
                  <option>Non-Muslim</option>
                  <option>Not sure</option>
                </select>
              </Field>
            </div>
            <Field label="Known family members">
              <textarea
                value={data.family || ""}
                placeholder="Spouse, children, parents and any family members overseas…"
                onChange={(e) => update("family", e.target.value)}
              />
            </Field>
            <Field label="Known assets">
              <textarea
                value={data.assets || ""}
                onChange={(e) => update("assets", e.target.value)}
                placeholder="Property, accounts, investments, vehicles…"
              />
            </Field>
            <Field label="Will or nomination information">
              <select
                value={data.nomination || "Not sure"}
                onChange={(e) => update("nomination", e.target.value)}
              >
                <option>Not sure</option>
                <option>Documents available for lawyer review</option>
                <option>No known documents</option>
              </select>
            </Field>
            <Field label="Known documents">
              <input
                value={data.documents || ""}
                onChange={(e) => update("documents", e.target.value)}
                placeholder="Death certificate, title, bank statements…"
              />
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="form-stack">
            <h3>Review your enquiry</h3>
            <div className="review-facts">
              <strong>{data.deceased || "Name not entered"}</strong>
              <p>
                {data.jurisdiction} · {data.religion}
              </p>
              <p>{data.story || "No circumstances entered."}</p>
              <p>
                <strong>Family:</strong> {data.family || "To be confirmed"}
              </p>
              <p>
                <strong>Assets:</strong> {data.assets || "To be confirmed"}
              </p>
              <p>
                <strong>Documents:</strong>{" "}
                {data.documents || "To be confirmed"}
              </p>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!data.confirmed}
                onChange={(e) => update("confirmed", e.target.checked)}
              />
              <span>
                I have reviewed these facts. Any uncertainty is recorded for the
                lawyer to check.
              </span>
            </label>
            <p className="tiny muted">
              Your enquiry will be sent to Rahman & Partners’ demo intake queue.
              This does not submit an official estate application.
            </p>
          </div>
        )}
        <div className="modal-actions">
          <Button kind="secondary" disabled={busy} onClick={() => save(false)}>
            Save draft
          </Button>
          <div className="button-row">
            {step > 0 && (
              <Button kind="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)}>
                Continue <ArrowRight size={15} />
              </Button>
            ) : (
              <Button
                disabled={busy || !data.confirmed || !data.deceased}
                onClick={() => save(true)}
              >
                {busy ? "Sending…" : "Send enquiry"}
                <Send size={15} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AuthScreen({
  onLogin,
  language,
  setLanguage,
}: {
  onLogin: (user: User) => Promise<void>;
  language: string;
  setLanguage: (lang: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login"),
    [email, setEmail] = useState("sarah@demo.my"),
    [password, setPassword] = useState("Demo2026!"),
    [name, setName] = useState(""),
    [selected, setSelected] = useState("Lawyer"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [invite, setInvite] = useState(""),
    [showInvite, setShowInvite] = useState(false);
  const t = (s: string) => translate(s, language);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("invite")) {
      setEmail("");
      setPassword("");
      setSelected("Family");
    }
  }, []);
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Logo />
        <div className="auth-story-content">
          <Badge tone="glass">FOR THE PEOPLE WHO MATTER</Badge>
          <h1>
            A little clarity.
            <br />A shared journey.
            <br />
            <span>A way forward.</span>
          </h1>
          <p>
            Bring families, legal professionals and estate processing together.
            Every document, every next step, every meaningful update.
          </p>
          <div className="auth-progress-card">
            <div>
              <span className="success-orbit">
                <ShieldCheck size={22} />
              </span>
              <div>
                <strong>Estate of Ahmad bin Abdullah</strong>
                <small>Family workspace · EU-2026-0042</small>
              </div>
              <span className="live-dot" />
            </div>
            <div className="auth-mini-steps">
              <span className="complete">
                <Check size={12} />
              </span>
              <i />
              <span className="complete">
                <Check size={12} />
              </span>
              <i />
              <span className="current" />
              <i />
              <span />
            </div>
            <p>
              <span>One clear next step.</span>
              <span>One shared source of truth.</span>
            </p>
          </div>
          <div className="auth-trust">
            <ShieldCheck size={17} />
            <span>Thoughtful by design. Connected by purpose.</span>
          </div>
        </div>
        <div className="auth-story-footer">
          ESTATE UNLOCK <span>DESIGNED TO MOVE FAMILIES FORWARD</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-top">
          <span className="demo-pill">
            <span />
            Proof of concept
          </span>
          <button
            className="language-button"
            onClick={() => setLanguage(language === "en" ? "bm" : "en")}
          >
            <Globe2 size={15} />
            {language === "en" ? "EN" : "BM"}
          </button>
        </div>
        <div className="auth-form-wrap">
          <div className="eyebrow">YOUR SHARED ESTATE WORKSPACE</div>
          <h2>
            {t(mode === "login" ? "Welcome back" : "Create account")}
            <span className="heading-dot">.</span>
          </h2>
          <p>
            {mode === "login"
              ? "Sign in to see what’s next and keep things moving."
              : "Start an enquiry or accept your lawyer’s invitation."}
          </p>
          <div className="auth-mode">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              {t("Sign in")}
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setEmail("");
                setPassword("");
              }}
            >
              {t("Create account")}
            </button>
          </div>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setBusy(true);
              try {
                const u = await api<User>(`/auth/${mode}`, "POST", {
                  email,
                  password,
                  name,
                });
                await onLogin(u);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ErrorBox message={error} />
            {mode === "register" && (
              <Field label={t("Full name")}>
                <input
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            )}
            <Field label="Email address">
              <div className="input-icon">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </Field>
            <Field
              label={t("Password")}
              hint={
                mode === "register" ? "Use at least 8 characters." : undefined
              }
            >
              <div className="input-icon">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
            </Field>
            <Button type="submit" disabled={busy} className="full-width">
              {busy
                ? "Opening your workspace…"
                : t(mode === "login" ? "Sign in" : "Create account")}
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="demo-accounts">
            <div className="demo-divider">
              <span>EXPLORE THE DEMO</span>
            </div>
            <div className="demo-role-grid">
              {accounts.map((a) => (
                <button
                  key={a.role}
                  className={selected === a.role ? "selected" : ""}
                  onClick={() => {
                    setMode("login");
                    setSelected(a.role);
                    setEmail(a.email);
                    setPassword("Demo2026!");
                    setError("");
                  }}
                >
                  <a.icon size={21} />
                  <strong>{t(a.role)}</strong>
                  <small>{a.name.split(" ")[0]}</small>
                  {selected === a.role && (
                    <span className="role-check">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="tiny muted">
              Choose a role to fill demo credentials, then sign in.
            </p>
          </div>
          <div className="entry-links">
            <button
              onClick={() => {
                setMode("register");
                setEmail("");
                setPassword("");
              }}
            >
              I need help with an estate <ArrowUpRight size={13} />
            </button>
            <button onClick={() => setShowInvite(!showInvite)}>
              I have an invitation <ArrowUpRight size={13} />
            </button>
          </div>
          {showInvite && (
            <form
              className="invitation-entry"
              onSubmit={(e) => {
                e.preventDefault();
                let token = invite;
                try {
                  token = new URL(invite).searchParams.get("invite") || invite;
                } catch {}
                location.href = `/?invite=${encodeURIComponent(token)}`;
              }}
            >
              <Field label="Paste your invitation link or token">
                <input
                  required
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                />
              </Field>
              <Button kind="secondary" type="submit">
                Open invitation
              </Button>
            </form>
          )}
        </div>
        <footer className="auth-footer">
          <ShieldCheck size={14} />
          Fictional data · Simulated agency processing · No real payments
        </footer>
      </section>
    </div>
  );
}
