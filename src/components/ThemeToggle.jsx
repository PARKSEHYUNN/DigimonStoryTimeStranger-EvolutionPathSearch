// src/components/ThemeToggle.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const isLocalStorageEmpty = !('theme' in localStorage);
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-schme: dark)',
    ).matches;

    if (isLocalStorageEmpty && systemPrefersDark) {
      setTheme('dark');
    }
  }, []);

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
    >
      {theme === 'dark' ? (
        <FontAwesomeIcon icon={faSun} className="text-white" />
      ) : (
        <FontAwesomeIcon icon={faMoon} className="text-gray-700" />
      )}
    </button>
  );
}
