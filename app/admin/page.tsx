"use client";

import { useState } from "react";
import { MetricBlock } from "@/components/admin/MetricBlock";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { UserTable } from "@/components/admin/UserTable";
import { AccessGrantDialog } from "@/components/admin/AccessGrantDialog";
import { PartnershipManager } from "@/components/admin/PartnershipManager";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

type AdminTab = "overview" | "users" | "access" | "partnerships" | "audit";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  created_at: string;
  email_verified: boolean;
  last_login_at: string | null;
  login_count: number;
  suspended_at: string | null;
  metadata: Record<string, unknown>;
  active_grants: number;
  currentModule: string;
  completionPct: number;
  lastActivity: string;
  status: "active" | "stuck" | "inactive";
}

interface Partnership {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string;
  contact_name: string | null;
  partner_type: string;
  status: "pending" | "active" | "suspended" | "terminated";
  modules: string[] | null;
  courses: string[] | null;
  max_seats: number | null;
  used_seats: number;
  access_grant_type: string;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  terminated_at: string | null;
  terminated_by: string | null;
  termination_reason: string | null;
  partnership_members: Array<{ count: number }>;
  users?: { name: string; email: string };
}

interface Module {
  id: string;
  code: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
}

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_identifier: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AdminMetrics {
  activeStudents: number;
  modulesCompletionRate: number;
  quizSuccessRate: number;
  assignmentApprovalRate: number;
  mentorshipUtilization: number;
}

export default function AdminCommandCenterPage() {
  // Metrics & static data — admin/content route handles live curriculum data
  const metrics: AdminMetrics = {
    activeStudents: 127,
    modulesCompletionRate: 68,
    quizSuccessRate: 74,
    assignmentApprovalRate: 82,
    mentorshipUtilization: 45,
  };

  const students: User[] = [
    { id: "1", name: "João Silva", email: "joao@email.com", role: "student", created_at: "2024-01-15", email_verified: true, last_login_at: "2024-12-20", login_count: 45, suspended_at: null, metadata: {}, active_grants: 2, currentModule: "Module II: Inventio", completionPct: 45, lastActivity: "2 days ago", status: "active" },
    { id: "2", name: "Maria Santos", email: "maria@email.com", role: "student", created_at: "2024-02-20", email_verified: true, last_login_at: "2024-12-22", login_count: 32, suspended_at: null, metadata: {}, active_grants: 1, currentModule: "Module III: Dispositio", completionPct: 72, lastActivity: "5 hours ago", status: "active" },
    { id: "3", name: "Admin User", email: "admin@liceu.com", role: "admin", created_at: "2023-01-01", email_verified: true, last_login_at: "2024-12-23", login_count: 120, suspended_at: null, metadata: {}, active_grants: 0, currentModule: "—", completionPct: 0, lastActivity: "1 hour ago", status: "active" },
  ];

  const mockModules: Module[] = [
    { id: "mod-1", code: "I", title: "Fundamentos da Mente Retórica" },
    { id: "mod-2", code: "II", title: "Inventio: A Arte de Descobrir Argumentos" },
    { id: "mod-3", code: "III", title: "Dispositio: A Arquitetura do Discurso" },
    { id: "mod-4", code: "IV", title: "Elocutio: Precisão, Ritmo e Força" },
    { id: "mod-5", code: "V", title: "Memória, Hábito e Aplicação Estratégica" },
    { id: "mod-6", code: "VI", title: "Pronuntiatio: A Voz e o Gesto" },
  ];

  const mockCourses: Course[] = [
    { id: "course-1", title: "Curso Completo de Retórica" },
    { id: "course-2", title: "Mentoria Avançada" },
  ];

  const mockPartnerships: Partnership[] = [
    { id: "part-1", name: "Universidade Federal", slug: "uf", description: "Parceria acadêmica para formação de oradores", contact_email: "contato@uf.edu.br", contact_name: "Prof. Silva", partner_type: "institution", status: "active", modules: ["mod-1", "mod-2", "mod-3"], courses: ["course-1"], max_seats: 100, used_seats: 15, access_grant_type: "partnership", settings: {}, metadata: {}, created_by: "admin-1", created_at: "2024-01-15", updated_at: "2024-01-15", activated_at: "2024-01-15", terminated_at: null, terminated_by: null, termination_reason: null, partnership_members: [{ count: 15 }], users: { name: "Admin", email: "admin@liceu.com" } },
    { id: "part-2", name: "Empresa Tech", slug: "tech", description: "Treinamento corporativo de comunicação", contact_email: "rh@tech.com", contact_name: "Ana RH", partner_type: "company", status: "pending", modules: ["mod-1"], courses: ["course-1"], max_seats: 50, used_seats: 0, access_grant_type: "course_bundle", settings: {}, metadata: {}, created_by: "admin-1", created_at: "2024-11-20", updated_at: "2024-11-20", activated_at: null, terminated_at: null, terminated_by: null, termination_reason: null, partnership_members: [{ count: 0 }], users: { name: "Admin", email: "admin@liceu.com" } },
  ];

  const mockAuditLogs: AuditLog[] = [
    { id: "audit-1", actor_id: "admin-1", actor_email: "admin@liceu.com", action: "user_created", target_type: "user", target_id: "user-1", target_identifier: "joao@email.com", old_values: null, new_values: { email: "joao@email.com", role: "student" }, metadata: {}, created_at: "2024-12-20T10:30:00Z" },
    { id: "audit-2", actor_id: "admin-1", actor_email: "admin@liceu.com", action: "access_granted", target_type: "access_grant", target_id: "grant-1", target_identifier: "user-1", old_values: null, new_values: { grant_type: "payment", modules: ["mod-1"] }, metadata: { source: "stripe" }, created_at: "2024-12-20T10:35:00Z" },
    { id: "audit-3", actor_id: "admin-1", actor_email: "admin@liceu.com", action: "partnership_created", target_type: "partnership", target_id: "part-1", target_identifier: "uf", old_values: null, new_values: { name: "Universidade Federal", status: "active" }, metadata: {}, created_at: "2024-12-19T14:20:00Z" },
  ];

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <AdminTabs 
        metrics={metrics}
        students={students}
        mockModules={mockModules}
        mockCourses={mockCourses}
        mockPartnerships={mockPartnerships}
        mockAuditLogs={mockAuditLogs}
      />
    </div>
  );
}

