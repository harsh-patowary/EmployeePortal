import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

function AppLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
