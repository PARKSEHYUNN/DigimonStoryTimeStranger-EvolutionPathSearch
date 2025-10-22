// src/components/DigimonSelectModal.jsx

// 모듈 선언
import React, { useState, useEffect, useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useDigimons } from '../hooks/useDigimons';
import DigimonSearch from './DigimonSearch';

// 필터 옵션
const generationFilterOption = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const attributeFilterOption = [0, 1, 2, 3, 4, 5, 6];
const personalityFilterOption = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

export default function DigimonSelectModal({
  isModalOpen,
  onClose,
  onSelectDigimon,
}) {
  const { i18n, t } = useTranslation();

  if (!isModalOpen) return null;

  return (
    <div
      id="select-modal"
      tabIndex={-1}
      className={`flex ${isModalOpen ? '' : 'hidden'} fixed top-0 right-0 left-0 z-50 h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-x-hidden overflow-y-auto backdrop-blur-[4px] md:inset-0`}
      onClick={onClose}
    >
      <div
        className="relative flex h-[80vh] w-full max-w-3xl flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 컨텐츠 */}
        <div className="showdow-sm relative flex min-h-0 flex-1 flex-col rounded-lg bg-white dark:bg-gray-700">
          {/* 모달 헤더 */}
          <div className="justfly-between flex items-center rounded-t border-b border-gray-200 p-4 md:p-5 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('digimon_select_modal.title')}
            </h3>
            <button
              type="button"
              className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={() => onClose()}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          {/* 모달 바디 */}
          <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5">
            <DigimonSearch onSelectDigimon={onSelectDigimon} />
          </div>
        </div>
      </div>
    </div>
  );
}
