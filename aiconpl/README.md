# AICONPL 랜딩페이지

HTML · CSS · JS 만으로 만든 정적 사이트입니다. 빌드 도구·프레임워크가 없어
**GitHub Pages 에 파일만 올리면 바로 동작합니다.**

---

## 1. 바로 열어 보기

`index.html` 을 더블클릭하면 열립니다. 다만 영상과 폼 때문에
**로컬 서버로 여는 쪽을 권합니다.**

```bash
cd aiconpl
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080
```

---

## 2. 폴더 구조

```
aiconpl/
├─ index.html              ← 모든 문구가 여기 있습니다
├─ css/
│  ├─ base.css             색·글꼴·여백 토큰 (색을 바꾸려면 여기)
│  └─ style.css            섹션별 디자인
├─ js/
│  ├─ config.js            ★ 설정 (Apps Script 주소, 지도 좌표, 전화번호, 지표 숫자)
│  ├─ main.js              네비·캐러셀·탭·팝업·카운트업
│  ├─ map.js               네이버 지도
│  └─ form.js              문의 폼 → Apps Script 전송
├─ assets/
│  ├─ video/hero.mp4 · hero.webm
│  └─ img/hero-poster.jpg · logo-light.png · logo-dark.png
└─ apps-script/Code.gs     ★ 구글 스프레드시트에 붙여넣을 코드
```

---

## 3. 어디를 고치면 되나

| 바꿀 것 | 파일 | 위치 |
|---|---|---|
| **문구 전체** | `index.html` | 섹션마다 `<!-- ══ 번호. 이름 ══ -->` 주석으로 구분되어 있습니다 |
| **브랜드 색** | `css/base.css` | 맨 위 `:root` 의 `--brand`, `--accent` |
| **전화번호·이메일** | `js/config.js` | `contact` — 고치면 상단·하단 모두 바뀝니다 |
| **지표 숫자** | `js/config.js` | `stats` — 스크롤하면 0부터 올라갑니다 |
| **폼 업종 목록** | `js/config.js` | `formOptions` — 서비스 탭별로 다르게 나옵니다 |
| **고객사 로고** | `js/main.js` | 위쪽 `LOGOS` 배열 |
| **배경 영상** | `assets/video/` | 아래 4절 참고 |

### 로고 파일

| 파일 | 용도 |
|---|---|
| `logo-light.png` | 어두운 배경용 (글자 흰색 + AI 주황) — 상단·하단에서 사용 중 |
| `logo-dark.png` | 밝은 배경용 (글자 검정 + AI 주황) |

---

## 4. 배경 영상 교체

`assets/video/` 의 `hero.mp4` 와 `hero.webm` 을 바꾸면 됩니다.
**5MB 이하로 줄이고, 포스터 이미지를 꼭 같이 바꾸십시오.**
포스터가 없으면 영상이 뜨기 전까지 검은 화면이 보입니다.

```bash
# mp4 압축
ffmpeg -i 원본.mp4 -c:v libx264 -crf 28 -preset fast -an -movflags +faststart hero.mp4

# webm (용량이 절반 수준이라 먼저 로드됩니다)
ffmpeg -i 원본.mp4 -c:v libvpx-vp9 -crf 36 -b:v 0 -an hero.webm

# 포스터 (영상 3초 지점)
ffmpeg -i 원본.mp4 -ss 3 -vframes 1 ../img/hero-poster.jpg
```

`-an` 은 소리 제거입니다. 배경 영상은 어차피 음소거로 재생되므로 용량만 차지합니다.

---

## 5. 구글 Apps Script 연결 (문의 저장)

### 5-1. 스프레드시트 쪽

1. 구글 스프레드시트를 새로 만듭니다
2. **확장 프로그램 → Apps Script**
3. `apps-script/Code.gs` 내용을 **전부 붙여넣습니다**
4. 맨 위 `SETTINGS` 를 수정합니다

```js
var SETTINGS = {
  SHEET_NAME: '문의접수',
  NOTIFY_EMAIL: 'you@company.com',   // 접수되면 메일 알림 (비우면 안 보냄)
  DEDUPE_MINUTES: 3                  // 같은 번호 중복 접수 차단 시간
};
```

5. 저장 → **배포 → 새 배포 → 유형 "웹 앱"**
   - 실행 계정 : **나**
   - 액세스 권한 : **모든 사용자** ← 이 값이 아니면 동작하지 않습니다
6. 처음 배포할 때 권한 승인 창이 뜹니다. "고급 → 안전하지 않음(이동)" 을 눌러 승인하십시오
7. 발급된 URL(`.../exec`)을 복사합니다

### 5-2. 사이트 쪽

`js/config.js` 한 줄만 고치면 끝입니다.

```js
FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycb..../exec',
```

비워 두면 **데모 모드**로 동작합니다. 전송되지 않고 브라우저 콘솔에만 찍힙니다.

