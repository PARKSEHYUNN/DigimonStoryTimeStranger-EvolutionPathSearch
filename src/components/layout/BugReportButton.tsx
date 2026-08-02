'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/meorwprq';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Rebuilt as a real form. The legacy version handed SweetAlert2 a string of
 * raw HTML and then read the values back out with getElementById, which meant
 * no validation state, no disabled submit, and no error recovery.
 */
export function BugReportButton() {
  const t = useTranslations('bug_report');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    // Let the closing animation finish before resetting the body.
    setTimeout(() => {
      setStatus('idle');
      setError('');
    }, 200);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setStatus('sending');
    setError('');

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(t('error_network'));
      setStatus('sent');
      form.reset();
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : t('error_network'));
    }
  };

  const field =
    'w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('open')}
        title={t('open')}
        className="cursor-pointer rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
      >
        <Bug size={18} />
      </button>

      <Dialog open={open} onClose={close} title={t('title')}>
        {status === 'sent' ? (
          <div className="py-6 text-center">
            <p className="text-sm font-semibold text-content">
              {t('completion_title')}
            </p>
            <p className="mt-1.5 text-sm text-content-muted">
              {t('completion_text')}
            </p>
            <Button variant="primary" onClick={close} className="mt-5">
              {t('cancel')}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-content">
                {t('email')}
              </span>
              {/* Without this, showModal() parks focus on the close button. */}
              <input
                autoFocus
                type="email"
                name="_replyto"
                required
                placeholder={t('replyto')}
                className={field}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-content">
                {t('type')}
              </span>
              <select name="bugType" required defaultValue="" className={field}>
                <option value="" disabled>
                  {t('choice')}
                </option>
                <option value="ui">{t('ui')}</option>
                <option value="functional">{t('functional')}</option>
                <option value="crash">{t('crash')}</option>
                <option value="etc">{t('etc')}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-content">
                {t('details')}
              </span>
              <textarea
                name="description"
                required
                rows={5}
                placeholder={t('details_placeholder')}
                className={`${field} resize-y`}
              />
            </label>

            {status === 'error' && (
              <p role="alert" className="text-sm text-devolution">
                {t('error_submit', { error_message: error })}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button onClick={close} disabled={status === 'sending'}>
                {t('cancel')}
              </Button>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex cursor-pointer items-center rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-content transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'sending' ? t('sending') : t('submit')}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
