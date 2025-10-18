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
    <nav className="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
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
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
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
          <ul className="flex flex-col font-medium mt-4 rounded-lg bg-gray-50 md:space-x-4 md:flex-row md:items-center md:mt-0 md:border-0 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700">
            <li>
              <a
                href="#"
                className="block py-2 px-3 md:p-0 text-white bg-gray-700 rounded-sm md:bg-transparent md:text-gray-500 md:dark:text-gray-400 dark:bg-gray-600 md:dark:bg-transparent"
                aria-current="page"
              >
                {t('nav.evolution_path')}
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-2 px-3 md:p-0 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-gray-500 dark:text-white md:dark:hover:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
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
