import { useState, useEffect, useMemo } from 'react';
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

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

const createEmptyPair = (): KeyValuePair => ({
  id: crypto.randomUUID(),
  key: '',
  value: '',
  enabled: true,
});

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
  headers: KeyValuePair[];
  setHeaders: (headers: KeyValuePair[]) => void;
  params: KeyValuePair[];
  setParams: (params: KeyValuePair[]) => void;
  activeSavedRequest?: any;
  onSavedRequestUpdate?: (req: any) => void;
  onNewRequest?: () => void;
}

/* ─── Key-Value Pair Editor ─── */
function KeyValueEditor({
  pairs,
  onChange,
  disabled,
  placeholder = { key: 'Key', value: 'Value' },
}: {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  disabled?: boolean;
  placeholder?: { key: string; value: string };
}) {
  const updatePair = (id: string, field: 'key' | 'value', val: string) => {
    const updated = pairs.map(p => (p.id === id ? { ...p, [field]: val } : p));
    // Auto-add a new empty row when the last row gets content
    const last = updated[updated.length - 1];
    if (last && (last.key || last.value)) {
      updated.push(createEmptyPair());
    }
    onChange(updated);
  };

  const togglePair = (id: string) => {
    onChange(pairs.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const removePair = (id: string) => {
    const filtered = pairs.filter(p => p.id !== id);
    if (filtered.length === 0) filtered.push(createEmptyPair());
    onChange(filtered);
  };

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="w-8" />
        <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">{placeholder.key}</span>
        <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">{placeholder.value}</span>
        <div className="w-8" />
      </div>

      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-2 group">
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => togglePair(pair.id)}
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
              pair.enabled
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                : 'border-gray-700 bg-gray-800/50 text-gray-600'
            } hover:border-blue-500/50 disabled:opacity-50`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {pair.enabled && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />}
            </svg>
          </button>

          {/* Key */}
          <input
            type="text"
            value={pair.key}
            onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
            disabled={disabled}
            placeholder={placeholder.key}
            className={`flex-1 h-9 bg-gray-800/50 border border-gray-700 rounded-lg px-3 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50 ${
              pair.enabled ? 'text-gray-200' : 'text-gray-500 line-through'
            }`}
          />

          {/* Value */}
          <input
            type="text"
            value={pair.value}
            onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
            disabled={disabled}
            placeholder={placeholder.value}
            className={`flex-1 h-9 bg-gray-800/50 border border-gray-700 rounded-lg px-3 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50 ${
              pair.enabled ? 'text-blue-100' : 'text-gray-500 line-through'
            }`}
          />

          {/* Delete */}
          <button
            type="button"
            onClick={() => removePair(pair.id)}
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Request Panel ─── */
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
  headers,
  setHeaders,
  params,
  setParams,
  activeSavedRequest,
  onSavedRequestUpdate,
  onNewRequest
}: RequestPanelProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  // Path params: auto-detect :param placeholders in URL
  const [pathParams, setPathParams] = useState<Record<string, string>>({});

  // Extract path param names from URL (e.g. :quote_id, :userId)
  // Only matches :word starting with a letter (ignores port numbers like :8000)
  const detectedPathParams = useMemo(() => {
    const matches = url.match(/:([a-zA-Z]\w*)/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1)))];
  }, [url]);

  // Sync pathParams state when detected params change
  useEffect(() => {
    setPathParams(prev => {
      const next: Record<string, string> = {};
      detectedPathParams.forEach(name => {
        next[name] = prev[name] ?? '';
      });
      return next;
    });
  }, [detectedPathParams]);

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

  // Convert KeyValuePair[] to a plain object (only enabled pairs)
  const pairsToObj = (pairs: KeyValuePair[]) => {
    const obj: Record<string, string> = {};
    pairs.forEach(p => { if (p.enabled && p.key) obj[p.key] = p.value; });
    return obj;
  };

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
        headers: pairsToObj(headers)
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
        headers: pairsToObj(headers)
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

      // Replace path params in URL (e.g. :quote_id -> actual value)
      let finalUrl = url;
      detectedPathParams.forEach(name => {
        const value = pathParams[name] || '';
        finalUrl = finalUrl.replace(`:${name}`, encodeURIComponent(value));
      });

      // Append query params
      const enabledParams = params.filter(p => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const qs = new URLSearchParams();
        enabledParams.forEach(p => qs.append(p.key, p.value));
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs.toString();
      }

      // Build headers object from enabled header pairs
      const reqHeaders = pairsToObj(headers);

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          method,
          url: finalUrl,
          headers: Object.keys(reqHeaders).length > 0 ? reqHeaders : undefined,
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
          {(['params', 'headers', 'body'] as const).map(tab => {
            // Show badge count for non-empty params / headers
            const count = tab === 'params'
              ? params.filter(p => p.enabled && p.key).length
              : tab === 'headers'
                ? headers.filter(h => h.enabled && h.key).length
                : 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'params' && (
            <div className="space-y-6">
              {/* Path Parameters (auto-detected from URL) */}
              {detectedPathParams.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Path Parameters</h3>
                    <span className="text-[10px] text-gray-600">— auto-detected from URL</span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {detectedPathParams.map(name => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="w-36 font-mono text-sm text-amber-300/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-3 h-9 flex items-center truncate"
                          title={`:${name}`}
                        >
                          :{name}
                        </span>
                        <input
                          type="text"
                          value={pathParams[name] || ''}
                          onChange={(e) => setPathParams(prev => ({ ...prev, [name]: e.target.value }))}
                          disabled={loading}
                          placeholder={`Enter ${name}`}
                          className="flex-1 h-9 bg-gray-800/50 border border-gray-700 rounded-lg px-3 font-mono text-sm text-blue-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Parameters */}
              <div className="space-y-3">
                {detectedPathParams.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Query Parameters</h3>
                  </div>
                )}
                {params.length > 0 ? (
                  <>
                    <KeyValueEditor
                      pairs={params}
                      onChange={setParams}
                      disabled={loading}
                      placeholder={{ key: 'Parameter', value: 'Value' }}
                    />
                    <button
                      type="button"
                      onClick={() => setParams([...params, createEmptyPair()])}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-400 border border-dashed border-gray-700 hover:border-blue-500/30 rounded-lg transition-all hover:bg-blue-500/5 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Parameter
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setParams([createEmptyPair()])}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-6 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-400 border-2 border-dashed border-gray-800 hover:border-blue-500/30 rounded-xl transition-all hover:bg-blue-500/5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Query Parameter
                  </button>
                )}
              </div>
            </div>
          )}
          {activeTab === 'headers' && (
            <div className="space-y-3">
              {headers.length > 0 ? (
                <>
                  <KeyValueEditor
                    pairs={headers}
                    onChange={setHeaders}
                    disabled={loading}
                    placeholder={{ key: 'Header', value: 'Value' }}
                  />
                  <button
                    type="button"
                    onClick={() => setHeaders([...headers, createEmptyPair()])}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-400 border border-dashed border-gray-700 hover:border-blue-500/30 rounded-lg transition-all hover:bg-blue-500/5 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Header
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setHeaders([createEmptyPair()])}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-6 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-400 border-2 border-dashed border-gray-800 hover:border-blue-500/30 rounded-xl transition-all hover:bg-blue-500/5 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Header
                </button>
              )}
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
