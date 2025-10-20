// src/App.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import EvolutionPath from './components/EvolutionPath';
import { Analytics } from '@vercel/analytics/react';

import { DigimonDataProvider } from './contexts/DigimonDataProvider';

export default function App() {
  const { t } = useTranslation();

  return (
    <DigimonDataProvider>
      <div className="flex min-h-screen flex-col dark:bg-gray-900">
        <Navbar />
        <div className="flex flex-grow justify-center">
          <div className="w-[100vw] text-center md:w-[80vw]">
            <Outlet />
          </div>
        </div>
      </div>
      <Analytics />
    </DigimonDataProvider>
  );
}
