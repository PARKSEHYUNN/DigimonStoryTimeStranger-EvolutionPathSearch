// src/components/DigimonItem.jsx

// 모듈 선언
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faCircleQuestion,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

export default function DigimonItem({ digimon, type, options, isSilhouette }) {
  const { i18n, t } = useTranslation();
  const isException = type === 'exceptionAdd' || type === 'exceptionRemove';

  const silhouetteIconOption = isSilhouette ? 'brightness-0' : '';
  const exceptionIconOption =
    type === 'exceptionAdd'
      ? 'z-10 h-5 w-5'
      : type === 'exceptionRemove'
        ? 'hidden h-full w-full bg-black opacity-70 group-hover:flex'
        : 'hidden';

  const exceptionIcon =
    type === 'exceptionAdd'
      ? faBan
      : type === 'exceptionRemove'
        ? faXmark
        : null;
  const exceptionIconSize =
    type === 'exceptionAdd' ? 'xs' : type === 'exceptionRemove' ? '2xl' : null;

  const exceptionIconClick = (e) => {
    e.stopPropagation();

    if (isException) {
      if (type === 'exceptionAdd') options.exceptionAdd(digimon);
      else if (type === 'exceptionRemove') options.exceptionRemove(digimon);
    }
  };

  const infoClick = (e) => {
    if (type !== 'showInfoEvolution') e.stopPropagation();

    if (
      (type === 'showInfo' || type === 'showInfoEvolution') &&
      options.onClick
    )
      options.onClick(digimon);
    if (type === 'onSelect' && options.onSelect) options.onSelect(digimon);
    if (isException && type === 'exceptionAdd') options.onInfoClick(digimon);
  };

  const lang = i18n.language;
  const digimonName =
    digimon.name[lang === 'en' ? 0 : lang === 'ko' ? 1 : lang === 'ja' ? 2 : 0];

  if (!digimon) return null;

  return (
    <div
      className={`group flex h-24 flex-col items-${type === 'showInfoEvolution' ? 'center' : 'center'} hover:cursor-pointer md:h-32`}
      onClick={infoClick}
    >
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white md:h-20 md:w-20 dark:bg-gray-500">
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
      <span className="mt-1 w-25 text-sm text-gray-900 dark:text-white">
        {digimonName}
      </span>
      <span className="w-25 text-xs text-gray-900 dark:text-white">
        {`${t(`generation.${digimon.generation}`)} / ${t(`attribute.${digimon.attribute}`)}`}
      </span>
    </div>
  );
}
