import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Input, Select, Typography, Space, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// ── Color palette (matches SuperAdmin dashboard theme) ────────────────────────
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
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; border: string; color: string; dot: string }> = {
    live: { bg: C.greenLight, border: "#BBF7D0", color: C.green, dot: C.green },
    active: { bg: C.blueLight, border: C.blueMid, color: C.blue, dot: C.blue },
    paused: { bg: C.amberLight, border: "#FDE68A", color: C.amber, dot: C.amber },
    pending: { bg: C.amberLight, border: "#FDE68A", color: C.amber, dot: C.amber },
    draft: { bg: C.slate100, border: C.border, color: C.slate500, dot: C.slate400 },
    completed: { bg: C.purpleLight, border: "#DDD6FE", color: C.purple, dot: C.purple },
    cancelled: { bg: C.redLight, border: "#FECACA", color: C.red, dot: C.red },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
    line_item_id: string;
    line_item_name: string;
    start_date: string;
    end_date: string;
    ad_format: string | string[];
    impressions: string;
    status?: string;
}

interface Campaign {
    campaign_id: string;
    client_campaign_ID?: string;
    purchase_order_ID?: string;
    campaign_name: string;
    client_name: string;
    advertiser?: string;
    campaign_type?: string;
    buying_type?: string;
    objective?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    status?: string;
    line_items?: LineItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status?: string }) {
    const s = STATUS_STYLE[status ?? "pending"] ?? STATUS_STYLE.pending;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20,
            background: s.bg, border: `1px solid ${s.border}`,
            fontSize: 10, fontWeight: 700, color: s.color,
            letterSpacing: "0.06em", whiteSpace: "nowrap", textTransform: "uppercase",
        }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
            {status ?? "pending"}
        </span>
    );
}

