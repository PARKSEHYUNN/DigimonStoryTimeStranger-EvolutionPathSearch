# EvolutionPath 리뉴얼 계획 (Next.js + TypeScript → Cloudflare Pages)

## Context

`search.digimonts.my`는 운영 중인 디지몬 진화 경로 검색 사이트다. 현행 코드는 React 19 + Vite SPA(JavaScript)이며, 데이터는 `public/digimon_list.json` 단일 파일(475종, 335KB)에 집중되어 있다.

기능은 동작하지만 구조적 한계가 누적됐다:

1. **SEO 상한** — SPA라 URL이 `/`와 `/list` 둘뿐이다. 3개국어 hreflang이 전부 같은 URL을 가리켜 사실상 무효고, 475종 디지몬 정보가 검색엔진에 전혀 노출되지 않는다. 커밋 이력(`Google Search Console Update`)상 검색 유입은 중요한 목표다.
2. **최단 경로 오답** — A\* 휴리스틱 `h = |세대차|`가 비허용적(inadmissible)이다. 세대를 2 이상 건너뛰는 간선이 25개(최대 6세대) 있어 전제가 깨진다. 무작위 200쌍 검증에서 실제 반례 확인: `Firamon(100) → Lobomon(188)`이 8홉으로 반환되나 실제 최단은 6홉이다.
3. **데이터 3중 중복** — `evolution.from` / `evolution.to` / `evolution_requirements`가 같은 간선을 세 번 표현한다. 이미 역링크 4건이 어긋나 있고(455↔456, 463→309, 464→423), 해당 구간의 진화 조건·조그레스 표시가 누락된다.
4. **타입 안전성 없음** — 15종 조건 키, 9세대/7속성/16성격 코드가 전부 매직 넘버다. `isJogress` 같은 잔재 키가 2건 남아 있어도 아무도 모른다.

**목표:** 기존 코드를 `legacy/`로 보존하고, Next.js(App Router) + TypeScript로 새로 작성한다. 정적 익스포트로 디지몬별 개별 URL을 생성해 SEO를 근본 해결하고, 데이터 스키마를 정규화해 정합성 버그를 구조적으로 차단한다. 배포는 Cloudflare Pages.

---

## 배포 전략 결정

**Next.js 정적 익스포트(`output: 'export'`) → Cloudflare Pages.** Workers / OpenNext 어댑터는 불필요하다.

근거:
- 이 사이트는 런타임 서버 로직이 0이다. 데이터는 빌드 시점에 확정되고, 경로 탐색은 클라이언트에서 0.027ms에 끝난다(475노드/1,101간선 실측).
- 정적 익스포트는 Cloudflare Pages 공식 지원 경로다. 빌드 커맨드 `npx next build`, 출력 디렉터리 `out`.
- 산출 파일 수: HTML 약 1,425(475종 × 3언어) + 아이콘 483 + JS 청크 ≈ 2,000개. Free 플랜 한도 20,000 파일 / 개별 25MiB 대비 여유롭다.

제약과 대응:
| 제약 | 대응 |
|---|---|
| Middleware 미동작 → `Accept-Language` 자동 감지 불가 | `/`에 경량 클라이언트 리다이렉트 페이지(localStorage → `navigator.language` → `en`). 로케일 경로는 항상 prefix(`/ko`, `/en`, `/ja`) |
| `next/image` 최적화 미동작 | `images.unoptimized: true` + 빌드 시 WebP 사전 생성 |
| Route Handler 사용 불가 | Admin 도구를 Next 앱 바깥(`tools/`)의 로컬 전용 앱으로 분리 |
| `@vercel/analytics` 무의미 | Cloudflare Web Analytics로 교체 |

---

## 디렉터리 구조