function AdminTabs({ 
  metrics, 
  students, 
  mockModules, 
  mockCourses, 
  mockPartnerships, 
  mockAuditLogs 
}: { 
  metrics: AdminMetrics;
  students: User[];
  mockModules: Module[];
  mockCourses: Course[];
  mockPartnerships: Partnership[];
  mockAuditLogs: AuditLog[];
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [showAccessGrantDialog, setShowAccessGrantDialog] = useState(false);
  const [editingGrant, setEditingGrant] = useState<any>(null);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <OverviewIcon /> },
    { id: "users", label: "Users", icon: <UsersIcon /> },
    { id: "access", label: "Access Control", icon: <AccessIcon /> },
    { id: "partnerships", label: "Partnerships", icon: <PartnershipsIcon /> },
    { id: "audit", label: "Audit Logs", icon: <AuditIcon /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-12">
      {/* Header */}
      <header className="border-b border-[var(--liceu-stone)] pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Liceu Underground / Command Center
            </div>
            <h1 className="font-serif text-[22px] leading-tight text-[var(--liceu-text)] mt-2">
              Trivium Mastery
            </h1>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-6 border-b border-[var(--liceu-stone)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2 py-2 font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.2em] transition-colors border-b-2 border-transparent ${
                activeTab === tab.id
                  ? "text-[var(--liceu-accent)] border-[var(--liceu-accent)]"
                  : "text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <AdminOverview metrics={metrics} students={students} />
      )}
      {activeTab === "users" && (
        <UserTable
          users={students}
          onSuspend={(user, suspend) => console.log("Suspend", user.id, suspend)}
          onRoleChange={(user, role) => console.log("Role change", user.id, role)}
          onDelete={(user) => console.log("Delete", user.id)}
          onViewGrants={(user) => { setEditingGrant(user); setShowAccessGrantDialog(true); }}
        />
      )}
      {activeTab === "access" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingGrant(null); setShowAccessGrantDialog(true); }}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider bg-[var(--liceu-accent)] text-[var(--liceu-primary)] font-bold hover:bg-[var(--liceu-accent)]/90 transition-colors"
            >
              New Grant
            </button>
          </div>
          <p className="text-[var(--liceu-muted)] text-sm">Access grants management - table view coming soon</p>
          <AccessGrantDialog
            open={showAccessGrantDialog}
            onClose={() => { setShowAccessGrantDialog(false); setEditingGrant(null); }}
            onSubmit={async (data) => { console.log("Create grant:", data); setShowAccessGrantDialog(false); }}
            editingGrant={editingGrant}
            users={students}
            modules={mockModules}
            courses={mockCourses}
          />
        </div>
      )}
      {activeTab === "partnerships" && (
        <PartnershipManager
          partnerships={mockPartnerships}
          modules={mockModules}
          courses={mockCourses}
          onCreate={async (data) => console.log("Create partnership:", data)}
          onUpdate={async (id, data) => console.log("Update partnership:", id, data)}
          onAddMember={async (partnershipId, userId) => console.log("Add member:", partnershipId, userId)}
          onRemoveMember={async (partnershipId, memberId, reason) => console.log("Remove member:", partnershipId, memberId, reason)}
          onActivate={async (id) => console.log("Activate:", id)}
          onTerminate={async (id, reason) => console.log("Terminate:", id, reason)}
        />
      )}
      {activeTab === "audit" && (
        <AuditLogViewer logs={mockAuditLogs} users={students} />
      )}
    </div>
  );
}

