// src/App.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import EvolutionPath from './components/EvolutionPath';

import { DigimonDataProvider } from './contexts/DigimonDataProvider';

export default function App() {
  const { t } = useTranslation();

  return (
    <DigimonDataProvider>
      <div className="flex min-h-screen flex-col dark:bg-gray-900">
        <Navbar />
        <div className="flex flex-grow justify-center">
          <div className="w-[100vw] text-center md:w-[80vw]">
            <EvolutionPath />
            {/* <h1 className="text-2xl font-bold dark:text-white">{t('temp1')}</h1>
            <p className="dark:text-white">{t('temp2')}</p> */}
          </div>
        </div>
      </div>
    </DigimonDataProvider>
  );
}
