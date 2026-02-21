import { useState } from 'react';
import Navbar from "@/shared/components/navbar/navbar"
import RequestPanel from '@/shared/components/RequestBuilder/RequestPanel';
import ResponsePanel from '@/shared/components/ResponseBuilder/ResponsePanel';
import SidebarHistory from '@/shared/components/Sidebar/SidebarHistory';
import AuthModal from '@/shared/components/Auth/AuthModal';
import { useAuth } from '@/shared/contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Lifted state for the active request
  const [method, setMethod] = useState<any>('GET');
  const [url, setUrl] = useState('');

  const handleHistoryClick = (item: any) => {
    setMethod(item.method);
    setUrl(item.url);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30 flex flex-col">
      <Navbar onAuthClick={() => setAuthModalOpen(true)} />

      <main className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (HISTORY / COLLECTIONS) */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-gray-900 border-r border-gray-800 transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">History</h2>
            <button className={`${!user ? 'opacity-0 pointer-events-none' : ''} text-gray-500 hover:text-blue-400 transition-colors`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <SidebarHistory onItemClick={handleHistoryClick} />
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
              <div className="flex-1 h-full">
                <RequestPanel 
                  onResponse={setResponse} 
                  loading={loading} 
                  setLoading={setLoading}
                  method={method}
                  setMethod={setMethod}
                  url={url}
                  setUrl={setUrl}
                />
              </div>
              <div className="flex-1 h-full">
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
