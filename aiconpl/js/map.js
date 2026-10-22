/* ============================================================
   AICONPL — 지도 (네이버 지도 API 연결 지점)
   ------------------------------------------------------------
   · config.js 의 map.naverMapClientId 가 비어 있으면
     정적 플레이스홀더를 그립니다. (지금 상태)
   · Client ID 를 넣으면 스크립트를 자동으로 불러와 실제 지도를 띄웁니다.
     발급: https://console.ncloud.com → Maps → Web Dynamic Map
           Web 서비스 URL 에 배포 도메인을 등록해야 동작합니다.
   ============================================================ */
(function () {
  'use strict';

  var CFG = (window.CONFIG && window.CONFIG.map) || {};
  var box = document.getElementById('naverMap');
  if (!box) return;

  var mapInstance = null;

  /* ---------- 플레이스홀더 ---------- */
  function placeholder(msg) {
    box.innerHTML =
      '<div class="mapbox__ph">' +
        '<b>' + (CFG.markerTitle || 'AICONPL') + '</b>' +
        '<span>' + (CFG.address || '회사 위치') + '</span>' +
        '<code>' + msg + '</code>' +
      '</div>';
  }

  /* ---------- 실제 지도 ---------- */
  function draw() {
    if (!window.naver || !window.naver.maps) { placeholder('네이버 지도 스크립트를 불러오지 못했습니다'); return; }
    box.innerHTML = '';
    var pos = new naver.maps.LatLng(CFG.lat, CFG.lng);

    mapInstance = new naver.maps.Map(box, {
      center: pos,
      zoom: CFG.zoom || 16,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
    });

    var marker = new naver.maps.Marker({ position: pos, map: mapInstance, title: CFG.markerTitle || '' });

    var info = new naver.maps.InfoWindow({
      content:
        '<div style="padding:10px 14px;font-size:13px;line-height:1.6;font-family:Pretendard,sans-serif">' +
          '<b>' + (CFG.markerTitle || '') + '</b><br>' +
          '<span style="color:#666">' + (CFG.address || '') + '</span>' +
        '</div>',
      borderWidth: 0,
      disableAnchor: false
    });
    info.open(mapInstance, marker);
    naver.maps.Event.addListener(marker, 'click', function () {
      if (info.getMap()) info.close(); else info.open(mapInstance, marker);
    });
  }

  /* ---------- 스크립트 로드 ---------- */
  function load() {
    if (!CFG.naverMapClientId) {
      placeholder('config.js 의 naverMapClientId 를 입력하면 지도가 표시됩니다');
      return;
    }
    if (window.naver && window.naver.maps) { draw(); return; }

    var s = document.createElement('script');
    s.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' +
            encodeURIComponent(CFG.naverMapClientId);
    s.async = true;
    s.onload = draw;
    s.onerror = function () { placeholder('지도 스크립트 로드 실패 — Client ID 와 등록 도메인을 확인하십시오'); };
    document.head.appendChild(s);
  }

  /* 슬라이드가 숨겨진 상태에서 생성되면 크기가 0이 되므로 다시 그려 준다 */
  window.AICONPL_MAP = {
    refresh: function () {
      if (mapInstance && window.naver && naver.maps.Event) {
        naver.maps.Event.trigger(mapInstance, 'resize');
        mapInstance.setCenter(new naver.maps.LatLng(CFG.lat, CFG.lng));
      }
    },
    instance: function () { return mapInstance; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
