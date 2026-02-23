import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { 
  getWorkspaces, 
  getCollections, 
  createSavedRequest, 
  updateSavedRequest,
  type Workspace, 
  type Collection 
} from '@/shared/services/workspace';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

interface RequestPanelProps {
  onResponse: (response: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  method: HttpMethod;
  setMethod: (method: HttpMethod) => void;
  url: string;
  setUrl: (url: string) => void;
  body: string;
  setBody: (body: string) => void;
  activeSavedRequest?: any;
  onSavedRequestUpdate?: (req: any) => void;
  onNewRequest?: () => void;
}

export default function RequestPanel({ 
  onResponse, 
  loading, 
  setLoading,
  method,
  setMethod,
  url,
  setUrl,
  body,
  setBody,
  activeSavedRequest,
  onSavedRequestUpdate,
  onNewRequest
}: RequestPanelProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  // Save Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWs, setSelectedWs] = useState<number | ''>('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCol, setSelectedCol] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (saveModalOpen && token) {
      getWorkspaces(token).then(setWorkspaces).catch(console.error);
    }
  }, [saveModalOpen, token]);

  useEffect(() => {
    if (selectedWs && token) {
      getCollections(token, Number(selectedWs)).then(setCollections).catch(console.error);
    } else {
      setCollections([]);
    }
  }, [selectedWs, token]);

  const handleQuickSave = async () => {
    if (!token || !activeSavedRequest) return;
    setSaving(true);
    try {
      let parsedBody = null;
      try { parsedBody = body ? JSON.parse(body) : null; } catch { parsedBody = body; }

      const updated = await updateSavedRequest(token, activeSavedRequest.id, {
        name: activeSavedRequest.name,
        method,
        url,
        body: typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody),
        headers: activeSavedRequest.headers || {}
      });
      if (onSavedRequestUpdate) onSavedRequestUpdate(updated);
    } catch (err) {
      console.error('Failed to update request', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (activeSavedRequest) {
      await handleQuickSave();
      return;
    }
    
    if (!saveModalOpen) {
      setSaveName('');
      setSaveModalOpen(true);
      return;
    }

    if (!token || !selectedCol || !saveName) return;
    setSaving(true);
    try {
      let parsedBody = null;
      try { parsedBody = body ? JSON.parse(body) : null; } catch { parsedBody = body; }

      const newReq = await createSavedRequest(token, Number(selectedCol), {
        name: saveName,
        method,
        url,
        body: typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody),
        headers: {} // TODO: implement headers state
      });
      setSaveModalOpen(false);
      setSaveName('');
      if (onSavedRequestUpdate) onSavedRequestUpdate(newReq);
    } catch (err) {
      console.error('Failed to save request', err);
    } finally {
      setSaving(false);
    }
  };

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
    <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
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

        <div className="flex-1 flex flex-col gap-1 min-w-0">
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
          onClick={onNewRequest}
          className="h-11 px-4 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center group"
          title="New Request"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <button 
          onClick={handleSave}
          disabled={loading || !url || !token || saving}
          className={`h-11 px-4 border rounded-xl transition-all flex items-center gap-2 disabled:opacity-30 ${
            activeSavedRequest 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20' 
              : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'
          }`}
          title={activeSavedRequest ? "Save changes to this request" : "Save to Collection"}
        >
          {saving ? (
             <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
        </button>

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

      {/* SAVE MODAL */}
      {saveModalOpen && (
        <div className="absolute inset-0 z-50 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-6 transition-all">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Save Request</h3>
              <button 
                onClick={() => setSaveModalOpen(false)} 
                className="text-gray-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Request Name</label>
                <input 
                  type="text" 
                  value={saveName} 
                  onChange={e => setSaveName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Get User Profile"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Workspace</label>
                <select 
                  value={selectedWs}
                  onChange={e => setSelectedWs(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Workspace</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>

              {selectedWs && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Collection</label>
                  <select 
                    value={selectedCol}
                    onChange={e => setSelectedCol(e.target.value as any)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Collection</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !saveName || !selectedCol}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
            >
              {saving ? 'Saving...' : 'Save Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
