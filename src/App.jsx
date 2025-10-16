// src/App.jsx

// 모듈 선언
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col dark:bg-gray-900">
      <Navbar />
      <div className="flex flex-grow items-center justify-center">
        <div className="w-[100vw] md:w-[80vw] text-center">
          <h1 className="text-2xl font-bold dark:text-white">
            DigimonStory TimeStranger - Evolution Path Search
          </h1>
          <p className="dark:text-white">Search</p>
        </div>
      </div>
    </div>
  );
}
