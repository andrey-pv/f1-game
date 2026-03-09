export default function LoadingSpinner({ fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-4 overflow-hidden bg-f1-accent rounded-full">
        <div className="f1-loader absolute top-0 left-0 text-2xl">🏎</div>
      </div>
      <p className="text-f1-muted text-sm font-mono">Loading...</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-f1-dark flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-12">{content}</div>
}