```
EvolutionPath/
├── legacy/                        ← 기존 전체 이동 (src/, public/, vite.config.js, index.html, package.json …)
├── data/                          ← 정규화된 단일 진실 공급원(SoT)
│   ├── digimons.json              475종 기본 정보
│   ├── evolutions.json            1,118개 단방향 간선 + 조건
│   ├── agent-levels.json
│   └── items.json
├── public/
│   ├── icons/{id}.webp            256px 본본
│   ├── icons/thumb/{id}.webp      64px 목록용
│   └── font/
├── src/
│   ├── app/
│   │   ├── page.tsx                        → 로케일 리다이렉트
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    진화 경로 검색 (메인)
│   │   │   ├── digimon/page.tsx            목록
│   │   │   └── digimon/[slug]/page.tsx     상세 (SSG 475 × 3)
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                    디자인 시스템 primitives
│   │   └── digimon/               도메인 컴포넌트
│   ├── lib/
│   │   ├── digimon/  schema.ts · load.ts · graph.ts
│   │   ├── pathfinder/ bfs.ts · k-paths.ts · filters.ts
│   │   └── i18n/
│   └── messages/     en.json · ko.json · ja.json
├── tools/
│   ├── admin/                     Vite 로컬 전용 편집 UI (배포 대상 아님)
│   ├── data-server.mjs            data/ 읽기·쓰기 + 저장 전 검증
│   └── migrate-legacy.mjs         구 JSON → 신 스키마 1회성 변환
├── scripts/
│   ├── validate-data.mjs
│   ├── optimize-icons.mjs
│   └── build-graph-payload.mjs
└── next.config.ts
```

---

## Phase 0 — 레거시 격리 및 스캐폴드

1. `git mv`로 `src/ public/ index.html vite.config.js eslint.config.js .prettierrc package.json package-lock.json README*.md` → `legacy/`. 한 커밋으로 분리해 diff를 순수 이동으로 유지한다.
2. 루트에 Next.js 15 + TypeScript + Tailwind v4 프로젝트 스캐폴드.
3. `next.config.ts`: `output: 'export'`, `images.unoptimized: true`, `trailingSlash: true`(Cloudflare Pages 경로 매칭 안정화).
4. `public/_redirects`로 구 URL 보존 — SEO 자산을 버리지 않기 위해 필수:
   ```
   /list   /ko/digimon   301
   ```

## Phase 1 — 데이터 스키마 재설계

**핵심 변경: 3중 중복을 단방향 간선 하나로 통합한다.** 역링크 desync 버그가 표현 불가능해진다.

```jsonc
// data/digimons.json
{ "id": 1, "slug": "kuramon",
  "names": { "en": "Kuramon", "ko": "쿠라몬", "ja": "クラモン" },
  "generation": 0, "attribute": 0, "personality": 9, "dlc": false }

// data/evolutions.json — 간선이 유일한 진실
{ "from": 1, "to": 16, "conditions": { "rank": 1, "SP": 280 } }
```

- `evolution.from` / `evolution.to` / `evolution_requirements` → `evolutions.json` 하나로 흡수. 현재 간선 1,118개와 요구조건 1,118개가 1:1 정확히 대응하므로 무손실 변환이 가능하다.
- `dlc_list.json` → `digimons[].dlc` boolean으로 흡수.
- `jogress_list.json` → `conditions.jogress`에서 파생 가능하므로 제거(17건 완전 일치 확인됨).
- `isJogress` 잔재 키(474, 475) 제거.
- 역링크 누락 4건은 마이그레이션 시 자동 정상화된다(단방향 간선에는 "역방향"이 없음).
- 세대/속성/성격/조건 키를 TS union 타입 + Zod 스키마로 고정.

**산출물**
- `tools/migrate-legacy.mjs` — `legacy/public/*.json` → `data/*.json` 1회성 변환. 변환 후 구·신 그래프의 간선 집합이 동일한지 자체 대조 출력.
- `src/lib/digimon/schema.ts` — Zod 스키마 + 파생 TS 타입.
- `scripts/validate-data.mjs` — 참조 무결성, 아이콘 존재 여부, 조그레스 참조 유효성, 슬러그 유일성 검사. `npm run validate`로 실행하고 CI 및 admin 저장 시점에 강제.

## Phase 2 — 경로 탐색 엔진 재작성

`src/lib/pathfinder/` — 순수 TypeScript 함수. **Web Worker를 제거한다.**

