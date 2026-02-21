import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HistoryItem {
  id: number;
  method: string;
  url: string;
  timestamp: string;
}

interface SidebarHistoryProps {
  onItemClick: (item: any) => void;
}

export default function SidebarHistory({ onItemClick }: SidebarHistoryProps) {
  const { token, user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [token, fetchHistory]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 opacity-50">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
           <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
           </svg>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Login to view history</p>
      </div>
    );
  }

  if (loading && history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto py-2">
      {history.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <p className="text-xs">No history yet</p>
        </div>
      ) : (
        <div className="space-y-1 px-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-all group text-left border border-transparent hover:border-gray-800"
            >
              <span className={`text-[10px] font-bold w-10 text-center py-0.5 rounded ${
                item.method === 'GET' ? 'text-green-400 bg-green-400/10' :
                item.method === 'POST' ? 'text-yellow-400 bg-yellow-400/10' :
                'text-blue-400 bg-blue-400/10'
              }`}>
                {item.method}
              </span>
              <span className="text-xs text-gray-300 truncate font-mono flex-1">{item.url}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
