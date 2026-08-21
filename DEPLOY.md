# 배포 절차 — Cloudflare Pages

`digimonts.my`를 현재 호스팅에서 Cloudflare Pages로 옮기는 순서다.

코드 쪽 준비는 끝나 있다. 아래는 **계정·도메인 권한이 필요해 이 저장소 밖에서 해야 하는 일**과,
각 단계에서 무엇을 확인해야 하는지다.

순서가 중요하다. 3번(DNS 이관)은 전파에 최대 24시간이 걸리고, 그 사이 사이트는
기존 호스팅에서 계속 서비스된다. 5번(커스텀 도메인 연결) 전까지는 운영 사이트에
아무 영향이 없으므로, 4번까지 끝내고 프리뷰 URL에서 충분히 확인한 뒤 넘어가면 된다.

---

## 0. GitHub 푸시

현재 리뉴얼 커밋은 **로컬에만** 있다. Pages는 GitHub 저장소를 연결해 빌드하므로 푸시가 선행돼야 한다.

```bash
git push -u origin renewal/nextjs
```

`main`은 건드리지 않는다. Pages를 `renewal/nextjs`에 연결하면 프리뷰 URL이 생기고,
운영 도메인은 그대로 기존 호스팅을 가리킨 채 실물을 확인할 수 있다.

> 백업 관점에서도 이 단계는 먼저 해두는 편이 낫다. 6개 페이즈 분량이 지금 이 PC에만 있다.

---

## 1. Pages 프로젝트 생성

Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**

| 항목                   | 값                                                                                |
| ---------------------- | --------------------------------------------------------------------------------- |
| Repository             | `PARKSEHYUNN/DigimonStoryTimeStranger-EvolutionPathSearch`                        |
| Production branch      | `renewal/nextjs` (컷오버 후 `main`으로 변경)                                      |
| Framework preset       | **None** — Next.js 프리셋은 서버 런타임을 가정한다. 이 프로젝트는 정적 익스포트다 |
| Build command          | `npm run build`                                                                   |
| Build output directory | `out`                                                                             |
| Node version           | 환경변수 `NODE_VERSION` = `24`                                                    |

`npm run build`는 데이터 검증 → `next build` → 익스포트 정리까지 수행한다.
데이터가 깨져 있으면 빌드가 실패하므로 깨진 데이터가 배포되지 않는다.

**확인**: 빌드 로그 마지막에 `3,845 files remain in out/`이 나오면 정상.

---

## 2. 프리뷰 URL 점검

`<project>.pages.dev`에서 확인할 것:

- [ ] `/` 접속 시 브라우저 언어에 맞는 로케일로 가는가 (일본어 브라우저면 `/ja/`)
- [ ] 언어를 직접 바꾼 뒤 `/`로 다시 오면 그 선택을 따르는가
- [ ] `/list` → `/ko/digimon/` 301
- [ ] 진화 경로 검색이 3개 언어에서 동작하는가
- [ ] `/ja/` 페이지에서 일본어가 시스템 폰트가 아닌 Pretendard로 렌더되는가
- [ ] 다크모드 토글이 새로고침 후에도 유지되는가
- [ ] 응답 헤더에 `Cache-Control`이 `_headers` 대로 붙는가

```bash
curl -sI https://<project>.pages.dev/font/PretendardVariable.woff2 | grep -i cache-control
# public, max-age=604800, stale-while-revalidate=2592000
```

로컬에서는 `_headers`/`_redirects`가 적용되지 않는다(`npx serve`는 이 파일들을 모른다).
**이 두 파일은 프리뷰에서 처음으로 실제 검증된다.**

---

## 3. DNS를 Cloudflare로 이관

도메인이 타 등록기관에 있으므로 네임서버 변경이 필요하다.

1. Cloudflare 대시보드 → **Add a site** → `digimonts.my`
2. Cloudflare가 기존 DNS 레코드를 자동으로 읽어온다. **목록이 현재 설정과 일치하는지 반드시 대조**한다.
   메일(MX), 인증(TXT/SPF/DKIM) 레코드가 빠지면 도메인 메일이 죽는다.
3. Cloudflare가 알려주는 네임서버 2개를 등록기관 관리 페이지에서 설정
4. 전파 대기 (보통 수십 분, 최대 24시간)

