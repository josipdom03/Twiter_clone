import React from 'react';

const Notifications = () => {
  return (
    <div className="flex-1 border-x border-gray-800 min-h-screen text-white p-4">
      <h1 className="text-xl font-bold mb-4">Obavijesti</h1>
      <div className="space-y-4">
        <p className="text-gray-500 italic">Trenutno nemate novih obavijesti.</p>
      </div>
    </div>
  );
};

export default Notifications;