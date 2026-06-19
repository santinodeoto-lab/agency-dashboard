export default function DashboardLoading() {
  return (
    <div className="p-8 animate-pulse space-y-6">
      <div className="h-7 w-48 bg-gray-800 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-800" />
            <div className="h-4 w-20 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
