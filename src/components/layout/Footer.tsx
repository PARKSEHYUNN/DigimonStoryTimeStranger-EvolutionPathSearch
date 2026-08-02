import { getTranslations } from 'next-intl/server';

const AUTHOR = 'Mesbul';
const CONTACT = 'kmesbul@gmail.com';

export async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-7 text-center">
        <p className="max-w-2xl text-xs leading-relaxed text-content-muted">
          {t('disclaimer')}
        </p>

        <div className="h-px w-16 bg-border-subtle" />

        <div className="flex flex-col gap-1 text-xs text-content-muted">
          <p>{t('copyright')}</p>
          <p>
            {t('developed_by', { name: AUTHOR })}
            {' · '}
            <a
              href={`mailto:${CONTACT}`}
              className="inline-block py-1.5 hover:text-content hover:underline"
            >
              {CONTACT}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