**확인**:

```bash
nslookup -type=NS digimonts.my
# Cloudflare 네임서버가 나오면 완료
```

이관 중에도 기존 A/CNAME 레코드가 그대로 복사돼 있으므로 사이트는 계속 뜬다.

---

## 4. Web Analytics

`@vercel/analytics`는 Vercel 밖에서는 아무것도 측정하지 않으므로 교체 대상이다.
**두 방법 중 하나만** 쓴다. 둘 다 켜면 조회수가 두 배로 잡힌다.

- **A안 (권장)**: Pages 프로젝트 설정 → Web Analytics → Enable.
  Cloudflare가 엣지에서 beacon을 주입한다. 코드 변경 없음.
- **B안**: 토큰을 발급해 Pages 환경변수 `NEXT_PUBLIC_CF_BEACON_TOKEN`에 설정.
  [src/components/Analytics.tsx](src/components/Analytics.tsx)가 beacon 태그를 출력한다.
  프록시 뒤나 다른 호스트로 옮길 때 쓴다.

토큰을 설정하지 않으면 이 컴포넌트는 아무것도 렌더하지 않는다.

---

## 5. 커스텀 도메인 연결 — 여기서부터 운영에 영향

Pages 프로젝트 → **Custom domains** → **Set up a domain** → `digimonts.my`

Cloudflare가 CNAME 레코드를 자동 생성한다. **이 시점에 트래픽이 새 사이트로 넘어간다.**

직전에 확인할 것:

- [ ] 2번 체크리스트를 프리뷰에서 모두 통과했는가
- [ ] 기존 호스팅을 아직 내리지 않았는가 (롤백 경로 확보)

문제가 생기면 이 CNAME을 기존 호스팅 주소로 되돌리는 것이 가장 빠른 롤백이다.

### 루트 `/`의 언어 선택

`/`에는 페이지가 없다(모든 로케일이 접두사를 갖는다). 대신 빌드가 생성하는
[scripts/write-root-router.mjs](scripts/write-root-router.mjs)의 `index.html`이
**이용자가 직접 고른 언어 → 브라우저 언어 → 한국어** 순으로 목적지를 정한다.

**이 판단은 루트에서만 한다.** 로케일 페이지에서 같은 일을 하면 en-US 로케일로 렌더하는
Googlebot이 `/ko/`에서 `/en/`으로 튕기고, `/ko/`는 x-default이자 사이트맵 최상위 페이지라
hreflang 작업이 통째로 무너진다. 구글의 다국어 가이드도 이 패턴을 경고한다.
`/ko/digimon/agumon/` 같은 딥링크는 누구에게나 한국어 그대로다.

`_redirects`에 있던 `/ → /ko/` 규칙은 이 파일로 대체됐다. 엣지 리다이렉트가 먼저 걸리면
`index.html`이 서빙될 기회 자체가 없으므로 둘은 공존할 수 없다.

### 정본 호스트는 에이펙스다

사이트는 `digimonts.my`에서 서비스되고, `search.digimonts.my`는 여기로 리다이렉트된다.

[src/lib/site.ts](src/lib/site.ts)의 `SITE_URL`이 그 사실을 담고 있으며, canonical·hreflang·
OG URL·사이트맵 1,434개·`robots.txt`의 sitemap 줄이 **전부 이 상수 하나에서 파생된다.**
정본 호스트를 옮기면 이 값부터 고쳐야 한다. 리다이렉트되는 주소를 가리키는 canonical은
스스로를 부정하는 신호이고, 그런 URL로 채워진 사이트맵은 Search Console에서
"페이지에 리디렉션이 있음"으로 전부 잡힌다.

---

## 6. 컷오버 후

### 리다이렉트 실동작

```bash
curl -sI https://digimonts.my/list | grep -i "^location\|^HTTP"
# HTTP/2 301
# location: /ko/digimon/
```

구 사이트의 `/list`가 색인돼 있으므로 이 301이 SEO 자산을 넘겨받는 통로다.

### Search Console

1. 속성이 이미 있다면 소유권 확인이 유지되는지 점검 (DNS TXT 방식이면 3번에서 레코드가 넘어왔는지 확인)
2. **Sitemaps** → `https://digimonts.my/sitemap.xml` 제출
   - 구 sitemap은 URL 2개였다. 새 sitemap은 **1,431개**다
