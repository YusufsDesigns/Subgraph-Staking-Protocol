export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 48,
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
        Page not found
      </p>
      <a
        href="/stake"
        className="mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
          fontFamily: "var(--font-syne), sans-serif",
        }}
      >
        Back to Stake
      </a>
    </div>
  )
}
