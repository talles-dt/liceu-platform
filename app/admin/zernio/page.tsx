"use client";

import { useState, useEffect } from "react";

interface ZernioAccount {
  id: string;
  platform: string;
  username: string;
  profileId: string;
  profileName: string;
  isHealthy: boolean;
  lastSync: string | null;
}

interface ZernioPost {
  _id: string;
  content: string;
  platforms: { platform: string; accountId: string; status: string }[];
  status: string;
  scheduledFor: string | null;
  createdAt: string;
  publishedAt: string | null;
}

interface ZernioAnalytics {
  overview?: {
    totalPosts: number;
    totalEngagement: number;
    totalReach: number;
    totalFollowers: number;
  };
  byPlatform?: Record<string, {
    posts: number;
    engagement: number;
    reach: number;
    followers: number;
  }>;
}

interface InboxConversation {
  _id: string;
  platform: string;
  accountId: string;
  contactName: string;
  contactHandle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: string;
}

export default function ZernioAdminPage() {
  const [activeTab, setActiveTab] = useState<"accounts" | "posts" | "analytics" | "inbox" | "create">("accounts");
  const [accounts, setAccounts] = useState<ZernioAccount[]>([]);
  const [posts, setPosts] = useState<ZernioPost[]>([]);
  const [analytics, setAnalytics] = useState<ZernioAnalytics | null>(null);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create post form state
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [newPostScheduledFor, setNewPostScheduledFor] = useState("");
  const [newPostPublishNow, setNewPostPublishNow] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://liceu-api.example.com";

  const getAdminToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token") || "";
    }
    return "";
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/zernio/accounts`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data.accounts || data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/zernio/posts`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.posts || data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/zernio/analytics`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/zernio/inbox`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      setConversations(data.conversations || data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const platforms = selectedAccountIds.map((accountId) => {
        const account = accounts.find((a) => a.id === accountId);
        return { platform: account?.platform || "twitter", accountId };
      });

      const res = await fetch(`${API_BASE}/api/admin/zernio/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          content: newPostContent,
          platforms,
          scheduledFor: newPostScheduledFor || undefined,
          publishNow: newPostPublishNow,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");
      setSuccess("Post created successfully!");
      setNewPostContent("");
      setSelectedAccountIds([]);
      setNewPostScheduledFor("");
      setNewPostPublishNow(false);
      fetchPosts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "accounts") fetchAccounts();
    else if (activeTab === "posts") fetchPosts();
    else if (activeTab === "analytics") fetchAnalytics();
    else if (activeTab === "inbox") fetchInbox();
  }, [activeTab]);

  const tabs = [
    { id: "accounts", label: "Contas", icon: "👥" },
    { id: "posts", label: "Posts", icon: "📝" },
    { id: "create", label: "Criar Post", icon: "➕" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "inbox", label: "Inbox", icon: "💬" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ 
        fontFamily: "var(--font-noto-serif)", 
        fontSize: "28px", 
        fontWeight: "700", 
        textTransform: "uppercase",
        color: "var(--liceu-text)",
        marginBottom: "24px"
      }}>
        Zernio Social
      </h1>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--liceu-stone)", marginBottom: "24px" }}>
        <nav style={{ display: "flex", gap: "8px" }} aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: activeTab === tab.id ? "var(--liceu-accent)" : "var(--liceu-muted)",
                borderBottom: activeTab === tab.id ? "2px solid var(--liceu-accent)" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div style={{
          marginBottom: "16px",
          padding: "12px 16px",
          background: "rgba(255, 0, 0, 0.1)",
          border: "1px solid rgba(255, 0, 0, 0.3)",
          borderRadius: "8px",
          color: "#ff6b6b"
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          marginBottom: "16px",
          padding: "12px 16px",
          background: "rgba(0, 200, 0, 0.1)",
          border: "1px solid rgba(0, 200, 0, 0.3)",
          borderRadius: "8px",
          color: "#6bff6b"
        }}>
          {success}
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <div>
          <h2 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "20px", fontWeight: "700", color: "var(--liceu-text)", marginBottom: "16px" }}>
            Contas Conectadas
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Carregando...</div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>
              Nenhuma conta conectada. Configure no dashboard do Zernio.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: `1px solid ${account.isHealthy ? "var(--liceu-secondary)" : "rgba(255,0,0,0.3)"}`,
                    background: account.isHealthy ? "rgba(0, 200, 0, 0.05)" : "rgba(255, 0, 0, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{account.platform}</span>
                    <span style={{
                      padding: "4px 8px",
                      fontSize: "10px",
                      borderRadius: "9999px",
                      background: account.isHealthy ? "rgba(0, 200, 0, 0.2)" : "rgba(255, 0, 0, 0.2)",
                      color: account.isHealthy ? "#6bff6b" : "#ff6b6b",
                    }}>
                      {account.isHealthy ? "Conectada" : "Erro"}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--liceu-muted)", marginBottom: "8px" }}>@{account.username}</p>
                  <p style={{ fontSize: "12px", color: "var(--liceu-muted)" }}>Perfil: {account.profileName}</p>
                  <p style={{ fontSize: "12px", color: "var(--liceu-muted)", marginTop: "8px" }}>
                    Última sincronização: {account.lastSync ? new Date(account.lastSync).toLocaleString("pt-BR") : "Nunca"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div>
          <h2 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "20px", fontWeight: "700", color: "var(--liceu-text)", marginBottom: "16px" }}>
            Posts Agendados / Publicados
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Carregando...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Nenhum post encontrado.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--liceu-surface-container)" }}>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Conteúdo</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Plataformas</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Agendado para</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post._id} style={{ borderBottom: "1px solid var(--liceu-stone)", background: "var(--liceu-bg)" }}>
                      <td style={{ padding: "12px", fontSize: "14px", color: "var(--liceu-text)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.content}</td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--liceu-muted)" }}>
                        {post.platforms.map((p) => (
                          <span key={p.accountId} style={{ display: "inline-block", marginRight: "8px", padding: "2px 8px", fontSize: "10px", background: "var(--liceu-surface-container-highest)", borderRadius: "4px" }}>
                            {p.platform}: {p.status}
                          </span>
                        ))}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "4px 8px",
                          fontSize: "10px",
                          borderRadius: "9999px",
                          background: post.status === "published" ? "rgba(0, 200, 0, 0.2)" :
                                     post.status === "scheduled" ? "rgba(0, 100, 255, 0.2)" :
                                     post.status === "draft" ? "rgba(200, 200, 200, 0.2)" :
                                     "rgba(255, 200, 0, 0.2)",
                          color: post.status === "published" ? "#6bff6b" :
                                 post.status === "scheduled" ? "#6b9fff" :
                                 post.status === "draft" ? "#ccc" :
                                 "#ffcc6b",
                        }}>
                          {post.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--liceu-muted)" }}>
                        {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--liceu-muted)" }}>
                        {new Date(post.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Post Tab */}
      {activeTab === "create" && (
        <div style={{ maxWidth: "600px" }}>
          <h2 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "20px", fontWeight: "700", color: "var(--liceu-text)", marginBottom: "24px" }}>
            Criar Novo Post
          </h2>
          <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-text)", marginBottom: "8px" }}>
                Conteúdo
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--liceu-stone)",
                  borderRadius: "8px",
                  background: "var(--liceu-surface-container)",
                  color: "var(--liceu-text)",
                  fontFamily: "var(--font-work-sans)",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                placeholder="Escreva seu post aqui..."
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-text)", marginBottom: "8px" }}>
                Plataformas / Contas
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {accounts.map((account) => (
                  <label key={account.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid var(--liceu-stone)", borderRadius: "8px", cursor: "pointer", background: "var(--liceu-surface-container)" }}>
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={(e) => setSelectedAccountIds(
                        e.target.checked
                          ? [...selectedAccountIds, account.id]
                          : selectedAccountIds.filter((id) => id !== account.id)
                      )}
                      style={{ accentColor: "var(--liceu-accent)" }}
                    />
                    <span style={{ fontSize: "14px", color: "var(--liceu-text)" }}>{account.platform} - @{account.username}</span>
                    <span style={{ fontSize: "11px", color: "var(--liceu-muted)" }}>({account.profileName})</span>
                  </label>
                ))}
                {accounts.length === 0 && <p style={{ fontSize: "14px", color: "var(--liceu-muted)" }}>Nenhuma conta disponível. Configure no dashboard do Zernio.</p>}
              </div>
            </div>

            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-text)", marginBottom: "8px" }}>
                  Agendar para
                </label>
                <input
                  type="datetime-local"
                  value={newPostScheduledFor}
                  onChange={(e) => setNewPostScheduledFor(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid var(--liceu-stone)",
                    borderRadius: "8px",
                    background: "var(--liceu-surface-container)",
                    color: "var(--liceu-text)",
                    fontFamily: "var(--font-work-sans)",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newPostPublishNow}
                    onChange={(e) => setNewPostPublishNow(e.target.checked)}
                    style={{ accentColor: "var(--liceu-accent)" }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--liceu-text)" }}>Publicar agora</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPostContent.trim() || selectedAccountIds.length === 0}
              style={{
                padding: "12px 16px",
                background: "var(--liceu-accent)",
                color: "var(--liceu-primary)",
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !newPostContent.trim() || selectedAccountIds.length === 0 ? "not-allowed" : "pointer",
                opacity: loading || !newPostContent.trim() || selectedAccountIds.length === 0 ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Publicando..." : "Publicar Post"}
            </button>
          </form>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <h2 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "20px", fontWeight: "700", color: "var(--liceu-text)", marginBottom: "24px" }}>
            Analytics
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Carregando...</div>
          ) : analytics ? (
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div style={{ padding: "20px", border: "1px solid var(--liceu-stone)", borderRadius: "12px", background: "var(--liceu-surface-container)" }}>
                <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Total de Posts</p>
                <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "32px", fontWeight: "700", color: "var(--liceu-text)", marginTop: "8px" }}>{analytics.overview?.totalPosts || 0}</p>
              </div>
              <div style={{ padding: "20px", border: "1px solid var(--liceu-stone)", borderRadius: "12px", background: "var(--liceu-surface-container)" }}>
                <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Engajamento Total</p>
                <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "32px", fontWeight: "700", color: "var(--liceu-text)", marginTop: "8px" }}>{analytics.overview?.totalEngagement || 0}</p>
              </div>
              <div style={{ padding: "20px", border: "1px solid var(--liceu-stone)", borderRadius: "12px", background: "var(--liceu-surface-container)" }}>
                <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Alcance Total</p>
                <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "32px", fontWeight: "700", color: "var(--liceu-text)", marginTop: "8px" }}>{analytics.overview?.totalReach || 0}</p>
              </div>
              <div style={{ padding: "20px", border: "1px solid var(--liceu-stone)", borderRadius: "12px", background: "var(--liceu-surface-container)" }}>
                <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Seguidores Totais</p>
                <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "32px", fontWeight: "700", color: "var(--liceu-text)", marginTop: "8px" }}>{analytics.overview?.totalFollowers || 0}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Nenhum dado de analytics disponível.</div>
          )}
        </div>
      )}

      {/* Inbox Tab */}
      {activeTab === "inbox" && (
        <div>
          <h2 style={{ fontFamily: "var(--font-noto-serif)", fontSize: "20px", fontWeight: "700", color: "var(--liceu-text)", marginBottom: "16px" }}>
            Caixa de Entrada Unificada
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Carregando...</div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--liceu-muted)" }}>Nenhuma conversa.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--liceu-surface-container)" }}>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Plataforma</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Contato</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Última Mensagem</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Não Lidas</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--liceu-muted)" }}>Última Atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conv) => (
                    <tr key={conv._id} style={{ borderBottom: "1px solid var(--liceu-stone)", background: "var(--liceu-bg)" }}>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "4px 8px", fontSize: "10px", background: "var(--liceu-surface-container-highest)", borderRadius: "4px", textTransform: "capitalize" }}>{conv.platform}</span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "var(--liceu-text)" }}>
                        <div style={{ fontWeight: "600" }}>{conv.contactName}</div>
                        <div style={{ fontSize: "11px", color: "var(--liceu-muted)" }}>@{conv.contactHandle}</div>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--liceu-muted)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.lastMessage}</td>
                      <td style={{ padding: "12px" }}>
                        {conv.unreadCount > 0 && (
                          <span style={{ padding: "4px 8px", fontSize: "10px", background: "rgba(255, 0, 0, 0.2)", color: "#ff6b6b", borderRadius: "9999px" }}>{conv.unreadCount}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "4px 8px",
                          fontSize: "10px",
                          borderRadius: "9999px",
                          background: conv.status === "open" ? "rgba(0, 200, 0, 0.2)" :
                                     conv.status === "closed" ? "rgba(200, 200, 200, 0.2)" :
                                     "rgba(255, 200, 0, 0.2)",
                          color: conv.status === "open" ? "#6bff6b" :
                                 conv.status === "closed" ? "#ccc" :
                                 "#ffcc6b",
                        }}>
                          {conv.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "var(--liceu-muted)" }}>
                        {new Date(conv.lastMessageAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}