- 간선 비용이 전부 1이므로 **BFS가 항상 최적**이다. 휴리스틱을 없애는 것만으로 현행 오답이 사라지고, 힙 연산이 빠져 오히려 빨라진다.
- 실측 0.027ms/탐색(37,000회/초). 워커의 INIT 핸드셰이크·메시지 프로토콜·`isGraphReady` 상태·에러 배관이 전부 불필요해진다.
- `k` 파라미터를 실제로 구현한다(현행은 선언만 되고 미사용, 항상 1개만 반환). BFS 기반 Yen's algorithm으로 대안 경로 K개를 제시 — 리뉴얼의 눈에 띄는 기능 개선이다.
- 필터는 순수 함수로 분리: `agentLevel`, `includeDlc`, `includeJogress`, `excludeIds`.

**테스트 (Vitest)**
- 브루트포스 BFS와 전 쌍 대조하여 최적성 보장.
- 회귀 케이스 고정: `Firamon(100) → Lobomon(188) === 6홉`.
- 필터별 경계 케이스(에이전트 레벨 컷오프, DLC 제외, 제외 목록에 시작/끝 포함).

## Phase 3 — 디자인 시스템 및 핵심 화면

현행은 Flowbite 스타일 Tailwind 클래스를 컴포넌트마다 인라인 나열하는 구조다(다크모드 토글 클래스 문자열이 파일마다 복붙되어 있음). 새로 세운다.

- CSS 변수 기반 디자인 토큰 + Tailwind v4 `@theme`. 다크모드는 현행 `.dark` 커스텀 variant 유지.
- `src/components/ui/` — Button, Toggle, Dialog, Select, Card, Badge primitives.
- **의존성 정리**: SweetAlert2(~40KB) → 자체 Dialog. FontAwesome 3패키지 → lucide-react. `react-circle-flags` → 인라인 SVG.
- 언어 인덱스 매핑(`i18n.language === 'en' ? 0 : …`)이 4개 파일에 흩어져 있던 문제는 `names: { en, ko, ja }` 레코드 구조로 사라진다.
- 재작성 대상 화면: 진화 경로 검색(메인), 디지몬 목록(가상 스크롤 유지), 디지몬 상세.
- **버그 수정 반영**: `DigimonItem`의 널 가드가 프로퍼티 접근 뒤에 있던 문제, `EvolutionArrow`의 옵셔널 체이닝 누락, `index.css`의 일본어 폰트 경로 오류(`./woff2/…` → 실제 `public/font/PretendardJPVariable.woff2`).

**클라이언트 데이터 전달**: 335KB 원본을 런타임 fetch하던 방식을 버린다. `scripts/build-graph-payload.mjs`가 검색에 필요한 최소 필드만 담은 압축 페이로드를 빌드 시 생성하고, 이를 동적 로드되는 클라이언트 청크에 번들한다(brotli 후 ~50KB, 네비게이션 간 캐시 재사용).

## Phase 4 — SSG 및 SEO

리뉴얼의 최대 성과 지점.

- `app/[locale]/digimon/[slug]/page.tsx` + `generateStaticParams` → **1,425개 정적 페이지**.
- 페이지별 `generateMetadata`: 고유 title/description, 자기 자신을 가리키는 canonical, 3언어 hreflang **각각 다른 URL**(현행의 근본 문제 해결), OG 이미지로 해당 디지몬 아이콘.
- 상세 페이지 본문에 진화 전/후 관계와 조건을 정적 렌더 → 크롤러가 읽을 실제 콘텐츠 확보.
- `app/sitemap.ts`로 전 URL 자동 생성(현행 수기 `sitemap.xml` 대체).
- `<html lang>`을 로케일별로 정확히 출력(현행은 `ko` 고정).
- i18n은 next-intl, prefix 라우팅 `always`. `generateStaticParams`로 로케일 프리렌더.
- JSON-LD 구조화 데이터(`VideoGame` / `ItemList`) 추가 검토.

## Phase 5 — Admin 편집 도구 재작성

