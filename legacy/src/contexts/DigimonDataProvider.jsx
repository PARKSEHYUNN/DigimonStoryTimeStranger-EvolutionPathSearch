// src/contexts/DigimonDataProvider.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import { DigimonDataContext } from './DigimonDataContext';

export function DigimonDataProvider({ children }) {
  const [digimons, setDigimons] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/digimon_list.json')
      .then((res) => res.json())
      .then((data) => {
        const digimonMap = new Map(
          data.map((digimon) => [digimon.id, digimon]),
        );

        setDigimons(digimonMap);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch digimon list: ', error);
        setLoading(false);
      });
  }, []);

  return (
    <DigimonDataContext.Provider value={{ digimons, loading }}>
      {children}
    </DigimonDataContext.Provider>
  );
}
