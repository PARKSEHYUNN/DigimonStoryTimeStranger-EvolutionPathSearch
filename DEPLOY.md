# 배포 절차 — Cloudflare Pages

`search.digimonts.my`를 현재 호스팅에서 Cloudflare Pages로 옮기는 순서다.

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

- [ ] `/` → `/ko/`로 이동하는가 (`_redirects` 302)
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

Pages 프로젝트 → **Custom domains** → **Set up a domain** → `search.digimonts.my`

Cloudflare가 CNAME 레코드를 자동 생성한다. **이 시점에 트래픽이 새 사이트로 넘어간다.**

직전에 확인할 것:

- [ ] 2번 체크리스트를 프리뷰에서 모두 통과했는가
- [ ] 기존 호스팅을 아직 내리지 않았는가 (롤백 경로 확보)

문제가 생기면 이 CNAME을 기존 호스팅 주소로 되돌리는 것이 가장 빠른 롤백이다.

---

## 6. 컷오버 후

### 리다이렉트 실동작

```bash
curl -sI https://search.digimonts.my/list | grep -i "^location\|^HTTP"
# HTTP/2 301
# location: /ko/digimon/
```

구 사이트의 `/list`가 색인돼 있으므로 이 301이 SEO 자산을 넘겨받는 통로다.

### Search Console

1. 속성이 이미 있다면 소유권 확인이 유지되는지 점검 (DNS TXT 방식이면 3번에서 레코드가 넘어왔는지 확인)
2. **Sitemaps** → `https://search.digimonts.my/sitemap.xml` 제출
   - 구 sitemap은 URL 2개였다. 새 sitemap은 **1,431개**다
3. URL 검사에서 `/ko/digimon/agumon/` 같은 상세 페이지를 직접 조회해 색인 요청
4. 색인 수가 늘어나는지 몇 주간 추적

### 기존 호스팅 정리

색인이 새 URL로 옮겨간 것을 확인한 뒤에 내린다. 서두를 이유가 없다.

---

## 7. Google AdSense

**순서상 여기다.** 애드센스는 심사 대상 도메인에서 실제로 사이트가 서비스되고 있어야 승인한다.
5번(커스텀 도메인 연결)이 끝나기 전에 신청하면 "사이트에 연결할 수 없음"으로 반려된다.

코드는 준비돼 있다. `NEXT_PUBLIC_ADSENSE_CLIENT`가 비어 있으면 **광고와 관련된 것이 아무것도 나가지 않는다** —
로더 스크립트도, 네트워크 요청도, `ads.txt`도 없다. 지금 상태가 그렇다.
값을 넣는 순간 [src/components/ads/AdSlot.tsx](src/components/ads/AdSlot.tsx)가 잡아둔 자리에 광고 단위가 들어간다.

### 7-1. 계정 신청과 사이트 확인

1. [AdSense 가입](https://adsense.google.com) → 사이트에 `search.digimonts.my` 추가
2. 게시자 ID(`ca-pub-` + 16자리)를 Pages 환경변수에 설정하고 **재배포**

   | 변수                         | 값                        |
   | ---------------------------- | ------------------------- |
   | `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-XXXXXXXXXXXXXXXX` |

   정적 익스포트라 환경변수는 빌드 시점에 HTML로 박힌다. **값만 바꾸고 재배포하지 않으면 아무 일도 일어나지 않는다.**

3. AdSense가 요구하는 확인 스니펫이 곧 이 변수가 출력하는 로더다. 별도로 붙여넣을 것은 없다.

   ```bash
   curl -s https://search.digimonts.my/ko/ | grep -o 'adsbygoogle.js?client=[^"]*'
   # adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX
   ```

4. 대시보드에서 **검토 요청**. 승인까지 보통 며칠 ~ 2주.

### 7-2. `ads.txt`

`ca-pub-` 값이 설정돼 있으면 빌드가 `out/ads.txt`를 자동 생성한다([scripts/write-ads-txt.mjs](scripts/write-ads-txt.mjs)).
따로 만들어 커밋할 필요가 없고, 게시자 ID가 코드와 어긋날 일도 없다.

```bash
curl -s https://search.digimonts.my/ads.txt
# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

`robots.txt`의 `Disallow: /*.txt$`에 걸리지 않도록 `Allow: /ads.txt`가 명시돼 있다.
크롤링이 막힌 `ads.txt`는 없는 것과 같이 취급되고, 그러면 입찰 단가가 떨어진다.

### 7-3. 광고 단위 연결

승인 후 대시보드에서 **디스플레이 광고** 단위를 만들고 슬롯 ID를 위치별로 넣는다.

| 변수                                   | 위치                | 노출 페이지 |
| -------------------------------------- | ------------------- | ----------- |
| `NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD` | 본문 최상단         | 전체        |
| `NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT`  | 검색 폼과 결과 사이 | 메인        |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER`      | 상세 페이지 하단    | 디지몬 상세 |

**비어 있는 위치는 플레이스홀더로 남는다.** 레이아웃을 건드리지 않고 특정 위치만 끄고 켤 수 있다는 뜻이다.
세 개를 한 번에 켜지 말고 리더보드 하나로 시작해 수익과 이탈률을 같이 보는 편이 낫다.

**확인**:

```bash
curl -s https://search.digimonts.my/ko/ | grep -o 'data-ad-slot="[^"]*"'
```

### 7-4. 주의할 것

- **프리뷰 배포(`*.pages.dev`)에는 환경변수를 넣지 않는다.** Pages는 Production/Preview 환경변수를 따로 관리한다.
  승인되지 않은 도메인에 광고를 띄우는 것은 정책 위반이고, 계정 정지 사유다.
- **자동 광고(Auto ads)는 켜지 않는 편이 좋다.** 구글이 임의 위치에 삽입하면서 레이아웃을 밀어내
  CLS가 무너진다. 이 리뉴얼이 [AdSlot](src/components/ads/AdSlot.tsx)으로 높이를 미리 잡아둔 이유가 그거다.
- **EEA·영국 트래픽에는 동의 관리 플랫폼(CMP)이 의무다.** 3개 언어 사이트이므로 해당될 수 있다.
  AdSense 대시보드의 기본 제공 CMP를 켜면 된다.
- 자기 사이트 광고를 직접 클릭하지 않는다. 무효 트래픽으로 계정이 정지된다.

### 7-5. 개인정보처리방침

승인 요건이다. `/{locale}/privacy/`에 3개 언어로 준비돼 있고 푸터에서 링크된다
([src/app/[locale]/privacy/page.tsx](src/app/%5Blocale%5D/privacy/page.tsx)).

내용은 실제 동작에 맞춰 쓰여 있다 — Formspree(버그 신고), Cloudflare(호스팅·통계),
Google AdSense(광고), localStorage 2개 키(`theme`, `announcement-dismissed`), Ko-fi(외부 링크).
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