현행 `AdminPage.jsx`(25KB) + `AdminEditPage.jsx`(29KB) + `vite.config.js`의 CRUD 미들웨어(209줄)를 대체한다. 현행은 `import.meta.env.DEV` 가드로 프로덕션 노출을 막지만, 정적 익스포트에서는 Route Handler를 쓸 수 없으므로 어차피 분리가 필요하다. 구조적으로도 더 안전하다.

- `tools/admin/` — 독립 Vite + React + TS 앱. 배포 파이프라인에 포함되지 않는다.
- `tools/data-server.mjs` — `data/*.json` 읽기·쓰기 로컬 Node 서버. **저장 전 Phase 1의 Zod 스키마로 검증**해 깨진 데이터가 커밋되는 것을 원천 차단(현행에는 검증이 없다).
- 단방향 간선 구조 덕분에 현행 admin 로직의 절반(양방향 관계 수동 동기화 코드)이 통째로 사라진다.
- 스키마·타입은 tsconfig path alias로 Next 앱과 공유. 별도 워크스페이스는 두지 않는다.
- `npm run admin`으로 UI와 데이터 서버를 동시 기동.

## Phase 6 — 이미지 최적화 및 배포

- 아이콘 483개가 256×256 PNG 평균 96KB, 합계 **45MB**다. 목록 그리드는 48~80px로 렌더하면서 96KB 원본을 받는 상태다.
- `scripts/optimize-icons.mjs`(sharp): 256px WebP + 64px 썸네일 생성. 45MB → 8MB 내외 예상. 목록은 썸네일, 상세는 본본 사용.
- Cloudflare Pages 연결: 빌드 `npx next build`, 출력 `out`.
- `search.digimonts.my` DNS를 Cloudflare로 이관.
- Cloudflare Web Analytics 적용.
- **컷오버 전 확인**: 구 URL 301 동작, sitemap 제출, GSC 색인 재요청.

---

## 검증 방법

**데이터**
```bash
npm run validate          # 참조 무결성 · 아이콘 · 슬러그 유일성
node tools/migrate-legacy.mjs --verify   # 구·신 간선 집합 동일성 대조
```

**알고리즘**
```bash
npm test                  # Vitest: 브루트포스 BFS 전수 대조 + 회귀 케이스
```
`Firamon → Lobomon`이 6홉으로 나오는지 확인(현행 8홉).

**빌드 및 SSG**
```bash
npm run build             # out/ 생성
```
`out/` 하위에 `ko/digimon/{slug}/index.html`이 475개 생성되었는지, 각 HTML의 canonical·hreflang이 서로 다른 URL을 가리키는지 확인. 파일 총수가 20,000 미만인지 확인.

**로컬 실사용**
```bash
npx serve out             # 정적 산출물을 그대로 확인 (Cloudflare 환경과 동일 조건)
```
- `/` → 브라우저 언어에 맞는 로케일로 리다이렉트되는지
- 진화 경로 검색이 3언어 모두에서 동작하는지
- 조그레스 조건이 455↔456, 463→309, 464→423 구간에서도 표시되는지(현행 누락 지점)

**Admin**
```bash
npm run admin
```
디지몬 추가/수정 후 `data/*.json`이 정상 갱신되고, 의도적으로 깨진 입력이 저장 단계에서 거부되는지 확인.

**배포 후**
- Cloudflare Pages 프리뷰 URL에서 전 화면 점검
- `search.digimonts.my/list` → `/ko/digimon` 301 확인
- GSC에서 신규 sitemap 제출 및 색인 증가 추적

---

## 범위 밖 (명시)

- `legacy/`는 참조용으로만 보존한다. 신규 코드가 안정화되면 별도 커밋으로 삭제하며, 이번 작업에서는 지우지 않는다.
- 진화 트리 그래프 시각화(노드-엣지 다이어그램)는 이번 범위에 넣지 않는다. Phase 2의 K-경로 API가 이후 확장 지점이 된다.
- 게임 데이터 내용 자체의 정오 수정은 하지 않는다. 구조 변환과 정합성 검증까지만 다룬다.
