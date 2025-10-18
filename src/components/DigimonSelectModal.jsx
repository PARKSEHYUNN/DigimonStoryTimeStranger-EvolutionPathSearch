// src/components/DigimonSelectModal.jsx

// 모듈 선언
import React, { useState, useEffect, useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useDigimons } from '../hooks/useDigimons';

const DigimonItem = ({ digimon, onSelect }) => {
  const { i18n, t } = useTranslation();

  const nameLanguage =
    i18n.language === 'en'
      ? 0
      : i18n.language === 'ko'
        ? 1
        : i18n.language === 'ja'
          ? 2
          : 0;

  return (
    <div
      className="flex flex-col items-center h-36 hover:cursor-pointer"
      onClick={() => {
        if (onSelect) onSelect(digimon);
      }}
    >
      <div className="flex justify-center items-center w-20 h-20 overflow-hidden bg-white dark:bg-gray-800 rounded-lg hover:blur-[1px] hover:cursor-pointer">
        {/* <FontAwesomeIcon icon={faQuestion} size="xl" /> */}
        <img
          src={`/digimon_icons/${digimon.id}.png`}
          className="w-full h-full"
        />
      </div>
      <span className="text-sm text-gray-900 dark:text-white mt-1">
        {digimon.name[nameLanguage]}
      </span>
      <span className="text-xs text-gray-900 dark:text-white">
        {`${t(`generation.${digimon.generation}`)} / ${t(`attribute.${digimon.attribute}`)}`}
      </span>
    </div>
  );
};

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

  const { digimons, loading } = useDigimons();
  const [searchTrim, setSearchTrim] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    generation: [],
    attribute: [],
    personality: [],
  });

  const filteredItems = useMemo(() => {
    if (!searchTrim) return digimons;

    const lowerSearchTrim = searchTrim.toLowerCase();

    return digimons.filter((item) =>
      item.name.some((langName) =>
        langName.toLowerCase().includes(lowerSearchTrim),
      ),
    );
  }, [searchTrim, digimons]);

  if (!isModalOpen) return null;

  return (
    <div
      id="select-modal"
      tabIndex={-1}
      aria-hidden="true"
      className={`flex ${isModalOpen ? '' : 'hidden'} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full backdrop-blur-[4px]`}
      onClick={onClose}
    >
      <div
        className="relative p-4 w-full max-w-3xl h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 컨텐츠 */}
        <div className="relative bg-white rounded-lg showdow-sm dark:bg-gray-700 flex flex-col flex-1 min-h-0">
          {/* 모달 헤더 */}
          <div className="flex items-center justfly-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Choice Digimon
            </h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-toggle-modal="select-modal"
              onClick={() => onClose()}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          {/* 모달 바디 */}
          <div className="p-4 md:p-5 flex flex-col flex-1 min-h-0">
            <div className="border-b dark:border-gray-600 border-gray-200 pb-4 mb-4">
              {/* 디지몬 검색 입력 */}
              <div className="flex">
                <input
                  type="text"
                  id="digimon-search-input"
                  className="rounded-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Digimon's Name"
                  value={searchTrim}
                  onChange={(e) => setSearchTrim(e.target.value)}
                />
                {/* 필터 토글 버튼 */}
                <button
                  type="button"
                  className="inline-flex items-center px-3 ml-2 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 border rounded-lg border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
              </div>

              {/* 필터 */}
              <div className="w-full mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-gray-150 dark:border-gray-900 max-h-48 overflow-y-auto">
                <h4 className="font-semibold mb-2 dark:text-white">
                  필터 옵션
                </h4>

                <div className="flex flex-row justify-around">
                  {/* 세대 필터 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      세대
                    </label>
                    <div className="flex flex-wrap flex-col gap-x-4 gap-y-1">
                      {generationFilterOption.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            id={`gen-${option}`}
                            type="checkbox"
                            value={option}
                            checked="false"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`gen-${option}`}
                            className="ms-2 text-sm text-gray-900 dark:text-gray-300"
                          >
                            {t(`generation.${option}`)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 속성 필터 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      속성
                    </label>
                    <div className="flex flex-wrap flex-col gap-x-4 gap-y-1">
                      {attributeFilterOption.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            id={`attr-${option}`}
                            type="checkbox"
                            value={option}
                            checked="false"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`attr-${option}`}
                            className="ms-2 text-sm text-gray-900 dark:text-gray-300"
                          >
                            {t(`attribute.${option}`)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 기본 성격 필터 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                      기본 성격
                    </label>
                    <div className="flex flex-wrap flex-col gap-x-4 gap-y-1">
                      {personalityFilterOption.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            id={`perso-${option}`}
                            type="checkbox"
                            value={option}
                            checked="false"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`perso-${option}`}
                            className="ms-2 text-sm text-gray-900 dark:text-gray-300"
                          >
                            {t(`personality.${option}`)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 디지몬 목록 */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : (
                <VirtuosoGrid
                  data={filteredItems}
                  listClassName="grid grid-cols-3 md:grid-cols-5 gap-4"
                  itemContent={(index, digimon) => {
                    return (
                      <DigimonItem
                        digimon={digimon}
                        onSelect={onSelectDigimon}
                      />
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
