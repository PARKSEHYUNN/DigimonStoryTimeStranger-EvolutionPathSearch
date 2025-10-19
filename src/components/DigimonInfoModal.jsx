// src/components/DigimonInfoModal.jsx

// 모듈 선언
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export default function DigimonInfoModal({ isOpen, onClose, digimon }) {
  const { i18n, t } = useTranslation();

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed top-0 right-0 left-0 z-50 flex h-[calc(100%-1rem)] max-h-full items-center justify-center overflow-x-hidden overflow-y-auto backdrop-blur-[4px] md:inset-0"
      onClick={handleBackdropClick}
    >
      <div
        className="relative flex h-[80vh] w-full max-w-lg flex-col p-4"
        onClick={handleContentClick}
      >
        {/* 모달 컨텐츠 */}
        <div className="relative flex min-h-0 flex-1 flex-col rounded-lg bg-white shadow-sm dark:bg-gray-700">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 md:p-5 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              디지몬 정보
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
            <div className="mb-4 flex w-full border-b border-gray-200 pb-4 dark:border-gray-600">
              <div className="w-2/5 pr-4">
                <img
                  src={`/digimon_icons/${digimon.id}.png`}
                  className="rounded-lg bg-white md:h-40 md:w-40 dark:bg-gray-800"
                />
              </div>

              <div className="w-3/5">
                {/* 디지몬 이름 */}
                <div className="mb-2 flex flex-col">
                  <span className="ms-7 text-start text-xs text-gray-900 dark:text-white">
                    이름
                  </span>
                  <span className="text-md ms-9 text-start text-gray-900 dark:text-white">
                    {
                      digimon.name[
                        i18n.language === 'en'
                          ? 0
                          : i18n.language === 'ko'
                            ? 1
                            : i18n.language === 'ja'
                              ? 2
                              : 0
                      ]
                    }
                  </span>
                </div>

                {/* 디지몬 등급 */}
                <div className="mb-2 flex flex-col">
                  <span className="ms-7 text-start text-xs text-gray-900 dark:text-white">
                    등급
                  </span>
                  <span className="text-md ms-9 text-start text-gray-900 dark:text-white">
                    {t(`generation.${digimon.generation}`)}
                  </span>
                </div>

                {/* 디지몬 속성 */}
                <div className="mb-2 flex flex-col">
                  <span className="ms-7 text-start text-xs text-gray-900 dark:text-white">
                    속성
                  </span>
                  <span className="text-md ms-9 text-start text-gray-900 dark:text-white">
                    {t(`attribute.${digimon.attribute}`)}
                  </span>
                </div>

                {/* 디지몬 기본 성격 */}
                <div className="mb-2 flex flex-col">
                  <span className="ms-7 text-start text-xs text-gray-900 dark:text-white">
                    기본 성격
                  </span>
                  <span className="text-md ms-9 text-start text-gray-900 dark:text-white">
                    {t(`personality.${digimon.personality}`)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mb-4 flex w-full rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <span className="text-md text-gray-900 dark:text-white">
                진화 전 디지몬
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
