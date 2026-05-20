import { useState } from "react";

// ── Color palette (matches your dashboard theme) ──────────────────────────────
const C = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  slate: "#0F172A",
  slate700: "#334155",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate100: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueMid: "#BFDBFE",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  red: "#DC2626",
  redLight: "#FEF2F2",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  yellow: "#CA8A04",
  yellowLight: "#FEFCE8",
};

// ── Role definitions ───────────────────────────────────────────────────────────
const ROLES = [
  {
    name: "Super Admin",
    color: C.slate,
    bg: C.slate100,
    border: C.border,
    permissions: ["Full access — all sections, settings & team management"],
  },
  {
    name: "Admin",
    color: C.blue,
    bg: C.blueLight,
    border: C.blueMid,
    permissions: ["Clients", "Campaigns"],
  },
  {
    name: "Creative_Team",
    color: C.purple,
    bg: C.purpleLight,
    border: "#DDD6FE",
    permissions: ["Creatives", "Line Items"],
  },
  {
    name: "Campaign_Team",
    color: C.yellow,
    bg: C.yellowLight,
    border: "#FDE68A",
    permissions: ["Campaigns"],
  },
  {
    name: "Viewer",
    color: C.slate500,
    bg: C.slate100,
    border: C.border,
    permissions: ["Dashboard (read-only)", "Analytics (read-only)"],
  },
];

const ROLE_NAMES = ROLES.map((r) => r.name);

function getRoleStyle(roleName: string) {
  return ROLES.find((r) => r.name === roleName) ?? ROLES[1];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  lastActive: string;
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const s = getRoleStyle(role);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 600, color: s.color,
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      {role}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [C.blue, C.purple, C.green, C.amber, "#0891B2", "#BE185D"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800, flexShrink: 0, letterSpacing: "0.02em",
    }}>{initials}</div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      flex: 1, background: C.white,
      border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "18px 22px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.slate, letterSpacing: "-1px" }}>
        {value}
      </div>
    </div>
  );
}

