import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="bg-background text-foreground" style={{ minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#4f46e5" }} />
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>Chronicles — Historical Roleplay</h1>
          </div>
          <nav className="text-muted-foreground" style={{ fontSize: 14 }}>PG-13 • Safety tools enabled</nav>
        </div>
      </header>
      <main style={{ padding: "0 1.5rem" }}>
        <Chat />
      </main>
    </div>
  );
}
