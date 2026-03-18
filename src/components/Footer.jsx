// src/components/Footer.jsx

import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto w-[100vw] px-6 py-8 md:w-[80vw]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="max-w-2xl text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t('footer.disclaimer')}
          </p>
          <div className="h-px w-16 bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-col items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
            <p>© 2025-2026 DigimonStoryTimeStranger EvolutionPathSearch</p>
            <p>
              Developed by <span className="font-medium text-gray-600 dark:text-gray-400">Mesbul</span>
              {' · '}
              <a
                href="mailto:kmesbul@gmail.com"
                className="hover:text-gray-600 hover:underline dark:hover:text-gray-300"
              >
                kmesbul@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