3. URL 검사에서 `/ko/digimon/agumon/` 같은 상세 페이지를 직접 조회해 색인 요청
4. 색인 수가 늘어나는지 몇 주간 추적

### 기존 호스팅 정리

색인이 새 URL로 옮겨간 것을 확인한 뒤에 내린다. 서두를 이유가 없다.

---

## 7. Adsterra

**순서상 여기다.** 대부분의 광고 네트워크는 심사 대상 도메인에서 실제로 사이트가 서비스되고
있어야 승인한다. 5번(커스텀 도메인 연결)이 끝나기 전에 신청하지 않는다.

**ads.txt는 안 쓴다.** Adsterra 대시보드 자체가 "광고주가 이를 요구하지 않아 파일을 제공하지
않는다"고 명시하고 있다 — AdSense와 다른 부분이다.

**이 빌드가 광고 코드를 실제로 실행하는가만 환경 결정이다.** `NEXT_PUBLIC_ADS_ENABLED=true`
일 때만 켜진다. 승인되지 않은 도메인(프리뷰)에서 광고를 돌리는 것이 정책 위반이기 때문이다.
플래그가 꺼져 있으면 HTML에 광고 스크립트도 마크업도 없고 네트워크 요청도 나가지 않는다.

### 7-1. 광고 켜기

Adsterra 대시보드에서 존을 세 개 만든다:

- **배너(Banner) 728×90** — 데스크톱용
- **배너(Banner) 320×50** — 모바일용
- **Native Banner** — 위젯 레이아웃·폰트를 고르면 발급된다

리더보드(본문 최상단) 자리 하나가 배너 둘을 화면 폭에 따라 전환해서 쓰고, in-content(검색
폼과 결과 사이)·footer(디지몬 상세 페이지 하단)는 Native Banner 하나를 공유한다 — 홈 화면엔
footer 자리가 없고 상세 페이지엔 in-content 자리가 없어서 겹칠 일이 없다.
정적 익스포트라 환경변수는 빌드 시점에 박힌다. **값만 바꾸고 재배포하지 않으면 아무 일도 일어나지 않는다.**

| 변수                                            | 값        | 역할                 |
| ----------------------------------------------- | --------- | -------------------- |
| `NEXT_PUBLIC_ADS_ENABLED`                       | `true`    | 광고 코드 실행        |
| `NEXT_PUBLIC_ADSTERRA_LEADERBOARD_DESKTOP_KEY`  | 존 key    | 본문 최상단, 728×90   |
| `NEXT_PUBLIC_ADSTERRA_LEADERBOARD_MOBILE_KEY`   | 존 key    | 본문 최상단, 320×50   |
| `NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER_ID`      | `container-…` | in-content·footer |
| `NEXT_PUBLIC_ADSTERRA_NATIVE_SCRIPT_SRC`        | invoke.js URL | in-content·footer |

리더보드는 데스크톱·모바일 키 둘 다 있어야 켜진다 — 한쪽만 넣으면 반대쪽 화면 크기에서는
광고가 안 뜨는데 그걸 알아챌 방법이 없어서, [lib/ads.ts](src/lib/ads.ts)가 아예 둘 다 없는
것과 동일하게 취급한다.

**확인**:

```bash
curl -s https://digimonts.my/ko/ | grep -o 'highperformanceformat\|container-'
```

### 7-2. 주의할 것

- **프리뷰 배포(`*.pages.dev`)에는 `NEXT_PUBLIC_ADS_ENABLED`를 넣지 않는다.**
  Pages는 Production/Preview 환경변수를 따로 관리한다. 승인되지 않은 도메인에 광고를 띄우는 것은
  정책 위반이고, 계정 정지 사유다.
- **한 페이지에 배너 존을 두 개 이상 동시에 띄우지 않는다.** Adsterra 배너는 `atOptions`라는
  전역 변수를 초기화 직후 읽는 방식이라, 두 배너가 거의 동시에 로드되면 뒤의 설정이 앞의 것을
  덮어써서 광고가 깨지거나 엉뚱한 존이 뜬다. 지금 구조는 리더보드 하나만 배너를 쓰고
  나머지는 Native Banner(다른 렌더링 방식, 충돌 없음)로 두도록 짜여 있다 — 새 배너 자리를
  추가할 땐 이 제약을 먼저 확인한다.
