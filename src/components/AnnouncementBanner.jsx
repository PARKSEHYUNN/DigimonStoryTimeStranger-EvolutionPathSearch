// src/components/AnnouncementBanner.jsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AnnouncementBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      <span className="text-base leading-none">📢</span>
      <span className="font-medium">{t('announcement.message')}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="닫기"
        className="ml-auto rounded p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
