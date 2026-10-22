/* ============================================================
   AICONPL — 문의 폼 → 구글 Apps Script
   ------------------------------------------------------------
   Content-Type 을 text/plain 으로 보내 CORS 프리플라이트를 피합니다.
   (Apps Script 웹앱은 preflight(OPTIONS)에 응답하지 않습니다)
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };

  var form    = $('#leadForm');
  var tabsBox = $('#svcTabs');
  var svcVal  = $('#svcValue');
  var catSel  = $('#category');
  var result  = $('#formResult');
  var submit  = $('#submitBtn');
  if (!form) return;

  /* ---------- 1. 서비스 탭 → 업종 목록 연동 ---------- */
  function fillCategories(service) {
    var opts = (CFG.formOptions && CFG.formOptions[service]) || [];
    catSel.innerHTML = '<option value="">업종 선택</option>' +
      opts.map(function (o) { return '<option>' + o + '</option>'; }).join('');
  }

  if (tabsBox) {
    var tabs = Array.prototype.slice.call(tabsBox.querySelectorAll('button'));
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) {
          x.classList.toggle('is-on', x === t);
          x.setAttribute('aria-selected', String(x === t));
        });
        svcVal.value = t.textContent.trim();
        fillCategories(svcVal.value);
      });
    });
  }
  fillCategories(svcVal ? svcVal.value : '제품리뷰');

  /* ---------- 2. 개인정보 전문 토글 ---------- */
  var more = $('#agreeMore'), panel = $('#agreePanel');
  if (more && panel) {
    more.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var open = panel.hasAttribute('hidden');
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? '접기' : '보기';
    });
  }

  /* ---------- 3. 검증 ---------- */
  function setErr(name, msg) {
    var p = form.querySelector('[data-err="' + name + '"]');
    var f = form.querySelector('[name="' + name + '"]');
    if (p) p.textContent = msg || '';
    if (f && f.type !== 'checkbox') f.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validate() {
    var ok = true, first = null;
    var company = form.company.value.trim();
    var phone   = form.phone.value.replace(/[^0-9]/g, '');
    var cat     = form.category.value;
    var agree   = form.agree.checked;

    setErr('company', ''); setErr('phone', ''); setErr('category', ''); setErr('agree', '');

    if (!company)                       { setErr('company', '업체명을 입력해 주세요.'); ok = false; first = first || form.company; }
    if (!phone)                         { setErr('phone', '휴대폰번호를 입력해 주세요.'); ok = false; first = first || form.phone; }
    else if (phone.length < 9 || phone.length > 11) {
                                          setErr('phone', '숫자만 9~11자리로 입력해 주세요.'); ok = false; first = first || form.phone; }
    if (!cat)                           { setErr('category', '업종을 선택해 주세요.'); ok = false; first = first || form.category; }
    if (!agree)                         { setErr('agree', '개인정보 수집·이용에 동의해 주세요.'); ok = false; first = first || form.agree; }

    if (first && first.focus) first.focus();
    return ok;
  }

  /* 입력하면 그 항목의 오류 메시지를 지운다 */
  ['company', 'phone', 'category', 'agree'].forEach(function (n) {
    var el = form.elements[n];
    if (!el) return;
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input',
      function () { setErr(n, ''); });
  });

  /* 전화번호는 숫자만 */
  form.phone.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11);
  });

  /* ---------- 4. 전송 ---------- */
  function say(msg, kind) {
    result.textContent = msg;
    result.className = 'form__result ' + (kind || '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    say('', '');
    if (!validate()) { say('입력하지 않은 항목이 있습니다.', 'ng'); return; }

    var payload = {
      service:  svcVal.value,
      company:  form.company.value.trim(),
      phone:    form.phone.value.trim(),
      category: form.category.value,
      budget:   form.budget.value,
      message:  form.message.value.trim(),
      agree:    form.agree.checked ? 'Y' : 'N',
      website:  form.website ? form.website.value : '',   /* 허니팟 — 비어 있어야 정상 */
      pageUrl:  location.href,
      referrer: document.referrer || '',
      ua:       navigator.userAgent,
      at:       new Date().toISOString()
    };

    var url = CFG.FORM_ENDPOINT;

    /* 데모 모드 — 엔드포인트 미설정 */
    if (!url) {
      console.log('[AICONPL] 데모 모드 · 전송될 데이터:', payload);
      say('데모 모드입니다. config.js 의 FORM_ENDPOINT 를 설정하면 실제로 저장됩니다.', 'ok');
      return;
    }

    var label = submit.textContent;
    submit.disabled = true;
    submit.textContent = '전송 중…';

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },  /* preflight 회피 */
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          form.reset();
          fillCategories(svcVal.value);
          say('접수되었습니다. 담당자가 확인 후 연락드리겠습니다.', 'ok');
        } else {
          say('전송에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'ng');
        }
      })
      .catch(function (err) {
        console.error('[AICONPL] 전송 오류', err);
        say('전송에 실패했습니다. 전화(' + ((CFG.contact && CFG.contact.tel) || '') + ')로 문의해 주세요.', 'ng');
      })
      .finally(function () {
        submit.disabled = false;
        submit.textContent = label;
      });
  });
})();
