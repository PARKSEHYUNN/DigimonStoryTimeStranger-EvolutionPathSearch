// src/components/EvolutionPath.jsx

// 모듈 선언
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBan,
  faSpinner,
  faTimes,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import DigimonSelectBox from './DigimonSelectBox';
import DigimonInfoModal from './DigimonInfoModal';

// exceptionDigimon
const DigimonItem = ({ digimon, exceptions, isSilhouette, onInfoClick }) => {
  const { i18n, t } = useTranslation();
  const { exceptionAdd, exceptionRemove, exceptionType } = exceptions;
  const isExceptionAdd = exceptionType === 'exceptionAdd';
  const silhouetteIconOption = isSilhouette ? 'brightness-0' : '';
  const exceptionIconOption = isExceptionAdd
    ? 'z-10 h-5 w-5'
    : 'hidden h-full w-full bg-black opacity-70 group-hover:flex';
  const exceptionIcon = isExceptionAdd ? faBan : faXmark;
  const exceptionIconSize = isExceptionAdd ? 'xs' : '2xl';

  const exceptionIconClick = (e) => {
    e.stopPropagation();
    if (isExceptionAdd) exceptionAdd(digimon);
    else exceptionRemove(digimon);
  };

  const infoClick = (e) => {
    e.stopPropagation();
    if (isExceptionAdd) onInfoClick(digimon);
  };

  if (!digimon) return null;

  return (
    <div
      className="group flex h-24 flex-col items-center hover:cursor-pointer md:h-32"
      onClick={infoClick}
    >
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white md:h-20 md:w-20 dark:bg-gray-800">
        <img
          src={`/digimon_icons/${digimon.id}.png`}
          className={`h-full w-full transition-all ${silhouetteIconOption}`}
        />
        <div
          className={`absolute top-0 right-0 items-center justify-center text-white ${exceptionIconOption}`}
          onClick={exceptionIconClick}
        >
          <FontAwesomeIcon icon={exceptionIcon} size={exceptionIconSize} />
        </div>
      </div>
      <span className="mt-1 text-sm text-gray-900 dark:text-white">
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
      <span className="text-xs text-gray-900 dark:text-white">
        {`${t(`generation.${digimon.generation}`)} / ${t(`attribute.${digimon.attribute}`)}`}
      </span>
    </div>
  );
};

const EvolutionArrow = ({ evolution }) => {
  return (
    <div className="flex h-14 flex-col md:h-18">
      <FontAwesomeIcon
        icon={faArrowRight}
        size="lg"
        className="ms-1 me-1 text-gray-900 md:ms-8 md:me-8 dark:text-white"
      />
      <span
        className={`mt-1 text-xs font-medium ${evolution ? 'text-green-500' : 'text-red-500'}`}
      >
        {evolution ? '진화' : '퇴화'}
      </span>
    </div>
  );
};

