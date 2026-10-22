/** ============================================================
 *  AICONPL — 문의 접수 백엔드 (Google Apps Script)
 *  ------------------------------------------------------------
 *  설치 순서
 *   1) 구글 스프레드시트 새로 만들기
 *   2) 확장 프로그램 → Apps Script → 이 코드를 전부 붙여넣기
 *   3) 아래 SETTINGS 를 본인 값으로 수정
 *   4) 저장 → 배포 → 새 배포 → 유형 "웹 앱"
 *        · 실행 계정   : 나
 *        · 액세스 권한 : 모든 사용자          ← 반드시 이 값
 *   5) 발급된 웹앱 URL(.../exec)을 js/config.js 의 FORM_ENDPOINT 에 붙여넣기
 *
 *  ※ 코드를 고친 뒤에는 "새 배포"를 다시 해야 반영됩니다.
 *    (기존 배포 수정 시에는 버전을 "새 버전"으로 선택)
 *  ============================================================ */

var SETTINGS = {
  SHEET_NAME: '문의접수',

  // 접수 알림 메일 (비우면 보내지 않음). 쉼표로 여러 명 가능
  NOTIFY_EMAIL: '',

  // 같은 번호로 이 시간(분) 안에 또 들어오면 중복으로 보고 무시
  DEDUPE_MINUTES: 3
};

var HEADERS = [
  '접수시각', '서비스', '업체명', '휴대폰번호', '업종',
  '예산범위', '문의내용', '동의', '유입경로', '페이지', 'UA', '처리상태'
];

/* ---------- 웹앱 진입점 ---------- */
function doPost(e) {
  try {
    var data = parseBody_(e);
    if (!data) return json_({ ok: false, error: 'EMPTY_BODY' });

    // 필수값 검사
    if (!data.company || !data.phone) return json_({ ok: false, error: 'REQUIRED' });
    if (data.agree !== 'Y')           return json_({ ok: false, error: 'NO_CONSENT' });

    // 봇 차단: 숨은 필드가 채워져 있으면 성공처럼 응답하고 버린다
    if (data.website) return json_({ ok: true });

    var sheet = getSheet_();

    if (isDuplicate_(sheet, data.phone)) {
      return json_({ ok: true, dedupe: true });
    }

    sheet.appendRow([
      new Date(),
      data.service  || '',
      data.company  || '',
      "'" + String(data.phone || ''),   // 앞자리 0 보존
      data.category || '',
      data.budget   || '',
      data.message  || '',
      data.agree    || '',
      data.referrer || '',
      data.pageUrl  || '',
      data.ua       || '',
      '미처리'
    ]);

    notify_(data);
    return json_({ ok: true });

  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

/* 브라우저로 URL 을 직접 열었을 때 동작 확인용 */
function doGet() {
  return json_({ ok: true, service: 'AICONPL lead endpoint', time: new Date().toISOString() });
}

/* ---------- 내부 함수 ---------- */

function parseBody_(e) {
  if (!e) return null;
  // text/plain 으로 보낸 JSON
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (x) { /* 폼 전송일 수 있음 */ }
  }
  // application/x-www-form-urlencoded 대비
  if (e.parameter && Object.keys(e.parameter).length) return e.parameter;
  return null;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SETTINGS.SHEET_NAME);

  if (!sh) {
    sh = ss.insertSheet(SETTINGS.SHEET_NAME);
    sh.appendRow(HEADERS);
    var head = sh.getRange(1, 1, 1, HEADERS.length);
    head.setFontWeight('bold').setBackground('#6C2BF2').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);  // 접수시각
    sh.setColumnWidth(3, 160);  // 업체명
    sh.setColumnWidth(7, 320);  // 문의내용
    sh.setColumnWidth(11, 120); // UA
  }
  return sh;
}

function isDuplicate_(sheet, phone) {
  var mins = SETTINGS.DEDUPE_MINUTES;
  if (!mins) return false;

  var last = sheet.getLastRow();
  if (last < 2) return false;

  var from = Math.max(2, last - 29);           // 최근 30행만 확인
  var rows = sheet.getRange(from, 1, last - from + 1, 4).getValues();
  var limit = Date.now() - mins * 60 * 1000;
  var target = String(phone).replace(/[^0-9]/g, '');

  for (var i = 0; i < rows.length; i++) {
    var at = rows[i][0];
    var p  = String(rows[i][3]).replace(/[^0-9]/g, '');
    if (p === target && at instanceof Date && at.getTime() > limit) return true;
  }
  return false;
}

function notify_(d) {
  if (!SETTINGS.NOTIFY_EMAIL) return;
  var subject = '[AICONPL] 상담 문의 — ' + (d.company || '');
  var body =
    '새 상담 문의가 접수되었습니다.\n\n' +
    '서비스    : ' + (d.service  || '-') + '\n' +
    '업체명    : ' + (d.company  || '-') + '\n' +
    '휴대폰    : ' + (d.phone    || '-') + '\n' +
    '업종      : ' + (d.category || '-') + '\n' +
    '예산범위  : ' + (d.budget   || '-') + '\n' +
    '문의내용  : ' + (d.message  || '-') + '\n\n' +
    '유입경로  : ' + (d.referrer || '-') + '\n' +
    '페이지    : ' + (d.pageUrl  || '-') + '\n' +
    '접수시각  : ' + new Date().toLocaleString('ko-KR') + '\n\n' +
    '시트: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl();

  try {
    MailApp.sendEmail(SETTINGS.NOTIFY_EMAIL, subject, body);
  } catch (err) {
    console.error('메일 발송 실패: ' + err);   // 메일이 실패해도 접수는 유지
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- 설치 후 한 번 실행해 보는 테스트 ---------- */
function testInsert() {
  var res = doPost({
    postData: {
      contents: JSON.stringify({
        service: '지역/매장', company: '테스트상호', phone: '01012345678',
        category: '요식업', budget: '100–300만원', message: '테스트 문의입니다.',
        agree: 'Y', pageUrl: 'local-test', referrer: '', ua: 'test'
      })
    }
  });
  Logger.log(res.getContent());
}
