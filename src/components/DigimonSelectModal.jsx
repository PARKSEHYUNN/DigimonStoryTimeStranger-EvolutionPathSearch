// src/components/DigimonSelectModal.jsx

// 모듈 선언
import React, { useState, useEffect, useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
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
      className="flex h-36 flex-col items-center hover:cursor-pointer"
      onClick={() => {
        if (onSelect) onSelect(digimon);
      }}
    >
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-white hover:cursor-pointer hover:blur-[1px] dark:bg-gray-800">
        {/* <FontAwesomeIcon icon={faQuestion} size="xl" /> */}
        <img
          src={`/digimon_icons/${digimon.id}.png`}
          className="h-full w-full"
        />
      </div>
      <span className="mt-1 text-sm text-gray-900 dark:text-white">
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

  const handleCheckboxChange = (filterType, value, isChecked) => {
    setFilters((prevFilters) => {
      const currentValues = prevFilters[filterType];

      let newValues;
      if (isChecked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((v) => v !== value);
      }

      return {
        ...prevFilters,
        [filterType]: newValues,
      };
    });
  };

  const resetModal = () => {
    setSearchTrim('');
    setFilters({ generation: [], attribute: [], personality: [] });
  };

  const filteredItems = useMemo(() => {
    const { generation, attribute, personality } = filters;
    const lowerSearchTrim = searchTrim.toLowerCase();

    return digimons
      .filter((item) => {
        if (!searchTrim) return true;

        return item.name.some((langName) =>
          langName.toLowerCase().includes(lowerSearchTrim),
        );
      })
      .filter((item) => {
        return generation.length === 0
          ? true
          : generation.includes(item.generation);
      })
      .filter((item) => {
        return attribute.length === 0
          ? true
          : attribute.includes(item.attribute);
      })
      .filter((item) => {
        return personality.length === 0
          ? true
          : personality.includes(item.personality);
      });
  }, [searchTrim, digimons, filters]);

  if (!isModalOpen) return null;

  return (
    <div
      id="select-modal"
      tabIndex={-1}
      aria-hidden="true"
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
              Choice Digimon
            </h3>
            <button
              type="button"
              className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              data-toggle-modal="select-modal"
              onClick={() => onClose()}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          {/* 모달 바디 */}
          <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5">
            <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
              {/* 디지몬 검색 입력 */}
              <div className="flex">
                <input
                  type="text"
                  id="digimon-search-input"
                  className="block w-full flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Digimon's Name"
                  value={searchTrim}
                  onChange={(e) => setSearchTrim(e.target.value)}
                />
                {/* 필터 토글 버튼 */}
                <button
                  type="button"
                  className="ml-2 inline-flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-600"
                  onClick={() => setFilterVisible(!filterVisible)}
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
                {/* 초기화 버튼 */}
                <button
                  type="button"
                  className="ml-2 inline-flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-red-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-600"
                  onClick={() => resetModal()}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>

              {/* 필터 */}
              <div
                className={`border-gray-150 mt-4 max-h-48 w-full overflow-y-auto rounded-lg bg-gray-100 p-4 dark:border-gray-900 dark:bg-gray-800 ${filterVisible ? '' : 'hidden'}`}
              >
                <h4 className="mb-2 font-semibold dark:text-white">
                  필터 옵션
                </h4>

                <div className="flex flex-row justify-around">
                  {/* 세대 필터 */}
                  <div className="mb-3">
                    <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                      세대
                    </label>
                    <div className="flex flex-col flex-wrap gap-x-4 gap-y-1">
                      {generationFilterOption.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            id={`gen-${option}`}
                            type="checkbox"
                            value={option}
                            checked={filters.generation.includes(option)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                'generation',
                                option,
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 bg-gray-100 ring-0 checked:border-transparent checked:bg-blue-600 checked:ring-0 focus:ring-0"
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                      속성
                    </label>
                    <div className="flex flex-col flex-wrap gap-x-4 gap-y-1">
                      {attributeFilterOption.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            id={`attr-${option}`}
                            type="checkbox"
                            value={option}
                            checked={filters.attribute.includes(option)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                'attribute',
                                option,
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 bg-gray-100 ring-0 checked:border-transparent checked:bg-blue-600 checked:ring-0 focus:ring-0"
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                      기본 성격
                    </label>
                    <div className="flex flex-col flex-wrap gap-x-4 gap-y-1">
                      {personalityFilterOption.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            id={`perso-${option}`}
                            type="checkbox"
                            value={option}
                            checked={filters.personality.includes(option)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                'personality',
                                option,
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 bg-gray-100 ring-0 checked:border-transparent checked:bg-blue-600 checked:ring-0 focus:ring-0"
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
            <div className="min-h-0 flex-1 overflow-y-auto">
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
