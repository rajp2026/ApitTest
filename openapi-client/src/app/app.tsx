import { useEffect, useState } from 'react';
import Navbar from "@/shared/components/navbar"
import { fetchHealth } from "@/shared/services/api";

function App() {
  const [health, setHealth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(data => setHealth(data.status))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Welcome to OpenAPI Client
        </h1>

        <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
          <h2 className="text-lg font-semibold mb-2">Backend Status</h2>
          {error ? (
            <div className="text-red-400">Error: {error}</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${health ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="font-mono">{health ? `Status: ${health}` : 'Connecting...'}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
