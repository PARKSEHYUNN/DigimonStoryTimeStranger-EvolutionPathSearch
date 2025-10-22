// src/components/BugReportButton.jsx

// 모듈 선언
import React from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBug } from '@fortawesome/free-solid-svg-icons';

export default function BugReportButton() {
  const FORMSPREE_ID = 'meorwprq';

  const openBugReportModal = () => {
    Swal.fire({
      title: t('bug_report.title'),
      customClass: {
        popup:
          '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-2xl',
        title: '!text-gray-900 dark:!text-gray-100',
        confirmButton:
          'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
        cancelButton:
          'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded',
      },
      html: `
      <form id="bug-report-form" class="flex flex-col items-start gap-4">
          <label for="swal-email" class="font-bold text-sm w-full text-left text-gray-700 dark:text-gray-300">{t('bug_report.email')}</label>
          <input 
            id="swal-email" 
            name="_replyto" 
            type="email" 
            placeholder={t('bug_report.replyto')}
            required 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                  !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-gray-100 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <label for="swal-bug-type" class="font-bold text-sm w-full text-left text-gray-700 dark:text-gray-300">{t('bug_report.type')}</label>
          <select 
            id="swal-bug-type" 
            name="bugType" 
            required 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                  !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-gray-100 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('bug_report.choice')}</option>
            <option value="ui">{t('bug_report.ui')}</option>
            <option value="functional">{t('bug_report.functional')}</option>
            <option value="crash">{t('bug_report.crash')}</option>
            <option value="etc">{t('bug_report.etc')}</option>
          </select>

          <label for="swal-description" class="font-bold text-sm w-full text-left text-gray-700 dark:text-gray-300">{t('bug_report.details')}</label>
          <textarea 
            id="swal-description" 
            name="description" 
            placeholder={t('bug_report.details_placeholder')}
            rows="5"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                  !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-gray-100 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          ></textarea>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: t('bug_report.submit'),
      cancelButtonText: t('bug_report.cancel'),
      focusConfirm: false,
      preConfirm: () => {
        const email = document.getElementById('swal-email').value;
        const bugType = document.getElementById('swal-bug-type').value;
        const description = document.getElementById('swal-description').value;

        // 간단한 유효성 검사
        if (!email || !bugType || !description) {
          Swal.showValidationMessage(t('bug_report.error_input'));
        }

        const formData = {
          _replyto: email,
          bugType: bugType,
          description: description,
        };

        return fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(t('bug_report.error_network'));
            }
            return response.json();
          })
          .catch((error) => {
            Swal.showValidationMessage(
              t('bug_report.error_submit', { error_message: error.message }),
            );
          });
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: t('bug_report.completion_title'),
          text: t('bug_report.completion_text'),
          icon: 'success',
          background: '#ffffff',
          color: '#1f2937',
          customClass: {
            popup: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            title: 'text-gray-900 dark:text-gray-100',
            content: 'text-gray-700 dark:text-gray-300',
          },
        });
      }
    });
  };

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
      onClick={openBugReportModal}
    >
      <FontAwesomeIcon icon={faBug} className="text-gray-900 dark:text-white" />
    </button>
  );
}
