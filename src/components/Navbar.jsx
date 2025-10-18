// src/components/Navbar.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageDropdown from './LanguageDropdown';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
  // 모바일 메뉴 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <nav className="border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
        {/* 타이틀 */}
        <a href="/" className="flex items-center space-x-2">
          <FontAwesomeIcon
            icon={faGear}
            size="xl"
            className="dark:text-white"
          />
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
            Evolution Path
          </span>
        </a>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          data-collapse-toggle="navbar-solid-bg"
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-solid-bg"
          aria-expanded="false"
        >
          {isMenuOpen ? (
            <FontAwesomeIcon
              icon={faXmark}
              size="lg"
              className="dark:text-white"
            />
          ) : (
            <FontAwesomeIcon
              icon={faBars}
              size="lg"
              className="dark:text-white"
            />
          )}
        </button>

        {/* 네비바 메뉴 */}
        <div
          className={`w-full md:block md:w-auto ${isMenuOpen ? '' : 'hidden'}`}
          id="navbar-solid-bg"
        >
          <ul className="mt-4 flex flex-col rounded-lg bg-gray-50 font-medium md:mt-0 md:flex-row md:items-center md:space-x-4 md:border-0 md:bg-transparent dark:border-gray-700 dark:bg-gray-800 md:dark:bg-transparent">
            <li>
              <a
                href="#"
                className="block rounded-sm bg-gray-700 px-3 py-2 text-white md:bg-transparent md:p-0 md:text-gray-500 dark:bg-gray-600 md:dark:bg-transparent md:dark:text-gray-400"
                aria-current="page"
              >
                {t('nav.evolution_path')}
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-gray-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-gray-400"
              >
                {t('nav.digimon_list')}
              </a>
            </li>
            {/* 언어 변경 드롭 다운 */}
            <li>
              <LanguageDropdown />
            </li>
            {/* 테마 변경 토글 버튼 */}
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