### 5-3. 동작 확인

- Apps Script 편집기에서 `testInsert` 함수를 실행 → 시트에 테스트 행이 들어오는지 확인
- 발급받은 URL 을 브라우저 주소창에 그대로 붙여넣기 → `{"ok":true, ...}` 가 보이면 정상

### 들어오는 항목

접수시각 · 서비스 · 업체명 · 휴대폰번호 · 업종 · 예산범위 · 문의내용 · 동의 ·
유입경로 · 페이지 · UA · 처리상태

**코드를 고친 뒤에는 "새 배포"를 다시 해야 반영됩니다.**

---

## 6. 네이버 지도 연결

지금은 회사 주소가 적힌 자리표시자가 보입니다. 실제 지도를 띄우려면:

1. [네이버 클라우드 플랫폼](https://console.ncloud.com) → **Maps → Web Dynamic Map** 신청
2. **Web 서비스 URL** 에 배포 도메인을 등록 (예: `https://아이디.github.io`)
   - 로컬 테스트용으로 `http://localhost:8080` 도 같이 등록해 두면 편합니다
3. 발급된 Client ID 를 `js/config.js` 에 입력

```js
map: {
  naverMapClientId: '여기에_발급받은_ID',
  lat: 37.5172,            // 회사 위도
  lng: 127.0473,           // 회사 경도
  zoom: 16,
  markerTitle: 'AICONPL',
  address: '서울특별시 강남구 테헤란로 000'
}
```

좌표는 [네이버 지도](https://map.naver.com)에서 위치를 우클릭하면 확인할 수 있습니다.

지도는 **플랫폼 기능 캐러셀의 2번 슬라이드**에 들어갑니다.

---

## 7. GitHub Pages 배포

```bash
git init
git add .
git commit -m "AICONPL 랜딩페이지"
git branch -M main
git remote add origin https://github.com/아이디/저장소.git
git push -u origin main
```

GitHub 저장소 → **Settings → Pages → Source: main / (root)** → Save.
1~2분 뒤 `https://아이디.github.io/저장소/` 에서 열립니다.

> 영상 파일이 1MB 가 넘으므로 Git LFS 는 필요 없지만, 저장소가 조금 무거워집니다.

---

## 8. 공개 전 체크리스트

내용을 그대로 두고 올리면 사실과 다른 표기가 됩니다. **반드시 확인하십시오.**

- [ ] `js/config.js` 의 `stats` 를 **실제 수치**로 교체 (지금은 전부 0)
- [ ] 히어로 제목의 "No.1" — 근거가 없으면 삭제
- [ ] 요약 지표 4칸 (`국내 1등 플랫폼`, `KOSDAQ`, `15Y+`, `80,000+`) — 해당 없으면 교체
- [ ] 성공사례 9개 — 실제 사례로 교체 (지금은 A사~I사)
- [ ] 로고월 — 실제 고객사 로고로 교체. **동의 없이 타사 로고를 쓰면 안 됩니다**
- [ ] 푸터 사업자 정보 — 상호·대표자·사업자번호·통신판매업신고번호·주소
      (전자상거래법상 의무 표기입니다)
- [ ] 개인정보처리방침 별도 페이지 작성 후 푸터 링크 연결
- [ ] 전화번호·이메일 (`js/config.js`)
- [ ] 파트너 섹션의 인증 2종 — 실제 보유한 것만 남기기

---

## 9. 구조 메모

새로 합류한 개발자를 위한 규칙입니다.

**화면이 갱신되는 곳은 `render` 가 아니라 각 모듈 안입니다.** 이 사이트는 정적 HTML 이고
JS 는 동작만 붙입니다. 문구를 고치려면 JS 가 아니라 `index.html` 을 보십시오.

**고정 요소가 세 개(상단 네비 · 하단 바 · 우하단 팝업)라 충돌 규칙을 두었습니다.**
`js/main.js` 의 `initOverlays()` 에 모여 있습니다.

- 하단 바 : 히어로를 벗어나면 등장, 문의 폼이 보이면 사라짐
- 팝업 : 3초 뒤 등장, 닫으면 `localStorage` 에 기억
- 데스크톱에서 팝업이 떠 있으면 하단 바는 띄우지 않음
- 모바일에서는 팝업을 아예 숨기고 하단 바만 (CSS `@media (max-width:900px)`)

이걸 풀면 모바일에서 화면 절반이 가려집니다.

**폼 검증은 `js/form.js` 한 곳에 있습니다.** 동의 체크 없이는 전송되지 않고,
오류는 `alert` 가 아니라 각 입력칸 아래에 표시됩니다.

**허니팟(`#website`)은 사람에게 보이지 않는 입력칸입니다.** 봇이 채우면
서버가 성공처럼 응답하고 조용히 버립니다. 지우지 마십시오.
