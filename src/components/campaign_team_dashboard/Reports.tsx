import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag, Tooltip } from "antd";
import {
    SearchOutlined, ReloadOutlined,
    FileExcelOutlined, DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import CampaignSidebar from "./CampaignSidebar";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    bg:          "#F8FAFC",
    white:       "#FFFFFF",
    slate:       "#0F172A",
    slate500:    "#64748B",
    slate300:    "#CBD5E1",
    border:      "#E2E8F0",
    blue:        "#2563EB",
    blueLight:   "#EFF6FF",
    blueMid:     "#BFDBFE",
    green:       "#16A34A",
    greenLight:  "#F0FDF4",
    greenMid:    "#86EFAC",
    amber:       "#D97706",
    amberLight:  "#FFFBEB",
    purple:      "#7C3AED",
    purpleLight: "#F5F3FF",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface CampaignRow {
    campaign_id:      string;
    campaign_name:    string;
    client_name:      string;
    client_id:        string;
    start_date:       string;
    end_date:         string;
    line_items_count: number;
    excel_generated:  boolean;
    excel_url:        string | null;
    generated_at:     string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const color = type === "success" ? C.green : "#DC2626";
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            background: C.white, border: `1px solid ${color}55`, borderRadius: 12,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 280,
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reports() {
    const [collapsed, setCollapsed]       = useState(false);
    const sideWidth = collapsed ? 64 : 240;

    const [campaigns, setCampaigns]       = useState<CampaignRow[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState("");
    const [generating, setGenerating]     = useState<string | null>(null); // campaign_id being generated
    const [toast, setToast]               = useState<{ message: string; type: "success" | "error" } | null>(null);

    const clientName     = localStorage.getItem("client_name") ?? "";
    const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : "U";

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    // ── Fetch list ──────────────────────────────────────────────────────────
    const fetchList = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns_excel_list/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(data => setCampaigns(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load campaigns.", "error"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchList(); }, [fetchList]);

    // ── Generate Excel ──────────────────────────────────────────────────────
    const handleGenerate = async (campaignId: string) => {
        setGenerating(campaignId);
        try {
            const res = await fetch(`${BASE_URL}/generate_campaign_excel/${campaignId}/`, {
                method: "POST",
                headers: { "ngrok-skip-browser-warning": "1" },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            // Update row in state
            setCampaigns(prev => prev.map(c =>
                c.campaign_id === campaignId
                    ? { ...c, excel_generated: true, excel_url: data.download_url, generated_at: data.generated_at }
                    : c
            ));
            showToast(`Excel generated for ${campaignId}!`);
        } catch {
            showToast("Failed to generate Excel. Try again.", "error");
        } finally {
            setGenerating(null);
        }
    };

    // ── Download Excel ──────────────────────────────────────────────────────
    const handleDownload = (campaignId: string, campaignName: string) => {
        const url = `${BASE_URL}/download_campaign_excel/${campaignId}/`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${campaignId}.xlsx`;
        a.click();
    };

    // ── Filter ──────────────────────────────────────────────────────────────
    const filtered = campaigns.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.client_name, c.client_id]
            .some(f => f?.toLowerCase().includes(q));
    });

    // ── Stats ───────────────────────────────────────────────────────────────
    const totalCount     = campaigns.length;
    const generatedCount = campaigns.filter(c => c.excel_generated).length;
    const pendingCount   = totalCount - generatedCount;

    // ── Columns ─────────────────────────────────────────────────────────────
    const columns: ColumnsType<CampaignRow> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 160,
            render: (v: string) => (
                <span style={{
                    fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                    color: C.blue, background: C.blueLight,
                    padding: "3px 8px", borderRadius: 6,
                }}>{v}</span>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 220,
            render: (v: string) => (
                <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{v || "—"}</span>
            ),
        },
        {
            title: "Client",
            dataIndex: "client_name",
            key: "client_name",
            width: 160,
            render: (v: string, record) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>{v || "—"}</div>
                    <div style={{ fontSize: 10, color: C.slate500, fontFamily: "monospace" }}>{record.client_id}</div>
                </div>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 120,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 120,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "Line Items",
            dataIndex: "line_items_count",
            key: "line_items_count",
            width: 100,
            render: (v: number) => (
                <Tag color="purple" style={{ fontSize: 11 }}>{v} sheet{v !== 1 ? "s" : ""}</Tag>
            ),
        },
        {
            title: "Excel Status",
            dataIndex: "excel_generated",
            key: "excel_generated",
            width: 140,
            render: (generated: boolean, record) => generated ? (
                <Tooltip title={`Generated: ${record.generated_at ? fmtDate(record.generated_at) : "—"}`}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20,
                        background: C.greenLight, border: `1px solid ${C.greenMid}`,
                        fontSize: 11, fontWeight: 700, color: C.green,
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 11 }} /> Generated
                    </span>
                </Tooltip>
            ) : (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: C.amberLight, border: "1px solid #FDE68A",
                    fontSize: 11, fontWeight: 700, color: C.amber,
                }}>
                    <ClockCircleOutlined style={{ fontSize: 11 }} /> Pending
                </span>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 200,
            fixed: "right",
            render: (_: any, record: CampaignRow) => {
                const isGenerating = generating === record.campaign_id;
                return (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {/* Generate / Re-generate */}
                        <Button
                            size="small"
                            icon={<FileExcelOutlined />}
                            loading={isGenerating}
                            onClick={() => handleGenerate(record.campaign_id)}
                            style={{
                                fontSize: 11, fontWeight: 600, height: 30,
                                background: record.excel_generated ? C.purpleLight : C.greenLight,
                                color: record.excel_generated ? C.purple : C.green,
                                border: `1px solid ${record.excel_generated ? "#DDD6FE" : C.greenMid}`,
                                borderRadius: 6,
                            }}
                        >
                            {record.excel_generated ? "Re-generate" : "Generate"}
                        </Button>

                        {/* Download — only if generated */}
                        {record.excel_generated && (
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(record.campaign_id, record.campaign_name)}
                                style={{
                                    fontSize: 11, fontWeight: 600, height: 30,
                                    background: C.blueLight, color: C.blue,
                                    border: `1px solid ${C.blueMid}`, borderRadius: 6,
                                }}
                            >
                                Download
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <CampaignSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

            <div style={{ marginLeft: sideWidth, flex: 1, display: "flex", flexDirection: "column", transition: "margin-left 0.25s", minWidth: 0 }}>

                {/* Header */}
                <header style={{
                    background: C.white, borderBottom: `1px solid ${C.slate300}`,
                    padding: "0 28px", height: 64,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    position: "sticky", top: 0, zIndex: 50,
                }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.slate }}>Reports</div>
                        <div style={{ fontSize: 11, color: C.slate500, letterSpacing: "0.04em" }}>GENERATE &amp; DOWNLOAD CAMPAIGN EXCEL REPORTS</div>
                    </div>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%", background: C.blue,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: C.white, fontSize: 12, fontWeight: 800,
                    }}>
                        {avatarInitials}
                    </div>
                </header>

                <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>

                    {/* Page title */}
                    <div style={{ marginBottom: 20 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0 }}>Campaign Reports</h1>
                        <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", letterSpacing: "0.04em" }}>
                            GENERATE EXCEL FILES — ONE SHEET PER LINE ITEM
                        </p>
                    </div>

                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                        {[
                            { label: "Total Campaigns", value: totalCount,     color: C.blue,   bg: C.blueLight,   icon: "📊" },
                            { label: "Excel Generated", value: generatedCount, color: C.green,  bg: C.greenLight,  icon: "✅" },
                            { label: "Pending",         value: pendingCount,   color: C.amber,  bg: C.amberLight,  icon: "⏳" },
                        ].map(card => (
                            <div key={card.label} style={{
                                background: C.white, borderRadius: 14, padding: 20,
                                border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, color: card.color, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                        {card.label}
                                    </span>
                                    <div style={{ width: 36, height: 36, borderRadius: 9, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                                        {card.icon}
                                    </div>
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 800, color: card.color, letterSpacing: "-1px", lineHeight: 1 }}>
                                    {card.value}
                                </div>
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
                            placeholder="Search by campaign ID, name, client…"
                            prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            allowClear
                            style={{ flex: 1, minWidth: 240, height: 36 }}
                        />
                        <Button
                            onClick={fetchList}
                            icon={<ReloadOutlined />}
                            style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}
                        >
                            Refresh
                        </Button>
                        <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                            {filtered.length} of {campaigns.length} campaigns
                        </span>
                    </div>

                    {/* Info Banner */}
                    <div style={{
                        background: C.blueLight, border: `1px solid ${C.blueMid}`,
                        borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                        display: "flex", alignItems: "center", gap: 10,
                        fontSize: 12.5, color: C.blue, fontWeight: 500,
                    }}>
                        <FileExcelOutlined style={{ fontSize: 16 }} />
                        Each Excel file contains one sheet per Line Item. Click <strong>Generate</strong> to create the Excel, then <strong>Download</strong> to save it.
                    </div>

                    {/* Table */}
                    <div style={{
                        background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                        overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                        <Table
                            columns={columns}
                            dataSource={filtered}
                            rowKey="campaign_id"
                            loading={loading}
                            scroll={{ x: 1200 }}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50"],
                                showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`,
                                style: { padding: "12px 16px" },
                            }}
                            style={{ fontSize: 13 }}
                        />
                    </div>
                </main>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                .ant-table-thead > tr > th {
                    background: #F1F5F9 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #64748B !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .ant-table-row:hover td { background: #F8FAFC !important; }
            `}</style>
        </div>
    );
}