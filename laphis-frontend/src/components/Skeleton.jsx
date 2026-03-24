/**
 * Skeleton Loading Components
 * Placeholders visuais durante carregamento
 */

export function SkeletonLine({ width = "100%", height = 14, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 8, ...style }}
    />
  );
}

export function SkeletonCircle({ size = 40, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, ...style }}
    />
  );
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        padding: 20,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <SkeletonCircle size={36} />
        <SkeletonLine width="45%" height={16} />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height={12}
          style={{ marginBottom: i < lines - 1 ? 10 : 0 }}
        />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 8 }}>
        <SkeletonLine width="40%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonLine width="60%" height={28} />
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--card-bg)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 16,
            }}
          >
            <SkeletonLine width="50%" height={12} style={{ marginBottom: 10 }} />
            <SkeletonLine width="70%" height={24} style={{ marginBottom: 6 }} />
            <SkeletonLine width="40%" height={10} />
          </div>
        ))}
      </div>

      {/* Cards */}
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0", animation: "fadeIn 0.3s ease" }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: i % 2 === 0 ? "flex-end" : "flex-start",
            gap: 8,
          }}
        >
          {i % 2 !== 0 && <SkeletonCircle size={32} />}
          <SkeletonLine
            width={i % 2 === 0 ? "55%" : "65%"}
            height={i % 2 === 0 ? 40 : 60}
            style={{ borderRadius: 16 }}
          />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--card-bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <SkeletonCircle size={40} />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="55%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonLine width="80%" height={11} />
          </div>
          <SkeletonLine width={40} height={20} style={{ borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
