// src/components/DigimonSelectBox.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons/faQuestion';
import DigimonSelectModal from './DigimonSelectModal';

export default function DigimonSelectBox({ onSelectDigimon }) {
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDigimon, setSelectedDigimon] = useState(null);

  const { i18n, t } = useTranslation();

  return (
    <>
      <div className="flex flex-col items-center">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-gray-50 hover:cursor-pointer hover:blur-[1px] dark:bg-gray-900"
          onClick={() => setIsModalOpen(true)}
        >
          {!selectedDigimon ? (
            <FontAwesomeIcon
              icon={faQuestion}
              size="xl"
              className="text-gray-900 dark:text-white"
            />
          ) : (
            <img
              src={`/digimon_icons/${selectedDigimon.id}.png`}
              className="h-full w-full"
            />
          )}
        </div>
        <span className="mt-1 text-gray-900 dark:text-white">
          {!selectedDigimon
            ? t('evolution_path.choice_digimon')
            : selectedDigimon.name[
                i18n.language === 'en'
                  ? 0
                  : i18n.language === 'ko'
                    ? 1
                    : i18n.language === 'ja'
                      ? 2
                      : 0
              ]}
        </span>
        <span className="text-sm text-gray-900 dark:text-white">
          {!selectedDigimon
            ? ''
            : `${t(`generation.${selectedDigimon.generation}`)} / ${t(`attribute.${selectedDigimon.attribute}`)}`}
        </span>
      </div>

      <DigimonSelectModal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectDigimon={(digimon) => {
          setSelectedDigimon(digimon);
          onSelectDigimon(digimon);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
