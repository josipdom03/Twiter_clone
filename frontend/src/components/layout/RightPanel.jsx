import React from 'react';

const RightPanel = () => {
  return (
    <div className="flex flex-col py-2 space-y-4">
      {/* Search Bar */}
      <div className="sticky top-0 bg-black py-2">
        <div className="flex items-center bg-gray-900 p-3 rounded-full border border-transparent focus-within:border-blue-400 transition">
          <span className="text-gray-500 mr-3">🔍</span>
          <input 
            type="text" 
            placeholder="Pretraži Twitter" 
            className="bg-transparent outline-none text-white w-full"
          />
        </div>
      </div>

      {/* Trends Section */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Što se događa</h2>
        <div className="space-y-4">
          <TrendItem category="Tehnologija · Trend" title="#JavaScript" tweets="12.5K" />
          <TrendItem category="Hrvatska · Trend" title="Velebit" tweets="2.1K" />
          <TrendItem category="Sport · Trend" title="Hajduk" tweets="5.8K" />
        </div>
        <button className="text-blue-400 text-sm mt-4 hover:underline">Prikaži više</button>
      </div>

      {/* Who to follow (Opcionalno kasnije) */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Koga pratiti</h2>
        <p className="text-gray-500 text-sm">Prijedlozi će se pojaviti ovdje.</p>
      </div>
    </div>
  );
};

const TrendItem = ({ category, title, tweets }) => (
  <div className="hover:bg-gray-800 cursor-pointer transition p-2 rounded-lg">
    <p className="text-gray-500 text-xs">{category}</p>
    <p className="font-bold">{title}</p>
    <p className="text-gray-500 text-xs">{tweets} Tweets</p>
  </div>
);

export default RightPanel;