import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Port 3000 je ispravan prema tvojoj Docker slici
  const API_URL = 'http://localhost:3000/api/notifications';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Dodajemo timestamp na kraj URL-a kako bi izbjegli cache probleme u browseru
      const response = await axios.get(`${API_URL}?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Greška pri dohvaćanju obavijesti:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.post(`${API_URL}/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Sinkroniziramo lokalno stanje
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true, is_read: true } : n
      ));
    } catch (error) {
      console.error('Greška pri označavanju:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(`${API_URL}/read-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
    } catch (error) {
      console.error('Greška pri označavanju svih:', error);
    }
  };

  const getNotificationText = (notif) => {
    // Provjera postoji li Sender objekt da izbjegnemo crash
    const sender = notif.Sender?.username || notif.sender?.username || 'Netko';
    
    switch (notif.type) {
      case 'like': return `${sender} je lajkao tvoj tweet.`;
      case 'comment': return `${sender} je komentirao tvoj tweet.`;
      case 'follow': return `${sender} te počeo pratiti.`;
      case 'message': return `${sender} ti je poslao poruku.`;
      default: return `${sender} ima novu aktivnost.`;
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Učitavanje...</div>;

  return (
    <div className="flex-1 border-x border-gray-800 min-h-screen text-white p-4 bg-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Obavijesti</h1>
        {notifications.some(n => !n.isRead && !n.is_read) && (
          <button 
            className="text-sm text-blue-400 hover:text-blue-300 transition font-medium"
            onClick={handleMarkAllAsRead}
          >
            Označi sve kao pročitano
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 italic">Trenutno nemate obavijesti.</p>
          </div>
        ) : (
          notifications.map((n) => {
            // Sequelize u bazi koristi is_read, u JS-u može biti isRead
            const isRead = n.isRead || n.is_read;
            
            return (
              <div 
                key={n.id} 
                onClick={() => !isRead && markAsRead(n.id)}
                className={`p-4 border-b border-gray-800 transition flex items-center justify-between ${
                  isRead ? 'opacity-50' : 'bg-gray-900/30 hover:bg-gray-800 cursor-pointer'
                }`}
              >
                <div className="flex flex-col">
                  <p className={`${!isRead ? 'font-bold text-gray-100' : 'text-gray-400'}`}>
                    {getNotificationText(n)}
                  </p>
                  <span className="text-xs text-gray-500 mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('hr-HR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : 'Nedavno'}
                  </span>
                </div>
                {!isRead && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;