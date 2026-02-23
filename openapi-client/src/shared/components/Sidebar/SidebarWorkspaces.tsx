import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getWorkspaces, 
  createWorkspace, 
  getCollections, 
  createCollection, 
  getSavedRequests,
  createSavedRequest,
  type Workspace,
  type Collection,
  type SavedRequest 
} from '../../services/workspace';

interface SidebarWorkspacesProps {
  onSelectRequest: (request: SavedRequest) => void;
  onAuthClick: () => void;
  activeRequestId?: number;
  refreshKey?: number;
  onCreateRequest?: () => void;
}

export default function SidebarWorkspaces({ 
  onSelectRequest, 
  onAuthClick, 
  activeRequestId,
  refreshKey,
  onCreateRequest 
}: SidebarWorkspacesProps) {
  const { token, user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  // loading state removed as it was unused
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<number, boolean>>({});
  const [expandedCollections, setExpandedCollections] = useState<Record<number, boolean>>({});
  const [workspaceCollections, setWorkspaceCollections] = useState<Record<number, Collection[]>>({});
  const [collectionRequests, setCollectionRequests] = useState<Record<number, SavedRequest[]>>({});
  const [creatingWs, setCreatingWs] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getWorkspaces(token);
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchWorkspaces();
      
      // Refresh expanded collections to reflect updates
      Object.entries(expandedCollections).forEach(([colId, isExpanded]) => {
        if (isExpanded) {
          getSavedRequests(token, Number(colId)).then(reqs => {
            setCollectionRequests(prev => ({ ...prev, [Number(colId)]: reqs }));
          }).catch(console.error);
        }
      });
    }
  }, [token, fetchWorkspaces, refreshKey]);

  const handleCreateWorkspace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !newWsName.trim() || creatingWs) return;
    
    setCreatingWs(true);
    try {
      await createWorkspace(token, newWsName);
      setNewWsName('');
      setShowCreateWs(false);
      await fetchWorkspaces();
    } catch (err) {
      console.error('Failed to create workspace', err);
      // Maybe add a temporary error message here in a real app
    } finally {
      setCreatingWs(false);
    }
  };

  const toggleWorkspace = async (wsId: number) => {
    const isExpanded = !!expandedWorkspaces[wsId];
    setExpandedWorkspaces(prev => ({ ...prev, [wsId]: !isExpanded }));

    if (!isExpanded && !workspaceCollections[wsId] && token) {
      try {
        const data = await getCollections(token, wsId);
        setWorkspaceCollections(prev => ({ ...prev, [wsId]: data }));
      } catch (err) {
        console.error('Failed to fetch collections', err);
      }
    }
  };

  const toggleCollection = async (colId: number) => {
    const isExpanded = !!expandedCollections[colId];
    setExpandedCollections(prev => ({ ...prev, [colId]: !isExpanded }));

    if (!isExpanded && !collectionRequests[colId] && token) {
      try {
        const data = await getSavedRequests(token, colId);
        setCollectionRequests(prev => ({ ...prev, [colId]: data }));
      } catch (err) {
        console.error('Failed to fetch requests', err);
      }
    }
  };

  const [creatingCollectionIn, setCreatingCollectionIn] = useState<number | null>(null);
  const [newColName, setNewColName] = useState('');
  const [creatingRequestIn, setCreatingRequestIn] = useState<number | null>(null);
  const [newReqName, setNewReqName] = useState('');

  const handleCreateCollection = async (wsId: number) => {
    if (!token || !newColName.trim()) return;
    try {
      await createCollection(token, wsId, newColName);
      setNewColName('');
      setCreatingCollectionIn(null);
      // Refresh collections for this workspace
      const data = await getCollections(token, wsId);
      setWorkspaceCollections(prev => ({ ...prev, [wsId]: data }));
    } catch (err) {
      console.error('Failed to create collection', err);
    }
  };

  const handleCreateRequest = async (colId: number) => {
    if (!token || !newReqName.trim()) return;
    try {
      const data = await createSavedRequest(token, colId, {
        name: newReqName,
        method: 'GET',
        url: '',
        headers: {},
        body: ''
      });
      setNewReqName('');
      setCreatingRequestIn(null);
      // Refresh requests for this collection
      const reqs = await getSavedRequests(token, colId);
      setCollectionRequests(prev => ({ ...prev, [colId]: reqs }));
      // Select the new request
      onSelectRequest(data);
    } catch (err) {
      console.error('Failed to create request', err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 opacity-50">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
           <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
           </svg>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Login to use workspaces</p>
        <button 
          onClick={onAuthClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all text-xs font-bold uppercase tracking-tight"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto py-2">
      <div className="px-4 mb-4">
        {showCreateWs ? (
          <div className="space-y-2">
            <input
              autoFocus
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Workspace Name"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              disabled={creatingWs}
            />
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowCreateWs(false)} 
                disabled={creatingWs}
                className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleCreateWorkspace()}
                disabled={creatingWs || !newWsName.trim()}
                className="text-[10px] text-blue-500 font-bold uppercase tracking-tight hover:text-blue-400 disabled:opacity-30"
              >
                {creatingWs ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowCreateWs(true)}
            className="w-full py-2 border border-dashed border-gray-800 rounded-xl text-gray-500 hover:text-white hover:border-gray-700 transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            + New Workspace
          </button>
        )}
      </div>

      <div className="space-y-1 px-2">
        {workspaces.map(ws => (
          <div key={ws.id} className="space-y-1">
            <button 
              onClick={() => toggleWorkspace(ws.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 group transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 transition-transform ${expandedWorkspaces[ws.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs font-medium text-gray-300">{ws.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setCreatingCollectionIn(ws.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </button>

            {expandedWorkspaces[ws.id] && (
              <div className="ml-6 space-y-1">
                {creatingCollectionIn === ws.id && (
                  <div className="p-2 space-y-2">
                    <input
                      autoFocus
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                      placeholder="Collection Name"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection(ws.id)}
                      onBlur={() => !newColName && setCreatingCollectionIn(null)}
                    />
                  </div>
                )}
                {workspaceCollections[ws.id]?.map(col => (
                  <div key={col.id} className="space-y-1">
                    <div className="relative group">
                      <button 
                        onClick={() => toggleCollection(col.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/30 transition-all border border-transparent hover:border-gray-800"
                      >
                        <svg className={`w-2.5 h-2.5 transition-transform ${expandedCollections[col.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <svg className="w-3.5 h-3.5 text-yellow-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-[11px] text-gray-400 font-medium truncate">{col.name}</span>
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setCreatingRequestIn(col.id); 
                          if (onCreateRequest) onCreateRequest();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-all text-gray-500 hover:bg-gray-800 rounded"
                        title="Add Request"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {expandedCollections[col.id] && (
                      <div className="ml-4 space-y-1 border-l border-gray-800 pl-2 mt-1">
                        {creatingRequestIn === col.id && (
                          <div className="p-1 px-2">
                            <input
                              autoFocus
                              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="New Request Name"
                              value={newReqName}
                              onChange={(e) => setNewReqName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCreateRequest(col.id)}
                              onBlur={() => !newReqName && setCreatingRequestIn(null)}
                            />
                          </div>
                        )}
                        {collectionRequests[col.id]?.map(req => (
                          <button
                            key={req.id}
                            onClick={() => onSelectRequest(req)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all group whitespace-nowrap overflow-hidden ${
                              activeRequestId === req.id 
                                ? 'bg-blue-600/10 border border-blue-500/20' 
                                : 'hover:bg-gray-800/20 border border-transparent'
                            }`}
                          >
                            <span className={`text-[8px] font-bold w-9 flex-shrink-0 text-left py-0.5 ${
                              req.method === 'GET' ? 'text-green-400' :
                              req.method === 'POST' ? 'text-yellow-400' :
                              req.method === 'PUT' ? 'text-blue-400' :
                              req.method === 'PATCH' ? 'text-purple-400' :
                              req.method === 'DELETE' ? 'text-red-400' :
                              req.method === 'HEAD' ? 'text-gray-400' :
                              'text-cyan-400'
                            }`}>
                              {req.method}
                            </span>
                            <span className={`text-[10px] truncate transition-colors flex-1 ${
                              activeRequestId === req.id ? 'text-blue-400 font-medium' : 'text-gray-500 group-hover:text-gray-300'
                            }`}>
                              {req.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
