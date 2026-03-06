import { useState } from 'react';
import Navbar from "@/shared/components/navbar/navbar"
import RequestPanel, { type KeyValuePair } from '@/shared/components/RequestBuilder/RequestPanel';
import ResponsePanel from '@/shared/components/ResponseBuilder/ResponsePanel';
import SidebarHistory from '@/shared/components/Sidebar/SidebarHistory';
import SidebarWorkspaces from '@/shared/components/Sidebar/SidebarWorkspaces';
import AuthModal from '@/shared/components/Auth/AuthModal';
import DocsPage from './DocsPage';

const createEmptyPair = (): KeyValuePair => ({
  id: crypto.randomUUID(),
  key: '',
  value: '',
  enabled: true,
});

// Convert a plain {key: value} object into KeyValuePair[]
const objToPairs = (obj?: Record<string, string> | null): KeyValuePair[] => {
  if (!obj || Object.keys(obj).length === 0) return [createEmptyPair()];
  const pairs: KeyValuePair[] = Object.entries(obj).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
    enabled: true,
  }));
  pairs.push(createEmptyPair());
  return pairs;
};

function App() {
  const [currentView, setCurrentView] = useState<'app' | 'docs'>('app');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'workspaces'>('workspaces');
  const [activeSavedRequest, setActiveSavedRequest] = useState<any>(null);
  
  // Lifted state for the active request
  const [method, setMethod] = useState<any>('GET');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState<KeyValuePair[]>([createEmptyPair()]);
  const [params, setParams] = useState<KeyValuePair[]>([createEmptyPair()]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshWorkspaces = () => setRefreshKey(prev => prev + 1);

  const resetRequest = () => {
    setMethod('GET');
    setUrl('');
    setBody('');
    setHeaders([createEmptyPair()]);
    setParams([createEmptyPair()]);
    setActiveSavedRequest(null);
  };

  const handleRequestSelect = (item: any) => {
    setMethod(item.method || 'GET');
    setUrl(item.url || '');
    setBody(item.body || '');
    setHeaders(objToPairs(item.headers));
    setParams([createEmptyPair()]); // params aren't saved in the DB, reset them
    // Track the active saved request (from collections or workspace)
    setActiveSavedRequest((item.collection_id || item.workspace_id) ? item : null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30 flex flex-col">
      <Navbar onAuthClick={() => setAuthModalOpen(true)} onNavigate={setCurrentView} />

      {currentView === 'docs' ? (
        <DocsPage />
      ) : (
      <main className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (HISTORY / COLLECTIONS) */}
        {/* Sidebar reopen strip when closed */}
        {!sidebarOpen && (
          <div className="flex flex-col items-center bg-gray-900 border-r border-gray-800 py-3 px-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-gray-900 border-r border-gray-800 transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="flex items-center border-b border-gray-800 bg-gray-950/20">
            <button 
              onClick={() => setSidebarTab('workspaces')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${sidebarTab === 'workspaces' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Workspaces
            </button>
            <button 
              onClick={() => setSidebarTab('history')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${sidebarTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              History
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 mx-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex-shrink-0"
              title="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {sidebarTab === 'history' ? (
              <SidebarHistory onItemClick={handleRequestSelect} onAuthClick={() => setAuthModalOpen(true)} />
            ) : (
              <SidebarWorkspaces 
                onSelectRequest={handleRequestSelect} 
                onAuthClick={() => setAuthModalOpen(true)}
                activeRequestId={activeSavedRequest?.id}
                refreshKey={refreshKey}
                onCreateRequest={resetRequest}
              />
            )}
          </div>
        </aside>

        {/* WORKSPACE */}
        <section className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden gap-6">

           <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
              <div className="flex-[2] h-full transition-all duration-500">
                <RequestPanel 
                  onResponse={setResponse} 
                  loading={loading} 
                  setLoading={setLoading}
                  method={method}
                  setMethod={setMethod}
                  url={url}
                  setUrl={setUrl}
                  body={body}
                  setBody={setBody}
                  headers={headers}
                  setHeaders={setHeaders}
                  params={params}
                  setParams={setParams}
                  activeSavedRequest={activeSavedRequest}
                  onSavedRequestUpdate={(req: any) => {
                    setActiveSavedRequest(req);
                    handleRefreshWorkspaces();
                  }}
                  onNewRequest={resetRequest}
                />
              </div>
              <div className="flex-1 h-full transition-all duration-500">
                <ResponsePanel response={response} />
              </div>
           </div>
        </section>
      </main>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default App;
