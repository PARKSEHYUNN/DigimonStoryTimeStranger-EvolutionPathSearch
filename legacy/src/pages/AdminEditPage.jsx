// src/pages/AdminEditPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDigimons } from '../hooks/useDigimons';

const GENERATIONS = [
  '유년기 I', '유년기 II', '성장기', '성숙기',
  '완전체', '궁극체', '초궁극체', '아머체', '하이브리드체',
];
const ATTRIBUTES = ['종족 불명', '백신', '바이러스', '데이터', '프리', '배리어블', '불명'];
const PERSONALITIES = [
  ['자애', 'Adoring'], ['헌신적', 'Devoted'], ['포용력', 'Tolerant'],
  ['과보호', 'Overprotective'], ['열혈', 'Zealous'], ['용감', 'Brave'],
  ['만용', 'Reckless'], ['대담', 'Daring'], ['계시', 'Enlightened'],
  ['잔머리', 'Sly'], ['지혜로움', 'Astute'], ['전략가', 'Strategic'],
  ['기회주의자', 'Opportunistic'], ['친근함', 'Friendly'],
  ['사교적', 'Sociable'], ['따뜻함', 'Compassionate'],
];
const STAT_KEYS = ['rank', 'HP', 'SP', 'ATK', 'DEF', 'INT', 'RES', 'SPD', 'TALENT'];
const ITEMS = [
  [1, '운명의 캡슐'], [2, '희망의 캡슐'], [3, '지식의 캡슐'], [4, '성실의 캡슐'],
  [5, '우정의 캡슐'], [6, '기적의 캡슐'], [7, '용기의 캡슐'], [8, '사랑의 캡슐'],
  [9, '순수의 캡슐'], [10, '빛의 캡슐'], [11, '빛의 휴먼 스피릿'], [12, '불의 휴먼 스피릿'],
  [13, '불의 비스트 스피릿'], [14, '빛의 비스트 스피릿'], [15, '오메가 블레이드'],
];

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const selectClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

