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

## 7. Google AdSense

**순서상 여기다.** 애드센스는 심사 대상 도메인에서 실제로 사이트가 서비스되고 있어야 승인한다.
5번(커스텀 도메인 연결)이 끝나기 전에 신청하면 "사이트에 연결할 수 없음"으로 반려된다.

**게시자 ID와 광고 실행은 분리돼 있다.** 두 가지는 성격이 다르다.

- **누가 이 도메인의 광고 지면을 팔 수 있는가** — 공개 정보다. [src/lib/ads.ts](src/lib/ads.ts)에
  상수로 커밋돼 있고, `/ads.txt`는 **설정 없이 모든 배포에서 자동 생성된다.**
- **이 빌드가 광고 코드를 실제로 실행하는가** — 환경 결정이다. `NEXT_PUBLIC_ADSENSE_ENABLED=true`
  일 때만 켜진다. 승인되지 않은 도메인(프리뷰)에서 광고를 돌리는 것이 정책 위반이기 때문이다.

플래그가 꺼져 있으면 HTML에 로더도 광고 마크업도 없고 네트워크 요청도 나가지 않는다.
(클라이언트 청크에 `AdUnit` 코드 자체는 들어가지만 렌더되지 않아 실행되지 않는다.)

### 7-1. `ads.txt` — 이미 나가고 있다

빌드가 [scripts/write-ads-txt.mjs](scripts/write-ads-txt.mjs)로 `out/ads.txt`를 생성한다.
페이지 코드와 같은 상수를 읽으므로 스크립트 태그의 ID와 어긋날 수 없다.

```bash
curl -s https://digimonts.my/ads.txt
# google.com, pub-1963786647016806, DIRECT, f08c47fec0942fa0
```

경로는 소문자 `/ads.txt`다. 구글이 가져가는 경로가 그것이다.

`robots.txt`의 `Disallow: /*.txt$`에 걸리지 않도록 `Allow: /ads.txt`가 명시돼 있다.
크롤링이 막힌 `ads.txt`는 없는 것과 같이 취급되고, 그러면 입찰 단가가 떨어진다.

### 7-2. 계정 신청과 사이트 소유권 확인

1. [AdSense 가입](https://adsense.google.com) → 사이트에 `digimonts.my` 추가
2. 확인 방식은 **Ads.txt 스니펫**을 고르면 된다. 위 파일이 이미 그 내용을 내보내고 있어
   추가 작업이 없다. 루트 `/`가 `/ko/`로 302 리다이렉트되는데, `/ads.txt`는 그 경로를
   거치지 않고 직접 응답하므로 리다이렉트 변수도 없다.
3. **코드 스니펫** 방식을 쓰려면 아래 7-3의 플래그를 먼저 켜야 한다.
   그러면 AdSense가 붙여넣으라는 것과 동일한 로더가 `<head>`에 출력된다.
4. 대시보드에서 **검토 요청**. 승인까지 보통 며칠 ~ 2주.

### 7-3. 광고 켜기

승인 후 대시보드에서 **디스플레이 광고** 단위를 만들고, 플래그와 슬롯 ID를 넣은 뒤 **재배포**한다.
정적 익스포트라 환경변수는 빌드 시점에 박힌다. **값만 바꾸고 재배포하지 않으면 아무 일도 일어나지 않는다.**

| 변수                                   | 값      | 역할                |
| -------------------------------------- | ------- | ------------------- |
| `NEXT_PUBLIC_ADSENSE_ENABLED`          | `true`  | 광고 코드 실행      |
| `NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD` | 슬롯 ID | 본문 최상단 (전체)  |
| `NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT`  | 슬롯 ID | 검색 폼과 결과 사이 |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER`      | 슬롯 ID | 상세 페이지 하단    |

플래그만 켜고 슬롯을 비워두면 로더만 나가고 광고는 안 나온다 — 코드 스니펫 확인 단계에 쓰는 상태다.

**비어 있는 위치는 플레이스홀더로 남는다.** 레이아웃을 건드리지 않고 특정 위치만 끄고 켤 수 있다는 뜻이다.
세 개를 한 번에 켜지 말고 리더보드 하나로 시작해 수익과 이탈률을 같이 보는 편이 낫다.

**확인**:

```bash
curl -s https://digimonts.my/ko/ | grep -o 'data-ad-slot="[^"]*"'
```

### 7-4. 주의할 것

- **프리뷰 배포(`*.pages.dev`)에는 `NEXT_PUBLIC_ADSENSE_ENABLED`를 넣지 않는다.**
  Pages는 Production/Preview 환경변수를 따로 관리한다. 승인되지 않은 도메인에 광고를 띄우는 것은
  정책 위반이고, 계정 정지 사유다. (`ads.txt`는 프리뷰에도 나가지만 그건 무해하다 —
  판매자를 선언하는 것과 광고를 돌리는 것은 다른 일이다.)
- **자동 광고(Auto ads)는 켜지 않는 편이 좋다.** 구글이 임의 위치에 삽입하면서 레이아웃을 밀어내
  CLS가 무너진다. 이 리뉴얼이 [AdSlot](src/components/ads/AdSlot.tsx)으로 높이를 미리 잡아둔 이유가 그거다.
- **EEA·영국 트래픽에는 동의 관리 플랫폼(CMP)이 의무다.** 3개 언어 사이트이므로 해당될 수 있다.
  AdSense 대시보드의 기본 제공 CMP를 켜면 된다.
- 자기 사이트 광고를 직접 클릭하지 않는다. 무효 트래픽으로 계정이 정지된다.

### 7-5. 개인정보처리방침

승인 요건이다. `/{locale}/privacy/`에 3개 언어로 준비돼 있고 푸터에서 링크된다
([src/app/[locale]/privacy/page.tsx](src/app/%5Blocale%5D/privacy/page.tsx)).

내용은 실제 동작에 맞춰 쓰여 있다 — Formspree(버그 신고), Cloudflare(호스팅·통계),
Google AdSense(광고), localStorage 3개 키(`theme`, `announcement-dismissed`, `locale`), Ko-fi(외부 링크).
**데이터 흐름이 바뀌면 이 문서도 같이 고쳐야 한다.** 사실과 다른 방침은 없는 것보다 나쁘다.

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
