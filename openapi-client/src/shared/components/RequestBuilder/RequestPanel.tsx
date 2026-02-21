import { useState } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

interface RequestPanelProps {
  onResponse: (response: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  method: HttpMethod;
  setMethod: (method: HttpMethod) => void;
  url: string;
  setUrl: (url: string) => void;
}

export default function RequestPanel({ 
  onResponse, 
  loading, 
  setLoading,
  method,
  setMethod,
  url,
  setUrl
}: RequestPanelProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [body, setBody] = useState('');

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const methodColors: Record<HttpMethod, string> = {
    GET: 'text-green-400 border-green-400/20 bg-green-400/5',
    POST: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
    PUT: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    PATCH: 'text-purple-400 border-purple-400/20 bg-purple-400/5',
    DELETE: 'text-red-400 border-red-400/20 bg-red-400/5',
    HEAD: 'text-gray-400 border-gray-400/20 bg-gray-400/5',
    OPTIONS: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
  };

  const handleSend = async () => {
    debugger;
    if (!url) return;
    setLoading(true);
    try {
      let parsedBody = null;
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
      }

      const response = await fetch('http://localhost:8000/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          method,
          url,
          body: parsedBody
        }),
      });

      const data = await response.json();
      onResponse(data);
    } catch (err: any) {
      onResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* URL BAR SECTION */}
      <div className="p-4 border-b border-gray-800 flex gap-3">
        <div className="relative group">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            disabled={loading}
            className={`h-11 pl-4 pr-10 appearance-none rounded-xl border font-bold text-sm tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50 ${methodColors[method]}`}
          >
            {methods.map(m => (
              <option key={m} value={m} className="bg-gray-900 text-white font-mono">{m}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex-1 relative group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            placeholder=" https://api.example.com/v1/resource"
            className="w-full h-11 bg-gray-800/50 border border-gray-700 rounded-xl px-4 font-mono text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
          />
        </div>

        <button 
          onClick={handleSend}
          disabled={loading || !url}
          className="h-11 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span>SEND</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* TABS SECTION */}
      <div className="flex-1 flex flex-col">
        <div className="flex border-b border-gray-800 bg-gray-950/20">
          {(['params', 'headers', 'body'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab
                  ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'params' && (
            <div className="text-gray-500 italic text-sm text-center py-10 border-2 border-dashed border-gray-800 rounded-xl">
              Query Parameters will go here...
            </div>
          )}
          {activeTab === 'headers' && (
            <div className="text-gray-500 italic text-sm text-center py-10 border-2 border-dashed border-gray-800 rounded-xl">
              Request Headers will go here...
            </div>
          )}
          {activeTab === 'body' && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              className="w-full h-full min-h-[200px] bg-gray-950/50 border border-gray-800 rounded-xl p-4 font-mono text-sm text-blue-100 placeholder-gray-700 focus:outline-none focus:border-blue-500/30 transition-all resize-none disabled:opacity-50"
              placeholder='{ "key": "value" }'
            />
          )}
        </div>
      </div>
    </div>
  );
}
