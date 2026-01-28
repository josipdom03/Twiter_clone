import React from 'react';
import { NavLink } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

const Sidebar = observer(() => {
  const menuItems = [
    { name: 'Početna', path: '/', icon: '🏠' },
    { name: 'Obavijesti', path: '/notifications', icon: '🔔' },
    { name: 'Profil', path: `/${authStore.user?.username || 'profile'}`, icon: '👤' },
  ];

  return (
    <div className="flex flex-col h-full py-4 justify-between">
      <div className="flex flex-col space-y-2">
        {/* Logo */}
        <div className="px-4 mb-4">
          <div className="w-8 h-8 bg-blue-400 rounded-full"></div>
        </div>

        {/* Navigacija */}
        <nav className="flex flex-col space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-4 p-3 rounded-full hover:bg-gray-900 transition ${
                  isActive ? 'font-bold text-blue-400' : 'text-white'
                }`
              }
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="hidden xl:block text-xl">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Tweet gumb */}
        <button className="bg-blue-400 text-white rounded-full py-3 mt-4 font-bold text-lg hover:bg-blue-500 transition hidden xl:block">
          Objavi
        </button>
      </div>

      {/* Profilni dio na dnu */}
      <div className="flex items-center p-3 hover:bg-gray-900 rounded-full cursor-pointer transition">
        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
        <div className="ml-3 hidden xl:block">
          <p className="font-bold text-sm">{authStore.user?.username || 'Gost'}</p>
          <p className="text-gray-500 text-sm">@{authStore.user?.username || 'gost'}</p>
        </div>
      </div>
    </div>
  );
});

export default Sidebar;