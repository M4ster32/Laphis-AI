/**
 * Skeleton loading components.
 * Visual placeholders that match the shape of real content
 * to prevent layout shift and perceived jank.
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

/**
 * Skeleton for the Profile page — avatar + info fields.
 */
export function SkeletonProfile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <SkeletonCircle size={72} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="50%" height={20} style={{ marginBottom: 10 }} />
          <SkeletonLine width="35%" height={14} />
        </div>
      </div>

      {/* Form fields */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <SkeletonLine width="30%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLine width="100%" height={42} style={{ borderRadius: "var(--radius-sm)" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the Plans grid — mimics plan cards.
 */
export function SkeletonPlans({ count = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <SkeletonLine width="30%" height={22} />
        <SkeletonLine width={100} height={36} style={{ borderRadius: 12 }} />
      </div>
      {/* Plan cards */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--card-bg)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <SkeletonLine width="55%" height={16} />
            <SkeletonLine width={60} height={22} style={{ borderRadius: 10 }} />
          </div>
          <SkeletonLine width="90%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLine width="70%" height={12} style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <SkeletonLine width={80} height={28} style={{ borderRadius: 8 }} />
            <SkeletonLine width={80} height={28} style={{ borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the Reports page — stats + chart + section list.
 * Mirrors the dense layout of the real report so the jump-in feels seamless.
 */
export function SkeletonReports() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div>
        <SkeletonLine width="45%" height={22} style={{ marginBottom: 8 }} />
        <SkeletonLine width="75%" height={13} />
      </div>

      {/* Top KPI row (4 cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--card-bg)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              padding: "12px 10px",
            }}
          >
            <SkeletonLine width="80%" height={18} style={{ marginBottom: 6 }} />
            <SkeletonLine width="50%" height={10} />
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} width={80} height={32} style={{ borderRadius: 16, flexShrink: 0 }} />
        ))}
      </div>

      {/* Chart area */}
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: 20,
          height: 240,
        }}
      >
        <SkeletonLine width="35%" height={16} style={{ marginBottom: 16 }} />
        <SkeletonLine width="100%" height={180} style={{ borderRadius: 12 }} />
      </div>

      {/* Summary card */}
      <SkeletonCard lines={4} />
    </div>
  );
}

/**
 * Skeleton for the Daily Plan — hero card + sections.
 */
export function SkeletonDailyPlan() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
      {/* Hero card */}
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: 24,
        }}
      >
        <SkeletonLine width="40%" height={14} style={{ marginBottom: 12 }} />
        <SkeletonLine width="75%" height={28} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 16 }}>
          <SkeletonLine width={80} height={16} />
          <SkeletonLine width={80} height={16} />
        </div>
      </div>

      {/* Two big sections */}
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </div>
  );
}

/**
 * Skeleton for the Logs page — timeline-like entries.
 */
export function SkeletonLogs({ count = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.3s ease" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--card-bg)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <SkeletonLine width={6} height={32} style={{ borderRadius: 3, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="45%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonLine width="70%" height={11} />
          </div>
          <SkeletonLine width={50} height={12} />
        </div>
      ))}
    </div>
  );
}