- **Native Banner의 실제 높이가 예약해둔 값(100px/90px)과 다를 수 있다.** 배너와 달리
  고정 픽셀 크기가 없는 형식이라 [AdSlot.tsx](src/components/ads/AdSlot.tsx)는 이 값을
  잘라내지 않고 자라도록(`min-block-size`) 열어뒀다 — 실제로 배포해서 렌더된 높이를
  보고 예약 값을 맞춰 조정한다.
- **"Show adult ads" 존 설정은 켜지 않는 걸 권한다.** Adsterra 대시보드에 성인 광고
  허용 시 CPM이 오른다는 안내가 있는데, 디지몬은 아동·가족 대상 IP라 브랜드 리스크가
  수익보다 크다고 판단했다. 코드와는 무관한 Adsterra 쪽 설정이니 계정에서 직접 확인한다.
- **EEA·영국·스위스 트래픽에 대한 동의 관리(CMP)는 현재 없다.** AdSense는 대시보드에
  기본 제공 CMP가 있었지만 Adsterra는 그런 걸 자동으로 붙여주지 않는다. 3개 언어 사이트라
  해당 지역 방문자가 있을 수 있고, 지금 상태로는 GDPR 동의 요건을 채우지 못한다.
  실제 서비스에 반영하기 전에 별도 동의 배너를 붙이거나, 해당 지역에는 광고를 아예
  띄우지 않는 지역 차단(geofencing) 중 하나를 결정해야 한다.
- 자기 사이트 광고를 직접 클릭하지 않는다. 무효 트래픽으로 계정이 정지된다.

### 7-3. 개인정보처리방침

승인 요건이다. `/{locale}/privacy/`에 3개 언어로 준비돼 있고 푸터에서 링크된다
([src/app/[locale]/privacy/page.tsx](src/app/%5Blocale%5D/privacy/page.tsx)).

내용은 실제 동작에 맞춰 쓰여 있다 — Formspree(버그 신고), Cloudflare(호스팅·통계),
Adsterra(광고), localStorage 3개 키(`theme`, `announcement-dismissed`, `locale`), Ko-fi(외부 링크).
**데이터 흐름이 바뀌면 이 문서도 같이 고쳐야 한다.** 사실과 다른 방침은 없는 것보다 나쁘다.
위 EEA 동의 관리 항목이 해결되기 전까지는, 이 방침도 "별도로 동의를 요청한다"고 주장하지
않는다 — 실제로 그런 절차가 없기 때문이다.

본문은 `src/messages/{ko,en,ja}.json`의 `privacy` 네임스페이스에 있다.
최종 수정일도 메시지 안에 직접 적혀 있다(`privacy.updated`) — `Intl`로 날짜를 만들면
서브셋 폰트에 없는 한자(年月日)가 나오기 때문이다. 방침을 고치면 3개 언어의 날짜도 함께 갱신한다.

일본어 문구를 수정한 뒤에는 서브셋을 다시 만들어야 한다:

```bash
npm run fonts:subset && npm run check:fonts
```

---

## 8. 컷오버 후 `main` 정리

프로덕션이 안정되면:

```bash
git checkout main
git merge renewal/nextjs
git push
```

Pages 프로젝트의 Production branch를 `main`으로 바꾼다.

`legacy/`는 이 시점까지 참조용으로 남겨둔다. 삭제는 별도 커밋으로 한다.

---

## 배포 전 로컬 검증

```bash
npm run build          # 데이터 검증 + 익스포트 + 정리
npx serve out -p 4173  # 아래 검사들이 이 서버를 대상으로 한다

npm run check:seo         # canonical / hreflang / sitemap / 중복 title
npm run check:responsive  # 320~1280px 레이아웃 및 탭 타겟
npm run check:fonts       # 서브셋 커버리지와 unicode-range 정합성
npm run check:assets      # 로케일별 폰트 요청, 폴백 렌더, 아이콘 응답
npm run check:admin       # 편집기 실동작 (자체적으로 서버를 띄운다)
npm test                  # 63개
npm run lint && npm run typecheck
```

`_headers`와 `_redirects`만은 로컬에서 검증할 수 없다. 2번 단계에서 확인한다.