// 단일 선택 검색 (수정할 디지몬 고르기)
function SingleDigimonSearch({ onSelect }) {
  const { digimons } = useDigimons();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsOpen(false); return; }
    const q = query.trim().toLowerCase();
    const filtered = [];
    for (const d of digimons.values()) {
      const [en, ko, ja] = d.name;
      if (
        en.toLowerCase().includes(q) ||
        ko.toLowerCase().includes(q) ||
        (ja && ja.toLowerCase().includes(q))
      ) {
        filtered.push(d);
        if (filtered.length >= 10) break;
      }
    }
    setResults(filtered);
    setIsOpen(filtered.length > 0);
  }, [query, digimons]);

  const handleSelect = (d) => {
    onSelect(d);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        className={inputClass}
        placeholder="수정할 디지몬 이름 검색 (한국어, 영어, 일본어)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {results.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSelect(d)}
              >
                <span className="w-8 shrink-0 font-mono text-xs text-gray-400">#{d.id}</span>
                <img
                  src={`/digimon_icons/${d.id}.png`}
                  className="h-6 w-6 shrink-0"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <span className="text-gray-900 dark:text-white">{d.name[1]}</span>
                <span className="text-gray-400">{d.name[0]}</span>
                <span className="ml-auto text-xs text-gray-300 dark:text-gray-500">{d.name[2]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 다중 선택 검색
function DigimonSearchInput({ label, selected, onAdd, onRemove }) {
  const { digimons } = useDigimons();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsOpen(false); return; }
    const q = query.trim().toLowerCase();
    const filtered = [];
    for (const d of digimons.values()) {
      if (selected.some((s) => s.id === d.id)) continue;
      const [en, ko, ja] = d.name;
      if (
        en.toLowerCase().includes(q) ||
        ko.toLowerCase().includes(q) ||
        (ja && ja.toLowerCase().includes(q))
      ) {
        filtered.push(d);
        if (filtered.length >= 10) break;
      }
    }
    setResults(filtered);
    setIsOpen(filtered.length > 0);
  }, [query, digimons, selected]);

  const handleSelect = (d) => {
    onAdd(d);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <span className="font-mono text-blue-500 dark:text-blue-400">#{d.id}</span>
              {d.name[1]}
              <button type="button" onClick={() => onRemove(d.id)} className="ml-0.5 text-blue-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      )}
      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          className={inputClass}
          placeholder="이름으로 검색 (한국어, 영어, 일본어)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isOpen && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            {results.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSelect(d)}
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-gray-400">#{d.id}</span>
                  <img
                    src={`/digimon_icons/${d.id}.png`}
                    className="h-6 w-6 shrink-0"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                  <span className="text-gray-900 dark:text-white">{d.name[1]}</span>
                  <span className="text-gray-400">{d.name[0]}</span>
                  <span className="ml-auto text-xs text-gray-300 dark:text-gray-500">{d.name[2]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminEditPage() {
  const { digimons } = useDigimons();
  const [dlcIds, setDlcIds] = useState(new Set());
  const [editingDigimon, setEditingDigimon] = useState(null);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/dlc_list.json').then((r) => r.json()).then((data) => setDlcIds(new Set(data.DLC)));
  }, []);

  const loadDigimon = (d) => {
    const full = digimons.get(d.id);
    if (!full) return;

    const evolutionFrom = (full.evolution?.from || []).map((id) => digimons.get(id)).filter(Boolean);
    const evolutionTo = (full.evolution?.to || []).map((id) => digimons.get(id)).filter(Boolean);
    const toIds = new Set(full.evolution?.to || []);

    const requirements = (full.evolution_requirements || []).map((r) => ({
      id: r.id,
      digimon: toIds.has(r.id) ? (digimons.get(r.id) || null) : null,
      conditions: { ...r.conditions },
    }));

    const incomingRequirements = {};
    for (const fromDigi of evolutionFrom) {
      const req = (fromDigi.evolution_requirements || []).find((r) => r.id === full.id);
      incomingRequirements[fromDigi.id] = req ? { ...req.conditions } : { rank: 1 };
    }

    setEditingDigimon(full);
    setForm({
      id: full.id,
      nameEn: full.name[0] || '',
      nameKo: full.name[1] || '',
      nameJa: full.name[2] || '',
      generation: full.generation,
      attribute: full.attribute,
      personality: full.personality,
      isDlc: dlcIds.has(full.id),
      evolutionFrom,
      evolutionTo,
      requirements,
      incomingRequirements,
    });
    setStatus(null);
  };

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addEvolution = (field, digimon) => {
    setForm((prev) => {
      if (prev[field].some((d) => d.id === digimon.id)) return prev;
      const next = { ...prev, [field]: [...prev[field], digimon] };
      if (field === 'evolutionFrom') {
        next.incomingRequirements = { ...prev.incomingRequirements, [digimon.id]: { rank: 1 } };
      }
      if (field === 'evolutionTo') {
        if (!prev.requirements.some((r) => r.id === digimon.id)) {
          next.requirements = [...prev.requirements, { id: digimon.id, digimon, conditions: { rank: 1 } }];
        } else {
          next.requirements = prev.requirements.map((r) =>
            r.id === digimon.id ? { ...r, digimon } : r
          );
        }
      }
      return next;
    });
  };

  const removeEvolution = (field, id) => {
    setForm((prev) => {
      const next = { ...prev, [field]: prev[field].filter((d) => d.id !== id) };
      if (field === 'evolutionFrom') {
        const { [id]: _, ...rest } = prev.incomingRequirements;
        next.incomingRequirements = rest;
      }
      if (field === 'evolutionTo') {
        next.requirements = prev.requirements.filter((r) => r.id !== id);
      }
      return next;
    });
  };

  const updateIncomingRequirement = (fromId, key, value) => {
    setForm((prev) => {
      const conditions = { ...prev.incomingRequirements[fromId] };
      if (value === '' || value === null) {
        delete conditions[key];
      } else {
        conditions[key] = Number(value);
      }
      return { ...prev, incomingRequirements: { ...prev.incomingRequirements, [fromId]: conditions } };
    });
  };

  const updateRequirement = (index, key, value) => {
    setForm((prev) => {
      const reqs = [...prev.requirements];
      if (key === 'id') {
        reqs[index] = { ...reqs[index], id: value };
      } else {
        const conditions = { ...reqs[index].conditions };
        if (value === '' || value === null) {
          delete conditions[key];
        } else {
          conditions[key] = Number(value);
        }
        reqs[index] = { ...reqs[index], conditions };
      }
      return { ...prev, requirements: reqs };
    });
  };

  const addRequirement = () =>
    setForm((prev) => ({
      ...prev,
      requirements: [...prev.requirements, { id: '', digimon: null, conditions: { rank: 1 } }],
    }));

  const removeRequirement = (index) =>
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));

  const buildPayload = () => ({
    id: Number(form.id),
    name: [form.nameEn.trim(), form.nameKo.trim(), form.nameJa.trim()],
    generation: Number(form.generation),
    attribute: Number(form.attribute),
    personality: Number(form.personality),
    isDlc: form.isDlc,
    evolution: {
      from: form.evolutionFrom.map((d) => d.id),
      to: form.evolutionTo.map((d) => d.id),
    },
    evolution_requirements: form.requirements
      .filter((r) => r.id !== '')
      .map((r) => ({ id: Number(r.id), conditions: r.conditions })),
    incoming_requirements: Object.entries(form.incomingRequirements).map(([fromId, conditions]) => ({
      fromId: Number(fromId),
      conditions,
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameKo.trim()) {
      setStatus({ type: 'error', message: '한국어 이름은 필수입니다.' });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch(`/___admin/api/digimon/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error });
      } else {
        setStatus({ type: 'success', message: `ID ${data.id} 디지몬이 수정되었습니다.` });
        // DLC 상태 갱신
        setDlcIds((prev) => {
          const next = new Set(prev);
          form.isDlc ? next.add(form.id) : next.delete(form.id);
          return next;
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* 네비게이션 */}
      <div className="mb-4 flex gap-3 text-sm">
        <Link to="/admin" className="text-blue-500 hover:underline">← 디지몬 추가</Link>
      </div>

      <div className="mb-6 rounded-lg bg-yellow-100 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        ⚠️ 개발 전용 페이지입니다. 변경사항은 <code>public/digimon_list.json</code>에 즉시 반영됩니다.
      </div>

      {/* 디지몬 선택 */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">수정할 디지몬 선택</h2>
        <SingleDigimonSearch onSelect={loadDigimon} />
        {editingDigimon && (
          <div className="mt-3 flex items-center gap-2 rounded bg-blue-50 px-3 py-2 dark:bg-blue-900">
            <img
              src={`/digimon_icons/${editingDigimon.id}.png`}
              className="h-8 w-8"
              onError={(e) => (e.target.style.display = 'none')}
            />
            <span className="font-semibold text-blue-700 dark:text-blue-200">
              #{editingDigimon.id} {editingDigimon.name[1]} ({editingDigimon.name[0]}) 수정 중
            </span>
          </div>
        )}
      </section>

      {form && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">기본 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>ID (읽기 전용)</label>
                <input
                  type="number"
                  className={inputClass + ' opacity-60'}
                  value={form.id}
                  readOnly
                />
              </div>
              <div>
                <label className={labelClass}>세대</label>
                <select className={selectClass} value={form.generation} onChange={(e) => updateForm('generation', e.target.value)}>
                  {GENERATIONS.map((g, i) => <option key={i} value={i}>{i} - {g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>속성</label>
                <select className={selectClass} value={form.attribute} onChange={(e) => updateForm('attribute', e.target.value)}>
                  {ATTRIBUTES.map((a, i) => <option key={i} value={i}>{i} - {a}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>기본 성격</label>
                <select className={selectClass} value={form.personality} onChange={(e) => updateForm('personality', e.target.value)}>
                  {PERSONALITIES.map(([ko, en], i) => <option key={i} value={i}>{i} - {ko} / {en}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-600">
                <input
                  type="checkbox"
                  id="isDlcEdit"
                  className="h-4 w-4 cursor-pointer accent-purple-500"
                  checked={form.isDlc}
                  onChange={(e) => updateForm('isDlc', e.target.checked)}
                />
                <label htmlFor="isDlcEdit" className="cursor-pointer select-none text-sm font-medium text-gray-700 dark:text-gray-300">
                  DLC 디지몬
                </label>
                {form.isDlc && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    DLC
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 이름 */}
          <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">이름</h2>
            <div className="grid grid-cols-3 gap-4">
              {[['nameEn', '영어'], ['nameKo', '한국어 *'], ['nameJa', '일본어']].map(([key, label]) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={form[key]}
                    onChange={(e) => updateForm(key, e.target.value)}
                    required={key === 'nameKo'}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 진화 관계 */}
          <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">진화 관계</h2>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              연결된 디지몬의 from/to도 자동으로 업데이트됩니다.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DigimonSearchInput
                label="진화 전 (from)"
                selected={form.evolutionFrom}
                onAdd={(d) => addEvolution('evolutionFrom', d)}
                onRemove={(id) => removeEvolution('evolutionFrom', id)}
              />
              <DigimonSearchInput
                label="진화 후 (to)"
                selected={form.evolutionTo}
                onAdd={(d) => addEvolution('evolutionTo', d)}
                onRemove={(id) => removeEvolution('evolutionTo', id)}
              />
            </div>
          </section>

          {/* 진화 전 조건 */}
          {form.evolutionFrom.length > 0 && (
            <section className="rounded-lg border border-orange-200 p-4 dark:border-orange-700">
              <h2 className="mb-1 font-semibold text-gray-900 dark:text-white">진화 전 조건</h2>
              <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                각 진화 전 디지몬에서 <strong>이 디지몬으로 진화할 때</strong> 필요한 조건입니다.
              </p>
              <div className="space-y-4">
                {form.evolutionFrom.map((d) => {
                  const conditions = form.incomingRequirements[d.id] || {};
                  return (
                    <div key={d.id} className="rounded border border-orange-100 p-3 dark:border-orange-800">
                      <div className="mb-2 flex items-center gap-2">
                        <img
                          src={`/digimon_icons/${d.id}.png`}
                          className="h-6 w-6 shrink-0"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          #{d.id} {d.name[1]} ({d.name[0]}) → 이 디지몬
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {STAT_KEYS.map((key) => (
                          <div key={key}>
                            <label className={labelClass}>{key}</label>
                            <input
                              type="number"
                              className={inputClass}
                              placeholder="-"
                              value={conditions[key] ?? ''}
                              onChange={(e) => updateIncomingRequirement(d.id, key, e.target.value)}
                            />
                          </div>
                        ))}
                        <div className="col-span-2 sm:col-span-3">
                          <label className={labelClass}>필요 아이템</label>
                          <select
                            className={selectClass}
                            value={conditions.item ?? ''}
                            onChange={(e) => updateIncomingRequirement(d.id, 'item', e.target.value)}
                          >
                            <option value="">없음</option>
                            {ITEMS.map(([id, name]) => (
                              <option key={id} value={id}>{id} - {name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 진화 조건 */}
          <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                진화 조건 (evolution_requirements)
              </h2>
              <button
                type="button"
                onClick={addRequirement}
                className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
              >
                + 추가
              </button>
            </div>
            <div className="space-y-4">
              {form.requirements.map((req, index) => (
                <div key={index} className="rounded border border-gray-200 p-3 dark:border-gray-600">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {req.digimon && (
                        <img
                          src={`/digimon_icons/${req.digimon.id}.png`}
                          className="h-5 w-5 shrink-0"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {req.digimon
                          ? `→ #${req.digimon.id} ${req.digimon.name[1]} (${req.digimon.name[0]})`
                          : `조건 #${index + 1}`}
                      </span>
                    </div>
                    {!req.digimon && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-sm text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {!req.digimon && (
                      <div>
                        <label className={labelClass}>대상 ID</label>
                        <input
                          type="number"
                          className={inputClass}
                          placeholder="진화 후 디지몬 ID"
                          value={req.id}
                          onChange={(e) => updateRequirement(index, 'id', e.target.value)}
                        />
                      </div>
                    )}
                    {STAT_KEYS.map((key) => (
                      <div key={key}>
                        <label className={labelClass}>{key}</label>
                        <input
                          type="number"
                          className={inputClass}
                          placeholder="-"
                          value={req.conditions[key] ?? ''}
                          onChange={(e) => updateRequirement(index, key, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="col-span-2 sm:col-span-3">
                      <label className={labelClass}>필요 아이템</label>
                      <select
                        className={selectClass}
                        value={req.conditions.item ?? ''}
                        onChange={(e) => updateRequirement(index, 'item', e.target.value)}
                      >
                        <option value="">없음</option>
                        {ITEMS.map(([id, name]) => (
                          <option key={id} value={id}>{id} - {name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {form.requirements.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  진화 후 디지몬을 추가하면 자동으로 항목이 생성됩니다.
                </p>
              )}
            </div>
          </section>

          {/* JSON 미리보기 */}
          <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <h2 className="mb-2 font-semibold text-gray-900 dark:text-white">JSON 미리보기</h2>
            <pre className="overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400">
              {JSON.stringify(buildPayload(), null, 2)}
            </pre>
          </section>

          {status && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? '수정 중...' : '디지몬 수정'}
          </button>
        </form>
      )}
    </div>
  );
}
