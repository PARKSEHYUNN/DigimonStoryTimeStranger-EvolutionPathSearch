// src/components/EvolutionPath.jsx

// 모듈 선언
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import DigimonSelectBox from './DigimonSelectBox';

const DigimonItem = ({ digimon }) => {
  const { i18n, t } = useTranslation();

  if (!digimon) return null;

  return (
    <div className="flex h-24 flex-col items-center md:h-32" onClick={() => {}}>
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white md:h-20 md:w-20 dark:bg-gray-800">
        {/* <FontAwesomeIcon icon={faQuestion} size="xl" /> */}
        <img
          src={`/digimon_icons/${digimon.id}.png`}
          className="h-full w-full"
        />
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

    fetch('/digimon_list.json')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        workerRef.current.postMessage({ type: 'INIT', payload: data });
      })
      .catch((err) => {
        console.error('Failed to load digimon data: ', err);
        setError(
          "Failed to load 'digimon_list.json'. Check the /public folder.",
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
      },
    });
  }, [nowDigimon, evolutionFromDigimon, isGraphReady]);

  const renderEvoutionPaths = () => {
    if (isLoading) {
      return <FontAwesomeIcon icon={faSpinner} spin />;
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
          해당 진화 트리를 찾을 수 없습니다.
        </span>
      );
    }

    return paths.map((result, pathIndex) => (
      <div
        key={pathIndex}
        className="mb-4 flex w-full flex-row flex-wrap items-center justify-center rounded-lg bg-gray-100 p-3 pt-6 dark:bg-gray-700"
      >
        {result.path.map((digimon, index) => (
          <React.Fragment key={digimon.id}>
            <DigimonItem digimon={digimon} />
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
    ));
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
              htmlFor="countries"
              className="mb-2 block text-start text-sm font-medium text-gray-900 dark:text-white"
            >
              에이전트 레벨
            </label>
            <select
              id="countries"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              value={10}
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
              htmlFor="countries"
              className="mb-2 block text-start text-sm font-medium text-gray-900 dark:text-white"
            >
              조그레스
            </label>
            <select
              id="countries"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              value={'include'}
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
      <div className="mt-5 flex w-[90%] flex-row flex-wrap items-center justify-center border-t border-gray-300 pt-3 md:w-[95%] dark:border-gray-600">
        {/* 진화 루트 */}
        {renderEvoutionPaths()}
      </div>

      {/* 검색 금지 목록 */}
    </div>
  );
}
