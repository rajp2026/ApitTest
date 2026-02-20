import { useEffect, useState } from 'react';
import { fetchItems } from '../services/api';
import type { Item } from '../services/api';

interface ItemListProps {
  refreshTrigger: number;
}

export default function ItemList({ refreshTrigger }: ItemListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [refreshTrigger]);

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 animate-pulse">Loading items from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
        <p className="text-red-400 mb-4 font-medium">Error: {error}</p>
        <button 
          onClick={loadItems}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-400">Database Items</h2>
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-mono">
          {items.length} items
        </span>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-16 px-6 bg-gray-900/20 rounded-2xl border-2 border-dashed border-gray-800">
          <p className="text-gray-500 italic">No items found in the database. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="group p-5 rounded-xl border border-gray-800 bg-gray-950/50 hover:bg-gray-900/80 hover:border-blue-500/30 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-100 group-hover:text-blue-400 transition-colors uppercase tracking-wide">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-2xl">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="text-xs font-mono text-gray-600 bg-gray-900 px-2 py-1 rounded">
                  ID: {item.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
