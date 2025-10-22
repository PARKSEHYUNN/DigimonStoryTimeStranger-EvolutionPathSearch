// src/components/DigimonList.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DigimonSearch from './DigimonSearch';
import DigimonInfoModal from './DigimonInfoModal';

export default function DigimonList() {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDigimon, setSelectedDigimon] = useState(null);

  const handleShowInfo = (digimon) => {
    setSelectedDigimon(digimon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDigimon(null);
  };

  return (
    <div className="mt-3 flex h-[calc(100vh-120px)] w-full flex-col items-center justify-center rounded-lg bg-gray-200 p-5 dark:bg-gray-800">
      <h1 className="mb-3 shrink-0 text-2xl font-bold dark:text-white">
        {t('digimon_list.title')}
      </h1>

      <DigimonSearch onSelectDigimon={handleShowInfo} isList={true} />

      <DigimonInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        digimon={selectedDigimon}
      />
    </div>
  );
}