// ── ChangePasswordModal ───────────────────────────────────────────────────────
function ChangePasswordModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");

  const handleSave = () => {
    if (!newPw || newPw.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setMsg("Passwords do not match."); return; }
    setMsg("✅ Password updated successfully!");
    setTimeout(onClose, 1500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
        width: "100%", maxWidth: 440, padding: 28,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: 0 }}>Change Password</h3>
            <p style={{ fontSize: 12, color: C.slate500, margin: "4px 0 0" }}>For <strong>{member.name}</strong></p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.slate100, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {[
          { label: "New Password", val: newPw, set: setNewPw },
          { label: "Confirm Password", val: confirmPw, set: setConfirmPw },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
            <input
              type="password" placeholder="Min 8 characters" value={val}
              onChange={(e) => set(e.target.value)}
              style={{
                marginTop: 6, width: "100%", height: 40, padding: "0 14px",
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, color: C.slate, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        {msg && <div style={{ marginBottom: 12, fontSize: 12, color: msg.startsWith("✅") ? C.green : C.red, fontWeight: 500 }}>{msg}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: C.slate, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Password</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TeamAccess() {
  const [activeTab, setActiveTab] = useState<"members" | "add">("members");
  const [search, setSearch] = useState("");
  const [changePwMember, setChangePwMember] = useState<Member | null>(null);

  // Add Member form state
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Campaign Manager" });
  const [formMsg, setFormMsg] = useState("");

  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "bhuva shree",  email: "bhuvashree@billiontags.co",  role: "Campaign Manager", status: "Active", lastActive: "—" },
    { id: 2, name: "New Member",   email: "newmember@test.com",         role: "Campaign Manager", status: "Active", lastActive: "—" },
    { id: 3, name: "Test Team",    email: "testteam@billionmedia.com",  role: "Campaign Manager", status: "Active", lastActive: "—" },
    { id: 4, name: "ranjith",      email: "ramesh@billiontags.co",      role: "Campaign Manager", status: "Active", lastActive: "—" },
    { id: 5, name: "uma",          email: "uma@billiontags.co",         role: "Campaign Manager", status: "Active", lastActive: "—" },
  ]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  const counts = {
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    pending: 0,
    roles: new Set(members.map((m) => m.role)).size,
  };

  const toggleStatus = (id: number) => {
    setMembers((prev) => prev.map((m) =>
      m.id === id ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" } : m
    ));
  };

  const removeMember = (id: number) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddMember = () => {
    if (!form.name.trim()) { setFormMsg("Full name is required."); return; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setFormMsg("Valid work email is required."); return; }
    if (!form.password || form.password.length < 8) { setFormMsg("Password must be at least 8 characters."); return; }
    const newMember: Member = {
      id: Date.now(), name: form.name, email: form.email,
      role: form.role, status: "Active", lastActive: "—",
    };
    setMembers((prev) => [...prev, newMember]);
    setForm({ name: "", email: "", password: "", role: "Campaign Manager" });
    setFormMsg("✅ Member added successfully!");
    setTimeout(() => { setFormMsg(""); setActiveTab("members"); }, 1500);
  };

  const selectedRole = getRoleStyle(form.role);

  const cols = ["MEMBER", "EMAIL", "ROLE", "STATUS", "PASSWORD", "LAST ACTIVE", "ACTIONS"];
  const colWidths = [180, 220, 150, 100, 100, 120, 240];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>Team & Access</h1>
          <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em" }}>
            MANAGE TEAM MEMBERS AND ROLE PERMISSIONS
          </p>
        </div>
        <button
          onClick={() => { setActiveTab("add"); setFormMsg(""); }}
          style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: C.blue, color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(15,23,42,0.25)",
          }}
        >
          + Add User
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Members" value={counts.total} />
        <StatCard label="Active" value={counts.active} />
        <StatCard label="Pending" value={counts.pending} />
        <StatCard label="Roles" value={counts.roles} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 24 }}>
        {(["members", "add"] as const).map((tab) => {
          const label = tab === "members" ? "Team Members" : "Add Member";
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setFormMsg(""); }}
              style={{
                padding: "10px 20px", border: "none", background: "transparent",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? C.slate : C.slate500,
                cursor: "pointer", borderBottom: active ? `2px solid ${C.slate}` : "2px solid transparent",
                marginBottom: -2,
              }}
            >{label}</button>
          );
        })}
      </div>

      {/* ── TAB: Team Members ── */}
      {activeTab === "members" && (
        <div>
          {/* Members Table Card */}
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20,
          }}>
            {/* Table header bar */}
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>
                Members ({filtered.length})
              </span>
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: 220, height: 36, padding: "0 14px",
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  fontSize: 12, color: C.slate, outline: "none", background: C.bg,
                }}
              />
            </div>

            {/* Table head */}
            <div style={{
              display: "flex", background: C.slate100,
              borderBottom: `1px solid ${C.border}`, overflowX: "auto",
            }}>
              {cols.map((col, i) => (
                <div key={col} style={{
                  width: colWidths[i], flexShrink: 0, padding: "10px 14px",
                  fontSize: 10, fontWeight: 700, color: C.slate500,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>{col}</div>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>
                No members found.
              </div>
            ) : filtered.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: "flex", alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none",
                  transition: "background 0.12s", overflowX: "auto",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Member */}
                <div style={{ width: 180, flexShrink: 0, padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={m.name} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                </div>
                {/* Email */}
                <div style={{ width: 220, flexShrink: 0, padding: "14px", fontSize: 12, color: C.slate500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                {/* Role */}
                <div style={{ width: 150, flexShrink: 0, padding: "14px" }}><RoleBadge role={m.role} /></div>
                {/* Status */}
                <div style={{ width: 100, flexShrink: 0, padding: "14px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: m.status === "Active" ? C.greenLight : C.redLight,
                    border: `1px solid ${m.status === "Active" ? "#BBF7D0" : "#FECACA"}`,
                    fontSize: 11, fontWeight: 600,
                    color: m.status === "Active" ? C.green : C.red,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.status === "Active" ? C.green : C.red }} />
                    {m.status}
                  </span>
                </div>
                {/* Password */}
                <div style={{ width: 100, flexShrink: 0, padding: "14px", fontSize: 13, color: C.slate400, letterSpacing: "2px" }}>
                  ••••••••
                </div>
                {/* Last Active */}
                <div style={{ width: 120, flexShrink: 0, padding: "14px", fontSize: 12, color: C.slate500 }}>{m.lastActive}</div>
                {/* Actions */}
                <div style={{ width: 240, flexShrink: 0, padding: "14px", display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleStatus(m.id)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                      background: m.status === "Active" ? C.amberLight : C.greenLight,
                      border: `1px solid ${m.status === "Active" ? "#FDE68A" : "#BBF7D0"}`,
                      color: m.status === "Active" ? C.amber : C.green,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >{m.status === "Active" ? "Deactivate" : "Activate"}</button>
                  <button
                    onClick={() => setChangePwMember(m)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                      background: C.blueLight, border: `1px solid ${C.blueMid}`,
                      color: C.blue, fontSize: 11, fontWeight: 600,
                    }}
                  >Change PW</button>
                  <button
                    onClick={() => removeMember(m.id)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                      background: C.redLight, border: `1px solid #FECACA`,
                      color: C.red, fontSize: 11, fontWeight: 600,
                    }}
                  >Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Role Permissions Reference */}
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Role Permissions Reference</span>
            </div>
            <div style={{ padding: "0 20px" }}>
              {/* Header row */}
              <div style={{ display: "flex", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 200, fontSize: 10, fontWeight: 700, color: C.slate500, letterSpacing: "0.08em", textTransform: "uppercase" }}>ROLE</div>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: C.slate500, letterSpacing: "0.08em", textTransform: "uppercase" }}>ACCESS</div>
              </div>
              {ROLES.map((role, i) => (
                <div key={role.name} style={{
                  display: "flex", alignItems: "center", padding: "14px 0",
                  borderBottom: i < ROLES.length - 1 ? `1px solid ${C.borderLight}` : "none",
                }}>
                  <div style={{ width: 200 }}><RoleBadge role={role.name} /></div>
                  <div style={{ flex: 1, fontSize: 13, color: C.slate500 }}>
                    {role.permissions.join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Add Member ── */}
      {activeTab === "add" && (
        <div style={{
          background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.slate, margin: "0 0 20px" }}>Add Team Member</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                placeholder="e.g. Arjun Mehta"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={{
                  width: "100%", height: 42, padding: "0 14px",
                  border: `1px solid ${C.border}`, borderRadius: 9,
                  fontSize: 13, color: C.slate, outline: "none",
                  background: C.bg, boxSizing: "border-box",
                }}
              />
            </div>
            {/* Work Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Work Email</label>
              <input
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                style={{
                  width: "100%", height: 42, padding: "0 14px",
                  border: `1px solid ${C.border}`, borderRadius: 9,
                  fontSize: 13, color: C.slate, outline: "none",
                  background: C.bg, boxSizing: "border-box",
                }}
              />
            </div>
            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                style={{
                  width: "100%", height: 42, padding: "0 14px",
                  border: `1px solid ${C.border}`, borderRadius: 9,
                  fontSize: 13, color: C.slate, outline: "none",
                  background: C.bg, boxSizing: "border-box",
                }}
              />
            </div>
            {/* Role */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={{
                  width: "100%", height: 42, padding: "0 14px",
                  border: `1px solid ${C.border}`, borderRadius: 9,
                  fontSize: 13, color: C.slate, outline: "none",
                  background: C.bg, boxSizing: "border-box", cursor: "pointer",
                }}
              >
                {ROLE_NAMES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Permissions preview */}
          <div style={{
            padding: "16px 20px",
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 12, color: C.slate500, margin: "0 0 10px" }}>
              Permissions for <strong style={{ color: C.slate }}>{form.role}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedRole.permissions.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.slate700 }}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✓</span>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {formMsg && (
            <div style={{ marginBottom: 14, fontSize: 12, color: formMsg.startsWith("✅") ? C.green : C.red, fontWeight: 500 }}>
              {formMsg}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => { setForm({ name: "", email: "", password: "", role: "Campaign Manager" }); setFormMsg(""); }}
              style={{
                padding: "10px 22px", borderRadius: 9,
                border: `1px solid ${C.border}`, background: "transparent",
                color: C.slate500, fontSize: 13, cursor: "pointer",
              }}
            >Reset</button>
            <button
              onClick={handleAddMember}
              style={{
                padding: "10px 28px", borderRadius: 9, border: "none",
                background: C.blue, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(15,23,42,0.2)",
              }}
            >Add Member</button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePwMember && (
        <ChangePasswordModal member={changePwMember} onClose={() => setChangePwMember(null)} />
      )}
    </div>
  );
}