function AdFormatTags({ formats }: { formats: string | string[] }) {
    const arr = Array.isArray(formats) ? formats : (formats ? [formats] : []);
    if (!arr.length) return <span style={{ color: C.slate400, fontSize: 12 }}>—</span>;
    return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {arr.map((f) => (
                <span key={f} style={{
                    padding: "2px 7px", borderRadius: 5,
                    background: C.blueLight, border: `1px solid ${C.blueMid}`,
                    fontSize: 10, fontWeight: 600, color: C.blue,
                }}>{f}</span>
            ))}
        </div>
    );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
    campaign, onConfirm, onClose, deleting,
}: {
    campaign: Campaign; onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, background: C.redLight,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    }}>🗑️</div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.slate100, cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: "0 0 8px" }}>Delete Campaign</h3>
                <p style={{ fontSize: 13, color: C.slate500, margin: "0 0 20px", lineHeight: 1.6 }}>
                    Are you sure you want to delete <strong style={{ color: C.slate }}>{campaign.campaign_name}</strong>?
                    This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} disabled={deleting} style={{
                        padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`,
                        background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer",
                    }}>Cancel</button>
                    <button onClick={onConfirm} disabled={deleting} style={{
                        padding: "9px 22px", borderRadius: 8, border: "none",
                        background: C.red, color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1,
                    }}>{deleting ? "Deleting…" : "Yes, Delete"}</button>
                </div>
            </div>
        </div>
    );
}

// ── Campaign Detail Modal ─────────────────────────────────────────────────────
function CampaignDetailModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
    const rows: [string, string][] = [
        ["Campaign ID", campaign.campaign_id],
        ["Client Campaign ID", campaign.client_campaign_ID ?? "—"],
        ["Purchase Order ID", campaign.purchase_order_ID ?? "—"],
        ["Advertiser", campaign.advertiser ?? "—"],
        ["Company", campaign.client_name],
        ["Campaign Type", campaign.campaign_type ?? "—"],
        ["Buying Type", campaign.buying_type ?? "—"],
        ["Objective", campaign.objective ?? "—"],
        ["Start Date", fmtDate(campaign.start_date)],
        ["End Date", fmtDate(campaign.end_date)],
        ["Created", fmtDate(campaign.created_at)],
    ];

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
            <div style={{
                background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
                width: "100%", maxWidth: 760, maxHeight: "90vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 24px 80px rgba(0,0,0,0.18)", overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{
                    padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: C.slate100, flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: C.blueLight, border: `1px solid ${C.blueMid}`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                        }}>📊</div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: C.slate }}>{campaign.campaign_name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.slate500, fontFamily: "monospace" }}>{campaign.campaign_id}</span>
                                <StatusBadge status={campaign.status} />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, background: C.slate100,
                        border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ overflowY: "auto", padding: "20px 28px", flex: 1 }}>
                    {/* Info rows */}
                    <div style={{ marginBottom: 20 }}>
                        {rows.map(([label, value]) => (
                            <div key={label} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "9px 0", borderBottom: `1px solid ${C.borderLight}`,
                            }}>
                                <span style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
                                <span style={{
                                    fontSize: 12.5, color: ["Campaign ID", "Client Campaign ID", "Purchase Order ID"].includes(label) ? C.blue : C.slate,
                                    fontFamily: ["Campaign ID", "Client Campaign ID", "Purchase Order ID"].includes(label) ? "monospace" : "inherit",
                                    fontWeight: 500, maxWidth: "60%", textAlign: "right",
                                }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Line Items */}
                    {(campaign.line_items?.length ?? 0) > 0 && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 16 }}>📋</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                    Line Items ({campaign.line_items!.length})
                                </span>
                                <div style={{ flex: 1, height: 1, background: C.borderLight }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {campaign.line_items!.map((li) => (
                                    <div key={li.line_item_id} style={{
                                        border: `1px solid ${C.border}`, borderRadius: 10,
                                        padding: "12px 16px", background: C.bg,
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.purple, background: C.purpleLight, padding: "2px 8px", borderRadius: 5 }}>
                                                {li.line_item_id}
                                            </span>
                                            <StatusBadge status={li.status} />
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 6 }}>{li.line_item_name || "—"}</div>
                                        <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.slate500 }}>
                                            <span>📅 {fmtDate(li.start_date)} → {fmtDate(li.end_date)}</span>
                                            <span>👁️ {li.impressions ? Number(li.impressions).toLocaleString("en-IN") : "—"} impr.</span>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <AdFormatTags formats={li.ad_format} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Edit Campaign Modal ───────────────────────────────────────────────────────
function EditCampaignModal({
    campaign, onSave, onClose, saving,
}: {
    campaign: Campaign;
    onSave: (updated: Partial<Campaign>) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        campaign_name: campaign.campaign_name ?? "",
        advertiser: campaign.advertiser ?? "",
        client_name: campaign.client_name ?? "",
        campaign_type: campaign.campaign_type ?? "",
        buying_type: campaign.buying_type ?? "",
        objective: campaign.objective ?? "",
        start_date: campaign.start_date?.slice(0, 10) ?? "",
        end_date: campaign.end_date?.slice(0, 10) ?? "",
        status: campaign.status ?? "pending",
    });

    const sf = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

    const fields: { label: string; key: keyof typeof form; type?: string }[] = [
        { label: "Campaign Name", key: "campaign_name" },
        { label: "Advertiser", key: "advertiser" },
        { label: "Company", key: "client_name" },
        { label: "Campaign Type", key: "campaign_type" },
        { label: "Buying Type", key: "buying_type" },
        { label: "Objective", key: "objective" },
        { label: "Start Date", key: "start_date", type: "date" },
        { label: "End Date", key: "end_date", type: "date" },
    ];

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
            <div style={{
                background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
                width: "100%", maxWidth: 580, maxHeight: "90vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 24px 80px rgba(0,0,0,0.18)", overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{
                    padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: C.slate100, flexShrink: 0,
                }}>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: 0 }}>Edit Campaign</h3>
                        <p style={{ fontSize: 12, color: C.slate500, margin: "3px 0 0", fontFamily: "monospace" }}>{campaign.campaign_id}</p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, background: C.slate100,
                        border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ overflowY: "auto", padding: "20px 28px", flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {fields.map(({ label, key, type }) => (
                            <div key={key} style={{ gridColumn: label === "Campaign Name" || label === "Objective" ? "span 2" : "span 1" }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                                    {label}
                                </label>
                                <input
                                    type={type ?? "text"}
                                    value={form[key]}
                                    onChange={(e) => sf(key, e.target.value)}
                                    style={{
                                        width: "100%", height: 40, padding: "0 14px",
                                        border: `1px solid ${C.border}`, borderRadius: 8,
                                        fontSize: 13, color: C.slate, outline: "none",
                                        background: C.bg, boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        ))}
                        {/* Status */}
                        <div style={{ gridColumn: "span 2" }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => sf("status", e.target.value)}
                                style={{
                                    width: "100%", height: 40, padding: "0 14px",
                                    border: `1px solid ${C.border}`, borderRadius: 8,
                                    fontSize: 13, color: C.slate, outline: "none",
                                    background: C.bg, boxSizing: "border-box", cursor: "pointer",
                                }}
                            >
                                {["live", "active", "paused", "pending", "draft", "completed", "cancelled"].map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 28px", borderTop: `1px solid ${C.border}`,
                    display: "flex", gap: 10, justifyContent: "flex-end",
                    background: C.slate100, flexShrink: 0,
                }}>
                    <button onClick={onClose} disabled={saving} style={{
                        padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`,
                        background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer",
                    }}>Cancel</button>
                    <button onClick={() => onSave(form)} disabled={saving} style={{
                        padding: "9px 28px", borderRadius: 8, border: "none",
                        background: C.slate, color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                        boxShadow: "0 2px 8px rgba(15,23,42,0.2)",
                    }}>{saving ? "Saving…" : "Save Changes"}</button>
                </div>
            </div>
        </div>
    );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    const color = type === "success" ? C.green : C.red;
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            background: C.white, border: `1px solid ${color}55`, borderRadius: 12,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function All_Campaigns() {
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
    const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
    const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        fetch("https://grinch-revocable-cornflake.ngrok-free.dev/get_campaigns/", {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((data) => {
                const list: Campaign[] = Array.isArray(data) ? data : Array.isArray(data?.campaigns) ? data.campaigns : [];
                setCampaigns(list);
            })
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    // Filtered list
    const filtered = campaigns.filter((c) => {
        const q = search.toLowerCase();
        const matchSearch = !q || [c.campaign_name, c.campaign_id, c.client_campaign_ID, c.client_name, c.advertiser]
            .some((f) => f?.toLowerCase().includes(q));
        const matchStatus = statusFilter === "all" || (c.status ?? "pending") === statusFilter;
        const matchType = typeFilter === "all" || c.campaign_type === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    const uniqueTypes = [...new Set(campaigns.map((c) => c.campaign_type).filter(Boolean))] as string[];
    const uniqueStatuses = [...new Set(campaigns.map((c) => c.status ?? "pending"))] as string[];

    // Stat counts
    const counts = {
        total: campaigns.length,
        live: campaigns.filter((c) => c.status === "live").length,
        paused: campaigns.filter((c) => c.status === "paused").length,
        pending: campaigns.filter((c) => (c.status ?? "pending") === "pending").length,
    };

    // Edit save
    const handleSave = async (updated: Partial<Campaign>) => {
        if (!editCampaign) return;
        setSaving(true);
        try {
            const res = await fetch(
                `https://grinch-revocable-cornflake.ngrok-free.dev/update_campaign/${editCampaign.campaign_id}/`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
                    body: JSON.stringify(updated),
                }
            );
            if (res.ok) {
                setCampaigns((prev) => prev.map((c) =>
                    c.campaign_id === editCampaign.campaign_id ? { ...c, ...updated } : c
                ));
                setEditCampaign(null);
                showToast("Campaign updated successfully!");
            } else {
                showToast("Failed to update campaign.", "error");
            }
        } catch {
            showToast("Network error. Try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Delete
    const handleDelete = async () => {
        if (!deleteCampaign) return;
        setDeleting(true);
        try {
            const res = await fetch(
                `https://grinch-revocable-cornflake.ngrok-free.dev/delete_campaign/${deleteCampaign.campaign_id}/`,
                {
                    method: "DELETE",
                    headers: { "ngrok-skip-browser-warning": "1" },
                }
            );
            if (res.ok) {
                setCampaigns((prev) => prev.filter((c) => c.campaign_id !== deleteCampaign.campaign_id));
                setDeleteCampaign(null);
                showToast("Campaign deleted successfully!");
            } else {
                showToast("Failed to delete campaign.", "error");
            }
        } catch {
            showToast("Network error. Try again.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const cols = ["CAMPAIGN", "ADVERTISER / COMPANY", "TYPE", "DATES", "LINE ITEMS", "STATUS", "ACTIONS"];
    const colWidths = [260, 200, 130, 200, 100, 130, 200];

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* Page Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>All Campaigns</h1>
                    <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em" }}>
                        MANAGE & TRACK ALL CLIENT CAMPAIGNS
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Total Campaigns", value: counts.total, color: C.blue, bg: C.blueLight, icon: "📊" },
                    { label: "Live", value: counts.live, color: C.green, bg: C.greenLight, icon: "🟢" },
                    { label: "Paused", value: counts.paused, color: C.amber, bg: C.amberLight, icon: "⏸️" },
                    { label: "Pending", value: counts.pending, color: C.amber, bg: C.amberLight, icon: "⏳" },
                ].map((s) => (
                    <div key={s.label} style={{
                        background: C.white, borderRadius: 14, padding: "20px",
                        border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <span style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</span>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: "-1px", lineHeight: 1 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{
                background: C.white, borderRadius: 12, padding: "14px 18px",
                border: `1px solid ${C.border}`, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
                <Input
                    placeholder="Search by name, ID, advertiser, company…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}

                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1, minWidth: 240, height: 36, padding: "0 14px",
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        fontSize: 12, color: C.slate, outline: "none", background: C.bg,
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        height: 36, padding: "0 12px", border: `1px solid ${C.border}`,
                        borderRadius: 8, fontSize: 12, color: C.slate, background: C.bg,
                        outline: "none", cursor: "pointer",
                    }}
                >
                    <option value="all">All Statuses</option>
                    {uniqueStatuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{
                        height: 36, padding: "0 12px", border: `1px solid ${C.border}`,
                        borderRadius: 8, fontSize: 12, color: C.slate, background: C.bg,
                        outline: "none", cursor: "pointer",
                    }}
                >
                    <option value="all">All Types</option>
                    {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <Button
                    onClick={fetchCampaigns}
                    icon={<ReloadOutlined />}
                    style={{
                        padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border}`,
                        background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    }}
                >
                    Refresh
                </Button>

                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {campaigns.length} campaigns
                </span>
            </div>

            {/* Table */}
            <div style={{
                background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
                {/* Table Head */}
                <div style={{ display: "flex", background: C.slate100, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
                    <div style={{ width: 40, flexShrink: 0 }} /> {/* expand toggle col */}
                    {cols.map((col, i) => (
                        <div key={col} style={{
                            width: colWidths[i], flexShrink: 0, padding: "10px 14px",
                            fontSize: 10, fontWeight: 700, color: C.slate500,
                            letterSpacing: "0.08em", textTransform: "uppercase",
                        }}>{col}</div>
                    ))}
                </div>

                {/* Rows */}
                {loading ? (
                    <div style={{ padding: 48, textAlign: "center" }}>
                        <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
                        <p style={{ color: C.slate500, fontSize: 13 }}>Loading campaigns…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center" }}>
                        <div style={{ fontSize: 24, marginBottom: 10 }}>📭</div>
                        <p style={{ color: C.slate500, fontSize: 13 }}>No campaigns found.</p>
                    </div>
                ) : filtered.map((c, i) => {
                    const isExpanded = expandedRow === c.campaign_id;
                    const lineCount = c.line_items?.length ?? 0;
                    return (
                        <div key={c.campaign_id}>
                            {/* Main row */}
                            <div
                                style={{
                                    display: "flex", alignItems: "center",
                                    borderBottom: `1px solid ${C.borderLight}`,
                                    transition: "background 0.12s", overflowX: "auto",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                            >
                                {/* Expand toggle */}
                                <div style={{ width: 40, flexShrink: 0, padding: "0 0 0 12px" }}>
                                    <button
                                        onClick={() => setExpandedRow(isExpanded ? null : c.campaign_id)}
                                        style={{
                                            width: 22, height: 22, borderRadius: 6,
                                            border: `1px solid ${C.border}`, background: C.white,
                                            cursor: "pointer", fontSize: 10, color: C.slate500,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                    >{isExpanded ? "▲" : "▼"}</button>
                                </div>

                                {/* Campaign */}
                                <div style={{ width: 260, flexShrink: 0, padding: "14px 14px" }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {c.campaign_name}
                                    </div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, color: C.blue,
                                        background: C.blueLight, padding: "2px 7px", borderRadius: 5,
                                        fontFamily: "monospace",
                                    }}>{c.campaign_id}</span>
                                    {c.client_campaign_ID && (
                                        <div style={{ fontSize: 10, color: C.slate400, marginTop: 2 }}>PO: {c.purchase_order_ID || "—"}</div>
                                    )}
                                </div>

                                {/* Advertiser / Company */}
                                <div style={{ width: 200, flexShrink: 0, padding: "14px 14px" }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.advertiser || "—"}</div>
                                    <div style={{ fontSize: 11, color: C.slate500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.client_name}</div>
                                </div>

                                {/* Type */}
                                <div style={{ width: 130, flexShrink: 0, padding: "14px 14px" }}>
                                    {c.campaign_type ? (
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 20,
                                            background: C.blueLight, border: `1px solid ${C.blueMid}`,
                                            fontSize: 11, fontWeight: 600, color: C.blue,
                                        }}>{c.campaign_type}</span>
                                    ) : <span style={{ color: C.slate400, fontSize: 12 }}>—</span>}
                                </div>

                                {/* Dates */}
                                <div style={{ width: 200, flexShrink: 0, padding: "14px 14px" }}>
                                    <div style={{ fontSize: 12, color: C.slate }}>
                                        <span style={{ color: C.slate500 }}>Start: </span>{fmtDate(c.start_date)}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>
                                        <span style={{ color: C.slate500 }}>End: </span>{fmtDate(c.end_date)}
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div style={{ width: 100, flexShrink: 0, padding: "14px 14px" }}>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 20,
                                        background: C.purpleLight, border: `1px solid #DDD6FE`,
                                        fontSize: 11, fontWeight: 600, color: C.purple,
                                    }}>{lineCount} item{lineCount !== 1 ? "s" : ""}</span>
                                </div>

                                {/* Status */}
                                <div style={{ width: 130, flexShrink: 0, padding: "14px 14px" }}>
                                    <StatusBadge status={c.status} />
                                </div>

                                {/* Actions */}
                                <div style={{ width: 200, flexShrink: 0, padding: "14px 14px", display: "flex", gap: 6 }}>
                                    <button
                                        onClick={() => setViewCampaign(c)}
                                        style={{
                                            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                            background: C.blueLight, border: `1px solid ${C.blueMid}`,
                                            color: C.blue, fontSize: 11, fontWeight: 600,
                                        }}
                                    >👁 View</button>
                                    <button
                                        onClick={() => setEditCampaign(c)}
                                        style={{
                                            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                            background: C.slate100, border: `1px solid ${C.border}`,
                                            color: C.slate700, fontSize: 11, fontWeight: 600,
                                        }}
                                    >✏️ Edit</button>
                                    <button
                                        onClick={() => setDeleteCampaign(c)}
                                        style={{
                                            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                            background: C.redLight, border: `1px solid #FECACA`,
                                            color: C.red, fontSize: 11, fontWeight: 600,
                                        }}
                                    >🗑 Del</button>
                                </div>
                            </div>

                            {/* Expanded Line Items */}
                            {isExpanded && (
                                <div style={{
                                    background: "#FAFBFD", borderBottom: `1px solid ${C.borderLight}`,
                                    padding: "12px 54px 16px",
                                }}>
                                    {lineCount === 0 ? (
                                        <p style={{ fontSize: 12, color: C.slate400, margin: 0 }}>No line items for this campaign.</p>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: C.slate500, margin: "0 0 10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                                Line Items ({lineCount})
                                            </p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                {c.line_items!.map((li) => (
                                                    <div key={li.line_item_id} style={{
                                                        display: "flex", alignItems: "center", gap: 16,
                                                        background: C.white, border: `1px solid ${C.border}`,
                                                        borderRadius: 10, padding: "10px 16px",
                                                    }}>
                                                        <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: C.purple, background: C.purpleLight, padding: "2px 7px", borderRadius: 5, flexShrink: 0 }}>
                                                            {li.line_item_id}
                                                        </span>
                                                        <span style={{ fontSize: 13, fontWeight: 500, color: C.slate, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{li.line_item_name || "—"}</span>
                                                        <span style={{ fontSize: 11, color: C.slate500, flexShrink: 0 }}>{fmtDate(li.start_date)} → {fmtDate(li.end_date)}</span>
                                                        <span style={{ fontSize: 11, color: C.slate500, flexShrink: 0 }}>
                                                            {li.impressions ? Number(li.impressions).toLocaleString("en-IN") : "—"} impr.
                                                        </span>
                                                        <div style={{ flexShrink: 0 }}><AdFormatTags formats={li.ad_format} /></div>
                                                        <div style={{ flexShrink: 0 }}><StatusBadge status={li.status} /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {viewCampaign && <CampaignDetailModal campaign={viewCampaign} onClose={() => setViewCampaign(null)} />}
            {editCampaign && (
                <EditCampaignModal
                    campaign={editCampaign}
                    onSave={handleSave}
                    onClose={() => setEditCampaign(null)}
                    saving={saving}
                />
            )}
            {deleteCampaign && (
                <DeleteModal
                    campaign={deleteCampaign}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteCampaign(null)}
                    deleting={deleting}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}