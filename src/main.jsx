import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

import './i18n.js';
import HomePage from './pages/Homepage.jsx';
import List from './pages/List.jsx';

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
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
