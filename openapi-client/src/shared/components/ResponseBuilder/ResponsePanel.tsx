interface ResponsePanelProps {
  response: any;
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  if (!response) {
    return (
      <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl items-center justify-center p-10 opacity-30">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm font-bold uppercase tracking-widest">Send a request to see the response</p>
      </div>
    );
  }

  const isError = !!response.error;
  const statusClass = response.status >= 200 && response.status < 300 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400';

  return (
    <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-gray-800 bg-gray-950/20 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Response</h2>
        {!isError && (
          <div className="flex gap-4 items-center">
             <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${statusClass}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${response.status < 300 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-bold font-mono">{response.status} {response.statusText}</span>
             </div>
             {/* Note: Time could be tracked in the proxy or frontend if needed */}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="h-full rounded-xl bg-gray-950/50 border border-gray-800 p-4 relative group">
            <pre className={`text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-gray-300'}`}>
              {JSON.stringify(isError ? response.error : response.data, null, 2)}
            </pre>
        </div>
      </div>
    </div>
  );
}
