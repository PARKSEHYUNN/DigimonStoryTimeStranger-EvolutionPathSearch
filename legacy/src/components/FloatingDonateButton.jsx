// src/components/FloatingDonateButton.jsx

import { useState, useEffect } from 'react';

export default function FloatingDonateButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <a
      href="https://ko-fi.com/mesbul"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support on Ko-fi"
      className="animate-pop-in fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5E5B] shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="h-6 w-6"
        aria-hidden="true"
      >
        {/* coffee cup */}
        <path d="M18 8h-1V6H3v8a5 5 0 0 0 5 5h4a5 5 0 0 0 4.9-4H18a3 3 0 0 0 0-6zm0 4h-2v-2h2a1 1 0 0 1 0 2z" />
        <path d="M20 2H4a1 1 0 0 0-.8 1.6L5 6h14l1.8-2.4A1 1 0 0 0 20 2z" />
      </svg>
    </a>
  );
}