// Icons
function OverviewIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function UsersIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function AccessIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>; }
function PartnershipsIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20l-2-2m10 0l2-2" /></svg>; }
function AuditIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }

// Overview tab component
function AdminOverview({ metrics, students }: { metrics: AdminMetrics; students: User[] }) {
  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="font-[var(--font-noto-serif)] text-2xl font-black uppercase tracking-tight text-[var(--liceu-text)]">
            Trivium Mastery
          </h1>
          <div className="flex gap-4">
            <div className="bg-[var(--liceu-surface-container)] px-4 py-2 border-l-2 border-[var(--liceu-secondary)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                Active Initiates
              </div>
              <div className="font-[var(--font-space-grotesk)] text-2xl font-black text-[var(--liceu-text)] tabular-nums">
                {metrics.activeStudents}
              </div>
            </div>
            <div className="bg-[var(--liceu-surface-container)] px-4 py-2 border-l-2 border-[var(--liceu-accent)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                Quiz Success
              </div>
              <div className="font-[var(--font-space-grotesk)] text-2xl font-black text-[var(--liceu-text)] tabular-nums">
                {metrics.quizSuccessRate}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="group relative bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] overflow-hidden aspect-video">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liceu-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                      Modules
                    </div>
                    <div className="text-5xl font-black font-mono text-[var(--liceu-accent)]/20 mt-2">
                      {metrics.activeStudents}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                        Active learners
                      </span>
                      <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums">
                        {metrics.activeStudents}
                      </span>
                    </div>
                    <div className="h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                      <div className="h-full bg-[var(--liceu-accent)]" style={{ width: `${Math.min(100, metrics.activeStudents * 5)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] overflow-hidden aspect-video">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liceu-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                      Completion Rate
                    </div>
                    <div className="text-5xl font-black font-mono text-[var(--liceu-accent)]/20 mt-2">
                      {metrics.modulesCompletionRate}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                        Modules done
                      </span>
                      <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums">
                        {metrics.modulesCompletionRate}%
                      </span>
                    </div>
                    <div className="h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                      <div className="h-full bg-[var(--liceu-secondary)]" style={{ width: `${metrics.modulesCompletionRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[var(--liceu-primary)] border border-[var(--liceu-stone)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--liceu-accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--liceu-accent)]" />
                </span>
                <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-accent)]">
                  Live Session
                </span>
              </div>
              <div className="bg-[#003823]/50 p-4 space-y-3">
                <div>
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                    Top Module
                  </div>
                  <div className="font-[var(--font-noto-serif)] text-sm font-bold text-[var(--liceu-text)] mt-1">
                    {students.length > 0 ? students[0].currentModule : "No data"}
                  </div>
                </div>
                <div>
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                    Active Students
                  </div>
                  <div className="font-[var(--font-space-grotesk)] text-xl font-black text-[var(--liceu-text)] tabular-nums mt-1">
                    {metrics.activeStudents}
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] border border-[var(--liceu-accent)] py-3 hover:bg-[var(--liceu-accent)] hover:text-[var(--liceu-primary)] transition-colors">
              Enter Session
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="font-[var(--font-noto-serif)] text-xl font-black uppercase tracking-tight text-[var(--liceu-text)] mb-4">
            Initiates Under Forge
          </h2>
          <div className="flex gap-6 border-b border-[var(--liceu-stone)]">
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] border-b-2 border-[var(--liceu-accent)] pb-2">
              Active
            </button>
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] pb-2 hover:text-[var(--liceu-text)] transition-colors">
              Evaluation
            </button>
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] pb-2 hover:text-[var(--liceu-text)] transition-colors">
              Completed
            </button>
          </div>
        </div>

        <div className="bg-[var(--liceu-surface-container-lowest)] border border-[var(--liceu-stone)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--liceu-surface-container)]">
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">ID</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Initiate</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Module</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Status</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Last Active</th>
                <th className="text-right font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-[var(--font-space-grotesk)] text-xs uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                    No students enrolled yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-t border-[var(--liceu-stone)] hover:bg-[var(--liceu-surface-container-low)] transition-colors">
                    <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs tabular-nums text-[var(--liceu-muted)]">
                      {student.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-[var(--font-noto-serif)] text-sm font-bold text-[var(--liceu-text)]">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs text-[var(--liceu-muted)]">
                      {student.currentModule}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-[var(--liceu-primary)] text-[var(--liceu-accent)] text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-[0.15em]">
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs text-[var(--liceu-muted)] tabular-nums">
                      {student.lastActivity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                          <div className="h-full bg-[var(--liceu-accent)]" style={{ width: `${student.completionPct}%` }} />
                        </div>
                        <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums min-w-[2.5rem] text-right">
                          {student.completionPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}