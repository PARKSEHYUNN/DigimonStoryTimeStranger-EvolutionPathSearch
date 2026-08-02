import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-xs leading-relaxed text-content-muted">
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  );
}
