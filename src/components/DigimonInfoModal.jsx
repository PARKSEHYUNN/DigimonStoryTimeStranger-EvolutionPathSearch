// src/components/DigimonInfoModal.jsx

// 모듈 선언
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircle,
  faDotCircle,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useDigimons } from '../hooks/useDigimons';
import DigimonItem from './DigimonItem';

export default function DigimonInfoModal({ isOpen, onClose, digimon }) {
  const { digimons, loading } = useDigimons();
  const { i18n, t } = useTranslation();

  const [showDigimon, setShowDigimon] = useState(null);
  const [isSilhouette, setIsSilhouette] = useState(false);

  useEffect(() => {
    if (isOpen) setShowDigimon(digimon);
  }, [isOpen, digimon]);

  const digimonToDisplay = showDigimon || digimon;

  if (!isOpen || !digimonToDisplay) return null;

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
        className="relative flex h-[80vh] w-full max-w-2xl flex-col p-4"
        onClick={handleContentClick}
      >
        {/* 모달 컨텐츠 */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-scroll rounded-lg bg-white shadow-sm dark:bg-gray-700">
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
          <div className="flex flex-col p-4 md:p-5">
            <div className="mb-4 flex w-full border-b border-gray-200 pb-4 dark:border-gray-600">
              <div className="w-2/5 pr-4">
                <img
                  src={`/digimon_icons/${digimonToDisplay.id}.png`}
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
                      digimonToDisplay.name[
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
                    {t(`generation.${digimonToDisplay.generation}`)}
                  </span>
                </div>

                {/* 디지몬 속성 */}
                <div className="mb-2 flex flex-col">
                  <span className="ms-7 text-start text-xs text-gray-900 dark:text-white">
                    속성
                  </span>
                  <span className="text-md ms-9 text-start text-gray-900 dark:text-white">
                    {t(`attribute.${digimonToDisplay.attribute}`)}
                  </span>
                </div>

                {/* 디지몬 기본 성격 */}
                <div className="mb-2 flex flex-col">
                  <span className="ms-7 text-start text-xs text-gray-900 dark:text-white">
                    기본 성격
                  </span>
                  <span className="text-md ms-9 text-start text-gray-900 dark:text-white">
                    {t(`personality.${digimonToDisplay.personality}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* 진화 전 디지몬 */}
            <div className="mb-4 flex w-full flex-col rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              {/* 실루엣 토글 */}
              <div className="mb-4 flex w-full justify-end pe-3">
                <label className="mb-2 inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    value=""
                    className="peer sr-only"
                    checked={isSilhouette}
                    onChange={() => setIsSilhouette(!isSilhouette)}
                  />
                  <div className="peer dark:peer-checked:bg-white-200 relative h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-gray-600 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-900"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    실루엣 보기
                  </span>
                </label>
              </div>
              <span className="text-md mb-2 text-start text-gray-900 dark:text-white">
                진화 전 디지몬
              </span>
              <div className="flex w-full gap-3 overflow-x-scroll rounded-lg bg-gray-100 ps-3 pe-3 pt-3 dark:bg-gray-900">
                {digimonToDisplay.evolution.from.length === 0 ? (
                  <span className="pb-3 text-gray-900 dark:text-white">
                    진화 전 디지몬이 없습니다.
                  </span>
                ) : (
                  digimonToDisplay.evolution.from.map((fromDigimonId) => {
                    const fromDigimonObject = digimons.get(fromDigimonId);
                    if (!fromDigimonObject) return null;

                    return (
                      <DigimonItem
                        key={fromDigimonId}
                        digimon={fromDigimonObject}
                        type="showInfo"
                        options={{
                          onClick: () => setShowDigimon(fromDigimonObject),
                          showToolTip: () => {},
                        }}
                        isSilhouette={isSilhouette}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* 진화 후 디지몬 */}
            <div className="mb-2 flex w-full flex-col rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <span className="text-md mb-2 text-start text-gray-900 dark:text-white">
                진화 후 디지몬
              </span>
              <div className="flex w-full gap-3 overflow-x-scroll rounded-lg bg-gray-100 p-3 dark:bg-gray-900">
                {digimonToDisplay.evolution_requirements.length === 0 ? (
                  <span className="pb-3 text-gray-900 dark:text-white">
                    진화 후 디지몬이 없습니다.
                  </span>
                ) : (
                  <div className="grid w-full grid-cols-2 overflow-x-hidden">
                    {digimonToDisplay.evolution_requirements.map(
                      (toDigimon) => {
                        const toDigimonObject = digimons.get(toDigimon.id);
                        if (!toDigimonObject) return null;

                        return (
                          <div
                            className="flex w-full cursor-pointer flex-row overflow-x-hidden"
                            onClick={() => setShowDigimon(toDigimonObject)}
                          >
                            <DigimonItem
                              key={toDigimon.id}
                              digimon={toDigimonObject}
                              type="showInfoEvolution"
                              options={{}}
                              isSilhouette={isSilhouette}
                              className="w-2/5"
                            />
                            <div className="ms-2 flex w-3/5 flex-col text-start">
                              <span className="text-gray-900 dark:text-white">
                                • 에이전트 레벨 {toDigimon.conditions.rank} 이상
                              </span>
                              {Object.keys(toDigimon.conditions)
                                .filter(
                                  (key) =>
                                    key !== 'rank' &&
                                    key !== 'isJogress' &&
                                    key !== 'item' &&
                                    key !== 'jogress',
                                )
                                .map((key) => {
                                  const value = toDigimon.conditions[key];

                                  switch (key) {
                                    case 'HP':
                                    case 'MP':
                                    case 'ATK':
                                    case 'DEF':
                                    case 'INT':
                                    case 'RES':
                                    case 'SPD':
                                      return (
                                        <span className="text-gray-900 dark:text-white">
                                          • {key} {value} 이상
                                        </span>
                                      );
                                  }
                                })}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
