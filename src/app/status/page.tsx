export default function StatusPage() {
  const services = [
    { name: "API", status: "Operational" },
    { name: "Database", status: "Operational" },
    { name: "Realtime", status: "Operational" },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            System Status
          </h1>
          <div className="bg-white shadow rounded-lg divide-y">
            {services.map((s) => (
              <div
                key={s.name}
                className="p-4 flex items-center justify-between"
              >
                <span className="font-medium text-gray-900">{s.name}</span>
                <span className="text-green-700">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