export default function EvolutionPath() {
  const { i18n, t } = useTranslation();

  const workerRef = useRef(null);

  const [nowDigimon, setNowDigimon] = useState(null);
  const [evolutionFromDigimon, setEvolutionFromDigimon] = useState(null);

  const [agentLevel, setAgentLevel] = useState(10);
  const [jogressOption, setJogressOption] = useState('include');
  const [exceptionDigimons, setExceptionDigimon] = useState([]);

  const [isSilhouette, setIsSilhouette] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDigimon, setSelectedDigimon] = useState(null);

  const [isGraphReady, setIsGraphReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paths, setPaths] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../worker/pathfinding.worker.js', import.meta.url),
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      switch (type) {
        case 'INIT_COMPLETE':
          setIsGraphReady(true);
          console.log('Web Worker: Graph initialized.');
          break;

        case 'PATHS_FOUND':
          setPaths(payload);
          setIsLoading(false);
          console.log(payload);
          break;

        case 'ERROR':
          console.error('Web Worker Error Payload: ', payload);
          setError(payload);
          setIsLoading(false);
          setIsGraphReady(false);
          break;

        default:
          break;
      }
    };

    workerRef.current.onerror = (err) => {
      console.error('Web Worker Error: ', err);
      setError('An error occurred in the pathfinding worker.');
    };

    Promise.all([
      fetch('/digimon_list.json').then((res) => res.json()),
      fetch('/jogress_list.json').then((res) => res.json()),
      fetch('/agent_level_list.json').then((res) => res.json()),
    ])
      .then(([digimonList, jogressList, agentLevelData]) => {
        workerRef.current.postMessage({
          type: 'INIT',
          payload: {
            digimonList,
            jogressList,
            agentLevelData,
          },
        });
      })
      .catch((err) => {
        console.error('Failed to load initial data: ', err);
        setError(
          "Failed to load 'digimon_list.json', 'jogress_list.json', or 'agent_level_list.json'. Check the /public folder.",
        );
      });

    return () => {
      workerRef.current.terminate();
      console.log('Web Worker: Terminated.');
    };
  }, []);

  useEffect(() => {
    if (!isGraphReady || !nowDigimon || !evolutionFromDigimon) {
      return;
    }

    console.log(
      `[Automatic Request] ${nowDigimon.id} -> ${evolutionFromDigimon.id} 경로 탐색`,
    );
    setIsLoading(true);
    setError(null);
    setPaths([]);

    workerRef.current.postMessage({
      type: 'FIND_PATHS',
      payload: {
        startId: nowDigimon.id,
        endId: evolutionFromDigimon.id,
        k: 1,
        exceptions: exceptionDigimons.map((d) => d.id),
        agentLevel: agentLevel,
        jogressOption: jogressOption,
      },
    });
  }, [
    nowDigimon,
    evolutionFromDigimon,
    isGraphReady,
    exceptionDigimons,
    agentLevel,
    jogressOption,
  ]);

  const handleAddExcpetion = (digimonToAdd) => {
    setExceptionDigimon((prevExceptions) => {
      if (prevExceptions.find((d) => d.id === digimonToAdd.id)) {
        return prevExceptions;
      }
      return [...prevExceptions, digimonToAdd];
    });
  };

  const handleRemoveException = (digimonToRemove) => {
    setExceptionDigimon((prevExceptions) => {
      return prevExceptions.filter((d) => d.id !== digimonToRemove.id);
    });
  };

  const renderEvoutionPaths = () => {
    if (isLoading) {
      return (
        <FontAwesomeIcon
          icon={faSpinner}
          size="2xl"
          spin
          className="text-gray-900 dark:text-white"
        />
      );
    }

    if (error) {
      return <span className="text-red-500">Error: {error}</span>;
    }

    if (paths.length === 0) {
      if (!nowDigimon || !evolutionFromDigimon) {
        return (
          <span className="text-gray-900 dark:text-white">
            디지몬을 선택 해주세요.
          </span>
        );
      }

      return (
        <span className="text-gray-900 dark:text-white">
          해당 진화 트리를 찾을 수 없습니다. (제외된 디지몬이 경로에 포함
          되어있을 수 있습니다.)
        </span>
      );
    }

    return paths.map((result, pathIndex) => (
      <div
        key={pathIndex}
        className="mb-4 flex w-full flex-col items-center justify-center rounded-lg bg-gray-100 p-3 pt-3 dark:bg-gray-700"
      >
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
            <div className="peer dark:peer-checked:bg-white-400 relative h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-gray-600 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-800"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              실루엣 보기
            </span>
          </label>
        </div>

        {/* 진화 트리 */}
        <div className="flex w-full flex-row flex-wrap items-center justify-center">
          {result.path.map((digimon, index) => (
            <React.Fragment key={digimon.id}>
              <DigimonItem
                digimon={digimon}
                exceptions={{
                  exceptionAdd: handleAddExcpetion,
                  exceptionRemove: handleRemoveException,
                  exceptionType: 'exceptionAdd',
                }}
                isSilhouette={isSilhouette}
                onInfoClick={handleShowInfo}
              />
              {index < result.path.length - 1 && (
                <EvolutionArrow
                  evolution={
                    result.path[index + 1].generation >= digimon.generation
                  }
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    ));
  };

  const resetExceptions = () => {
    setExceptionDigimon([]);
  };

  const handleShowInfo = (digimon) => {
    setSelectedDigimon(digimon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDigimon(null);
  };

  return (
    <div className="mt-3 flex w-full flex-col items-center justify-center rounded-lg bg-gray-200 p-5 dark:bg-gray-800">
      <h1 className="mb-3 text-2xl font-bold dark:text-white">
        Evolution Path
      </h1>

      <div className="mb-3 flex w-[90%] flex-row items-center justify-around md:w-[40%]">
        {/* 에이전트 레벨 */}
        <div className="flex w-full flex-row">
          <form className="mx-auto w-[50%] max-w-sm">
            <label
              htmlFor="agentLevelSelect"
              className="mb-2 block text-start text-sm font-medium text-gray-900 dark:text-white"
            >
              에이전트 레벨
            </label>
            <select
              id="agentLevelSelect"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              value={agentLevel}
              onChange={(e) => setAgentLevel(parseInt(e.target.value, 10))}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </form>
        </div>

        {/* 조그레스 포함 */}
        <div className="flex w-full flex-row">
          <form className="mx-auto w-[50%] max-w-sm">
            <label
              htmlFor="jogressOption"
              className="mb-2 block text-start text-sm font-medium text-gray-900 dark:text-white"
            >
              조그레스
            </label>
            <select
              id="jogressOption"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              value={jogressOption}
              onChange={(e) => setJogressOption(e.target.value)}
            >
              <option value="include">포함</option>
              <option value="not-include">비포함</option>
            </select>
          </form>
        </div>
      </div>

      <div className="flex w-[90%] flex-row items-center justify-around md:w-[40%]">
        {/* 현재 디지몬 선택 */}
        <div className="flex flex-col items-center justify-center">
          <span className="mb-1 text-gray-900 dark:text-white">
            {t('evolution_path.now_digimon')}
          </span>
          <DigimonSelectBox
            onSelectDigimon={(digimon) => {
              setNowDigimon(digimon);
            }}
          />
        </div>

        <FontAwesomeIcon
          icon={faArrowRight}
          size="xl"
          className="text-gray-900 dark:text-white"
        />

        {/* 만들 디지몬 선택 */}
        <div className="flex flex-col items-center justify-center">
          <span className="mb-1 text-gray-900 dark:text-white">
            {t('evolution_path.evolution_from_digimon')}
          </span>
          <DigimonSelectBox
            onSelectDigimon={(digimon) => {
              setEvolutionFromDigimon(digimon);
            }}
          />
        </div>
      </div>
      <div className="mt-5 flex w-[90%] flex-row flex-wrap items-center justify-center border-t border-b border-gray-300 pt-3 pb-3 md:w-[95%] dark:border-gray-600">
        {/* 진화 루트 */}
        {renderEvoutionPaths()}
      </div>

      {/* 검색 금지 목록 */}
      <div className="mt-5 flex w-[90%] flex-row flex-wrap items-center justify-center rounded-lg bg-gray-50 pt-3 md:w-[95%] dark:bg-gray-900">
        <div className="flex w-full items-center justify-center">
          <h3 className="mb-1 text-gray-900 dark:text-white">
            제외된 디지몬 목록
          </h3>
          <button
            type="button"
            className="mb-1 ml-2 inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-red-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-600"
            onClick={() => resetExceptions()}
          >
            {/* <FontAwesomeIcon icon={faTrash} /> */}
            초기화
          </button>
        </div>
        <div className="flex w-full flex-row flex-wrap justify-center gap-4 pb-3">
          {exceptionDigimons.length === 0 ? (
            <span className="text-gray-900 dark:text-white">
              현재 제외한 디지몬이 없습니다. (경로 상 디지몬을 클릭해
              추가하세요.)
            </span>
          ) : (
            exceptionDigimons.map((digimon) => (
              // <div
              //   key={digimon.id}
              //   className="relative flex cursor-pointer flex-col items-center rounded-lg bg-gray-200 p-2 shadow transition-all hover:shadow-lg dark:bg-gray-700"
              //   onClick={() => handleRemoveException(digimon)}
              // >
              //   <div className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-70 group-hover:opacity-100">
              //     <FontAwesomeIcon icon={faTimes} size="xs" />
              //   </div>
              //   <img
              //     src={`/digimon_icons/${digimon.id}.png`}
              //     className="h-10 w-10"
              //   />
              //   <span className="mt-1 max-w-[60px] truncate text-xs text-gray-900 dark:text-white">
              //     {
              //       digimon.name[
              //         i18n.language === 'en'
              //           ? 0
              //           : i18n.language === 'ko'
              //             ? 1
              //             : i18n.language === 'ja'
              //               ? 2
              //               : 0
              //       ]
              //     }
              //   </span>
              // </div>
              <DigimonItem
                digimon={digimon}
                exceptions={{
                  exceptionAdd: handleAddExcpetion,
                  exceptionRemove: handleRemoveException,
                  exceptionType: 'exceptionRemove',
                }}
                isSilhouette={isSilhouette}
              />
            ))
          )}
        </div>
      </div>
      <DigimonInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        digimon={selectedDigimon}
      />
    </div>
  );
}
