// src/components/LanguageDropdown.jsx

// 모듈 선언
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleFlag } from 'react-circle-flags';

export default function LanguageDropdown() {
  // 드롭다운 열림 상태 관리
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { i18n } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    // <div className="flex items-center md:order-2 space-x-1 md:space-x-0">
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-dropdown-toggle="language-dropdown-menu"
        className="curosr-pointer inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <CircleFlag
          countryCode={`${i18n.language === 'en' ? 'us' : i18n.language === 'ko' ? 'kr' : i18n.language === 'ja' ? 'jp' : 'en'}`}
          width={18}
          className="me-3"
        />
        {`${i18n.language === 'en' ? 'English' : i18n.language === 'ko' ? '한국어' : i18n.language === 'ja' ? '日本語' : 'English'}`}
      </button>

      {/* 드롭다운 */}
      <div
        className={`z-50 ${isOpen ? '' : 'hidden'} absolute top-full left-1/2 my-4 mt-2 w-full min-w-40 -translate-x-1/2 list-none divide-y divide-gray-100 rounded-lg bg-white text-base shadow-sm dark:bg-gray-700`}
        id="language-dropdown-menu"
      >
        <ul className="py-2 font-medium" role="none">
          <li>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
              role="menuitem"
              onClick={() => i18n.changeLanguage('en')}
            >
              <div className="inline-flex items-center">
                <CircleFlag countryCode="us" width={18} className="me-2" />
                English
              </div>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
              role="menuitem"
              onClick={() => i18n.changeLanguage('ko')}
            >
              <div className="inline-flex items-center">
                <CircleFlag countryCode="kr" width={18} className="me-2" />
                한국어
              </div>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
              role="menuitem"
              onClick={() => i18n.changeLanguage('ja')}
            >
              <div className="inline-flex items-center">
                <CircleFlag countryCode="jp" width={18} className="me-2" />
                日本語
              </div>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
