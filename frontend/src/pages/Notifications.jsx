import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Dohvaćanje obavijesti - port 5000
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Greška pri dohvaćanju obavijesti:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. Označavanje pojedinačne obavijesti - POST metoda prema tvojim rutama
  const markAsRead = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Greška pri označavanju:', error);
    }
  };

  // 3. Označavanje svih kao pročitano
  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Greška pri označavanju svih:', error);
    }
  };

  const getNotificationText = (notif) => {
    const sender = notif.Sender?.username || 'Netko';
    switch (notif.type) {
      case 'like': return `${sender} je lajkao tvoj tweet.`;
      case 'comment': return `${sender} je komentirao tvoj tweet.`;
      case 'follow': return `${sender} te počeo pratiti.`;
      default: return `${sender} ima novu aktivnost.`;
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Učitavanje...</div>;

  return (
    <div className="flex-1 border-x border-gray-800 min-h-screen text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Obavijesti</h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            className="text-sm text-blue-400 hover:text-blue-300 transition"
            onClick={handleMarkAllAsRead}
          >
            Označi sve kao pročitano
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-gray-500 italic">Trenutno nemate obavijesti.</p>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={`p-4 border-b border-gray-800 transition flex items-center justify-between ${
                n.isRead ? 'opacity-60 bg-transparent' : 'bg-gray-900/50 hover:bg-gray-800 cursor-pointer'
              }`}
            >
              <div className="flex flex-col">
                <p className={`${!n.isRead ? 'font-semibold text-gray-100' : 'text-gray-400'}`}>
                  {getNotificationText(n)}
                </p>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(n.createdAt).toLocaleDateString('hr-HR')} u {new Date(n.createdAt).toLocaleTimeString('hr-HR', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              {!n.isRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;