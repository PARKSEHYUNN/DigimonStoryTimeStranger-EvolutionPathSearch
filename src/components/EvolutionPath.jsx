// src/components/EvolutionPath.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DigimonSelectBox from './DigimonSelectBox';

export default function EvolutionPath() {
  const { i18n, t } = useTranslation();

  return (
    <div className="w-full flex flex-col justify-center items-center rounded-lg mt-3 p-5 bg-gray-200 dark:bg-gray-600">
      <h1 className="text-2xl font-bold dark:text-white mb-3">
        Evolution Path
      </h1>

      <div className="flex flex-row justify-between w-[90%] md:w-[40%]">
        {/* 현재 디지몬 선택 */}
        <div className="flex flex-col justify-center items-center">
          <span className="text-gray-900 dark:text-white mb-1">
            {t('evolution_path.now_digimon')}
          </span>
          <DigimonSelectBox />
        </div>

        {/* 만들 디지몬 선택 */}
        <div className="flex flex-col justify-center items-center">
          <span className="text-gray-900 dark:text-white mb-1">
            {t('evolution_path.evolution_from_digimon')}
          </span>
          <DigimonSelectBox />
        </div>
      </div>
    </div>
  );
}
