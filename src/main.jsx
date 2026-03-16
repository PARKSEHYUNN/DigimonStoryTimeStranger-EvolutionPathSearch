import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

import './i18n.js';
import HomePage from './pages/HomePage.jsx';
import List from './pages/List.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminEditPage from './pages/AdminEditPage.jsx';

const adminRoutes = import.meta.env.DEV
  ? [
      { path: '/admin', element: <AdminPage /> },
      { path: '/admin/edit', element: <AdminEditPage /> },
    ]
  : [];

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/list',
        element: <List />,
      },
      ...adminRoutes,
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
