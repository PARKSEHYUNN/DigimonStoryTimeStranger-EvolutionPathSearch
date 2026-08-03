import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { AUTHOR, CONTACT_EMAIL } from '@/lib/site';

export async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-border-subtle mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-7 text-center">
        <p className="text-content-muted max-w-2xl text-xs leading-relaxed">
          {t('disclaimer')}
        </p>

        <div className="bg-border-subtle h-px w-16" />

        <div className="text-content-muted flex flex-col gap-1 text-xs">
          <p>{t('copyright')}</p>
          <p>
            {t('developed_by', { name: AUTHOR })}
            {' · '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-content inline-block py-1.5 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            <Link
              href="/privacy"
              className="hover:text-content inline-block py-1.5 hover:underline"
            >
              {t('privacy')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
