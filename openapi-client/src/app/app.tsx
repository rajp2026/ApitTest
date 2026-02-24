import { useState } from 'react';
import Navbar from "@/shared/components/navbar/navbar"
import RequestPanel from '@/shared/components/RequestBuilder/RequestPanel';
import ResponsePanel from '@/shared/components/ResponseBuilder/ResponsePanel';
import SidebarHistory from '@/shared/components/Sidebar/SidebarHistory';
import SidebarWorkspaces from '@/shared/components/Sidebar/SidebarWorkspaces';
import AuthModal from '@/shared/components/Auth/AuthModal';

function App() {
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
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshWorkspaces = () => setRefreshKey(prev => prev + 1);

  const resetRequest = () => {
    setMethod('GET');
    setUrl('');
    setBody('');
    setActiveSavedRequest(null);
  };

  const handleRequestSelect = (item: any) => {
    setMethod(item.method || 'GET');
    setUrl(item.url || '');
    setBody(item.body || '');
    // Track the active saved request (from collections)
    setActiveSavedRequest(item.collection_id ? item : null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30 flex flex-col">
      <Navbar onAuthClick={() => setAuthModalOpen(true)} />

      <main className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (HISTORY / COLLECTIONS) */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-gray-900 border-r border-gray-800 transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="flex border-b border-gray-800 bg-gray-950/20">
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
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold tracking-tight text-white/90">Request Workspace</h1>
           </div>

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

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default App;
