// src/hooks/useDigimons.js

// 모듈 선언
import { useContext } from 'react';
import { DigimonDataContext } from '../contexts/DigimonDataContext';

export function useDigimons() {
  const context = useContext(DigimonDataContext);
  if (!context) {
    throw new Error('useDigimons must be used within a DigimonDataProvider');
  }
  return context;
}
