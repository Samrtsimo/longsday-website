/* ============================================================
   Longsday — Logistics Tools v2
   HS Code Local Search + Container / BL Tracking
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  //  HS CODE SEARCH ENGINE
  // ============================================================

  var hsData = null;        // parsed HS data array
  var hsSearchIndex = null; // { byCode: Map, byZh: [], byEn: [] }
  var hsLoaded = false;
  var hsLoading = false;
  var hsDebounceTimer = null;

  document.addEventListener('DOMContentLoaded', function () {

    // --- Tab switching ---
    var tabs = document.querySelectorAll('.tool-tab');
    var panels = document.querySelectorAll('.tool-panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.getAttribute('data-tool');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === target);
        });
      });
    });

    // --- HS Code Search ---
    var hsInput = document.getElementById('hs-input');
    var hsType = document.getElementById('hs-type');
    var hsResult = document.getElementById('hs-result');

    if (hsInput && hsResult) {
      hsInput.addEventListener('input', function () {
        clearTimeout(hsDebounceTimer);
        var query = this.value.trim();
        if (query.length >= 1) {
          hsDebounceTimer = setTimeout(function () { searchHS(query); }, 200);
        } else {
          showHSEmpty();
        }
      });
      hsInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          clearTimeout(hsDebounceTimer);
          searchHS(this.value.trim());
        }
      });
      // Load data on first focus
      hsInput.addEventListener('focus', function () {
        if (!hsLoaded && !hsLoading) loadHSData();
      });
    }

    // --- Container Tracking ---
    var trackType = document.getElementById('track-type');
    var trackNumber = document.getElementById('track-number');
    var trackSearch = document.getElementById('track-search');
    var trackResult = document.getElementById('track-result');

    if (trackSearch && trackNumber && trackResult) {
      trackSearch.addEventListener('click', function () {
        doTracking(trackType.value, trackNumber.value.trim());
      });
      trackNumber.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') doTracking(trackType.value, trackNumber.value.trim());
      });
    }
  });

  // ============================================================
  //  HS DATA LOADING & INDEXING
  // ============================================================

  function loadHSData() {
    if (hsLoading || hsLoaded) return;
    hsLoading = true;

    showHSLoading();

    var script = document.createElement('script');
    script.src = 'data/hs_data.js?v=2';
    script.onload = function () {
      if (typeof HS_DATA !== 'undefined' && HS_DATA.length) {
        hsData = HS_DATA;
        buildHSIndex();
        hsLoaded = true;
        hsLoading = false;

        // If there's already text in the input, search
        var input = document.getElementById('hs-input');
        if (input && input.value.trim()) {
          searchHS(input.value.trim());
        } else {
          showHSEmpty();
        }
      } else {
        hsLoading = false;
        showHSError('Data file loaded but appears empty.');
      }
    };
    script.onerror = function () {
      hsLoading = false;
      showHSError('Unable to load HS code database. Please try again later.');
    };
    document.head.appendChild(script);
  }

  function buildHSIndex() {
    var byCode = {};
    var allEntries = [];

    for (var i = 0; i < hsData.length; i++) {
      var entry = hsData[i];
      var code = entry[0];
      var nameZh = entry[1] || '';
      var nameEn = entry[2] || '';

      // Index by code (prefix match for 4,6,8,10 digit searches)
      byCode[code] = entry;

      // Collect for text search
      allEntries.push({ code: code, zh: nameZh, en: nameEn, idx: i });
    }

    hsSearchIndex = {
      byCode: byCode,
      all: allEntries
    };
  }

  // ============================================================
  //  HS SEARCH LOGIC
  // ============================================================

  function searchHS(query) {
    if (!query) { showHSEmpty(); return; }
    if (!hsLoaded) {
      loadHSData();
      return;
    }

    var results = [];
    var isNumeric = /^\d/.test(query);
    var q = query.toLowerCase();
    var qNum = query.replace(/[.\s-]/g, '');

    // 1. Exact code match
    if (hsSearchIndex.byCode[qNum]) {
      results.push(hsSearchIndex.byCode[qNum]);
    }

    // 2. Prefix code match (for partial codes)
    if (isNumeric && qNum.length >= 2) {
      var prefixMatches = [];
      for (var code in hsSearchIndex.byCode) {
        if (code.indexOf(qNum) === 0 && code !== qNum) {
          prefixMatches.push(hsSearchIndex.byCode[code]);
          if (prefixMatches.length >= 40) break;
        }
      }
      // Sort by code length (shorter = broader match first)
      prefixMatches.sort(function (a, b) { return a[0].length - b[0].length; });
      results = results.concat(prefixMatches);
    }

    // 3. Text search (Chinese + English) — only if not purely numeric or results < 10
    if (!isNumeric || results.length < 10) {
      var textMatches = [];
      var all = hsSearchIndex.all;
      for (var i = 0; i < all.length; i++) {
        if (all[i].zh.indexOf(query) !== -1 || all[i].en.toLowerCase().indexOf(q) !== -1) {
          // Don't duplicate code matches
          if (!hsSearchIndex.byCode[all[i].code] || results.indexOf(hsSearchIndex.byCode[all[i].code]) === -1) {
            textMatches.push(hsSearchIndex.byCode[all[i].code]);
            if (textMatches.length >= 30) break;
          }
        }
      }
      results = results.concat(textMatches);
    }

    // Deduplicate
    var seen = {};
    results = results.filter(function (r) {
      if (!r || seen[r[0]]) return false;
      seen[r[0]] = true;
      return true;
    });

    if (results.length === 0) {
      showHSNoResults(query);
    } else {
      showHSResults(results.slice(0, 40), query);
    }
  }

  // ============================================================
  //  HS RESULT DISPLAY
  // ============================================================

  function showHSLoading() {
    var result = document.getElementById('hs-result');
    if (!result) return;
    result.className = 'tool-result visible';
    result.innerHTML = '<div class="hs-loading">' +
      '<div class="hs-loading-spinner"></div>' +
      '<p data-lang="zh">正在加载 HS 编码数据库…</p>' +
      '<p data-lang="en">Loading HS Code database…</p>' +
      '</div>';
    window.applyI18n && window.applyI18n();
  }

  function showHSEmpty() {
    var result = document.getElementById('hs-result');
    if (!result) return;
    result.className = 'tool-result';
    result.innerHTML = '<div class="hs-placeholder">' +
      '<div class="hs-placeholder-icon">🔍</div>' +
      '<p data-lang="zh">输入 HS 编码（如 <strong>847130</strong>）或商品名称（如 <strong>笔记本电脑</strong>）开始查询</p>' +
      '<p data-lang="en">Enter an HS code (e.g., <strong>847130</strong>) or product name (e.g., <strong>laptop</strong>) to search</p>' +
      '<p class="hs-placeholder-hint" data-lang="zh">支持 4–10 位编码查询 · 模糊搜索 · 中英文关键词</p>' +
      '<p class="hs-placeholder-hint" data-lang="en">Supports 4–10 digit codes · Fuzzy search · Chinese & English keywords</p>' +
      '</div>';
    window.applyI18n && window.applyI18n();
  }

  function showHSError(msg) {
    var result = document.getElementById('hs-result');
    if (!result) return;
    result.className = 'tool-result visible';
    result.innerHTML = '<div class="hs-error">⚠️ ' + msg + '</div>';
  }

  function showHSNoResults(query) {
    var result = document.getElementById('hs-result');
    if (!result) return;
    result.className = 'tool-result visible';
    result.innerHTML = '<div class="hs-no-results">' +
      '<p data-lang="zh">未找到与 "<strong>' + escapeHTML(query) + '</strong>" 匹配的 HS 编码</p>' +
      '<p data-lang="en">No HS codes found matching "<strong>' + escapeHTML(query) + '</strong>"</p>' +
      '<p class="hs-placeholder-hint" data-lang="zh">💡 尝试更短的编码（如 8471）或不同的关键词</p>' +
      '<p class="hs-placeholder-hint" data-lang="en">💡 Try a shorter code (e.g., 8471) or different keywords</p>' +
      '<a href="http://www.hscode.net/IntegrateQueries/QueryYS" target="_blank" rel="noopener" class="hs-external-link" data-lang="zh">→ 前往 hscode.net 完整查询</a>' +
      '<a href="http://www.hscode.net/IntegrateQueries/QueryYS" target="_blank" rel="noopener" class="hs-external-link" data-lang="en">→ Full lookup on hscode.net</a>' +
      '</div>';
    window.applyI18n && window.applyI18n();
  }

  function showHSResults(results, query) {
    var result = document.getElementById('hs-result');
    if (!result) return;
    result.className = 'tool-result visible';

    var html = '<div class="hs-results-header">' +
      '<span data-lang="zh">找到 <strong>' + results.length + '</strong> 条结果</span>' +
      '<span data-lang="en">Found <strong>' + results.length + '</strong> result(s)</span>' +
      '</div>';

    html += '<div class="hs-results-list">';

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var code = r[0];
      var nameZh = r[1] || '';
      var nameEn = r[2] || '';
      var unit1 = r[3] || '';
      var mfn = r[4] || '';
      var vat = r[5] || '';
      var rebate = r[6] || '';
      var reg = r[7] || '';

      // Determine code level for badge
      var codeLen = code.length;
      var levelBadge = '';
      if (codeLen <= 2) levelBadge = '<span class="hs-level">' + (window.__lang === 'zh' ? '章' : 'Ch') + '</span>';
      else if (codeLen <= 4) levelBadge = '<span class="hs-level">' + (window.__lang === 'zh' ? '品目' : 'Hd') + '</span>';
      else if (codeLen <= 6) levelBadge = '<span class="hs-level">' + (window.__lang === 'zh' ? '子目' : 'Sub') + '</span>';

      html += '<div class="hs-result-item">' +
        '<div class="hs-result-code">' +
          '<code>' + formatHSCode(code) + '</code>' + levelBadge +
        '</div>' +
        '<div class="hs-result-names">' +
          '<span class="hs-name-zh">🇨🇳 ' + escapeHTML(nameZh) + '</span>' +
          (nameEn ? '<span class="hs-name-en">🌐 ' + escapeHTML(nameEn) + '</span>' : '') +
        '</div>';

      // Tax rates (collapsible)
      if (mfn || vat || rebate) {
        html += '<div class="hs-rates-toggle" onclick="this.nextElementSibling.classList.toggle(\'open\')">' +
          (window.__lang === 'zh' ? '📊 税率详情' : '📊 Tariff Details') + ' ▾</div>' +
          '<div class="hs-rates-detail">' +
            '<table class="hs-rates-table">' +
              (unit1 ? '<tr><td>' + (window.__lang === 'zh' ? '法定单位' : 'Unit') + '</td><td>' + escapeHTML(unit1) + '</td></tr>' : '') +
              (mfn ? '<tr><td>' + (window.__lang === 'zh' ? '最惠国进口税率' : 'MFN Rate') + '</td><td>' + escapeHTML(mfn) + '</td></tr>' : '') +
              (vat ? '<tr><td>' + (window.__lang === 'zh' ? '增值税率' : 'VAT') + '</td><td>' + escapeHTML(vat) + '</td></tr>' : '') +
              (rebate ? '<tr><td>' + (window.__lang === 'zh' ? '出口退税率' : 'Export Rebate') + '</td><td>' + escapeHTML(rebate) + '</td></tr>' : '') +
              (reg ? '<tr><td>' + (window.__lang === 'zh' ? '监管条件' : 'Regulation') + '</td><td>' + escapeHTML(reg) + '</td></tr>' : '') +
            '</table>' +
          '</div>';
      }

      html += '</div>';
    }

    html += '</div>';

    // Footer with external link
    html += '<div class="hs-results-footer">' +
      '<span data-lang="zh">💡 数据来源：中国海关总署进出口税则。完整申报要素请访问 </span>' +
      '<span data-lang="en">💡 Data: China Customs Tariff. For full declaration elements visit </span>' +
      '<a href="http://www.hscode.net/IntegrateQueries/QueryYS" target="_blank" rel="noopener">hscode.net</a>' +
      '</div>';

    result.innerHTML = html;
    window.applyI18n && window.applyI18n();
  }

  function formatHSCode(code) {
    // Format: 0101210010 → 0101.21.00.10
    if (code.length >= 10) {
      return code.substring(0, 4) + '.' + code.substring(4, 6) + '.' + code.substring(6, 8) + '.' + code.substring(8, 10);
    } else if (code.length >= 6) {
      return code.substring(0, 4) + '.' + code.substring(4, 6);
    }
    return code;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ============================================================
  //  CONTAINER / BL TRACKING
  // ============================================================

  function doTracking(type, number) {
    if (!number) return;

    var trackResult = document.getElementById('track-result');
    if (!trackResult) return;
    trackResult.classList.add('visible');

    var lang = document.documentElement.getAttribute('lang') || 'en';

    // Container prefix → carrier mapping
    var prefixMap = {
      'COSU': 'COSCO', 'CBHU': 'COSCO', 'CSLU': 'COSCO',
      'MSCU': 'MSC', 'MEDU': 'MSC',
      'MAEU': 'MAERSK', 'MSKU': 'MAERSK', 'MRKU': 'MAERSK', 'SUDU': 'MAERSK',
      'CMAU': 'CMA-CGM', 'CMDU': 'CMA-CGM', 'ECMU': 'CMA-CGM',
      'EISU': 'EVERGREEN', 'EGSU': 'EVERGREEN', 'EMCU': 'EVERGREEN',
      'HMMU': 'HMM', 'HDMU': 'HMM',
      'ONEY': 'ONE', 'ONEA': 'ONE',
      'HLBU': 'HAPAG-LLOYD', 'HLXU': 'HAPAG-LLOYD',
      'YMDU': 'YANGMING', 'YMLU': 'YANGMING',
      'ZIMU': 'ZIM',
      'OOLU': 'OOCL',
      'WHLU': 'WANHAI', 'WHSU': 'WANHAI',
      'NYCU': 'NYK', 'NYKS': 'NYK',
      'KKLU': 'K-LINE',
      'MOLU': 'MOL',
      'PONU': 'PIL',
      'TCNU': 'TURKON',
      'HJCU': 'HANJIN',
      'HALU': 'HAMBURG SUD',
      'APLU': 'APL', 'APZU': 'APL'
    };

    var carriers = {
      'COSCO':          { name: 'COSCO',  url: 'https://elines.coscoshipping.com/ebusiness/tracking', embeddable: true },
      'MSC':            { name: 'MSC',    url: 'https://www.msc.com/track-a-shipment', embeddable: false },
      'MAERSK':         { name: 'MAERSK', url: 'https://www.maersk.com/tracking', embeddable: false },
      'CMA-CGM':        { name: 'CMA-CGM', url: 'https://www.cma-cgm.com/ebusiness/tracking', embeddable: false },
      'EVERGREEN':      { name: 'EVERGREEN', url: 'https://www.evergreen-marine.com/ebusiness/tracking', embeddable: false },
      'HMM':            { name: 'HMM',    url: 'https://www.hmm21.com/cms/business/ebiz/tracking/index.jsp', embeddable: false },
      'ONE':            { name: 'ONE',    url: 'https://ecomm.one-line.com/one-ecom/visibility/track-cargos', embeddable: false },
      'HAPAG-LLOYD':    { name: 'HAPAG-LLOYD', url: 'https://www.hapag-lloyd.com/en/online-business/track/track-by-container.html', embeddable: false },
      'YANGMING':       { name: 'YANGMING', url: 'https://www.yangming.com/e-service/tracking.aspx', embeddable: false },
      'ZIM':            { name: 'ZIM',    url: 'https://www.zim.com/tools/track-a-shipment', embeddable: false },
      'OOCL':           { name: 'OOCL',   url: 'https://www.oocl.com/eng/ourservices/eservices/Pages/tracking.aspx', embeddable: false },
      'WANHAI':         { name: 'WANHAI', url: 'https://www.wanhai.com/views/ourservices/tracking/Tracking.xhtml', embeddable: false },
      'NYK':            { name: 'NYK',    url: 'https://www.nyk.com/english/ebusiness/', embeddable: false },
      'K-LINE':         { name: 'K-LINE', url: 'https://www.kline.co.jp/en/ebusiness/tracking.html', embeddable: false },
      'MOL':            { name: 'MOL',    url: 'https://www.mol-logistics-group.com/tracking/', embeddable: false },
      'PIL':            { name: 'PIL',    url: 'https://www.pilship.com/tracking', embeddable: false },
      'APL':            { name: 'APL',    url: 'https://www.apl.com/tracking', embeddable: false },
      'HAMBURG SUD':    { name: 'HAMBURG SUD', url: 'https://www.hamburgsud.com/tracking', embeddable: false }
    };

    // Match carrier by container prefix
    var prefix = number.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
    var matchedCarrierKey = null;

    for (var pf in prefixMap) {
      if (prefix.indexOf(pf) === 0) {
        matchedCarrierKey = prefixMap[pf];
        break;
      }
    }

    var carrier = carriers[matchedCarrierKey];

    var html = '<div class="track-result-card">';
    html += '<div class="track-result-header">' +
      '<strong>' + (lang === 'zh' ? '查询编号：' : 'Tracking No: ') + '</strong>' +
      '<span class="track-number-display">' + escapeHTML(number.toUpperCase()) + '</span>' +
      '</div>';
    html += '<div class="track-result-type">' +
      (type === 'container' ? (lang === 'zh' ? '📦 集装箱号' : '📦 Container Number') :
       (lang === 'zh' ? '📋 提单号' : '📋 Bill of Lading')) +
      '</div>';

    if (carrier) {
      html += '<div class="track-carrier-badge">' +
        (lang === 'zh' ? '🚢 自动识别船公司：' : '🚢 Auto-detected carrier: ') +
        '<strong>' + carrier.name + '</strong></div>';

      if (carrier.embeddable) {
        // COSCO allows iframe embedding
        html += '<div class="track-iframe-container">' +
          '<iframe src="' + carrier.url + '" ' +
          'class="track-iframe" ' +
          'sandbox="allow-scripts allow-same-origin allow-forms allow-popups" ' +
          'loading="lazy" ' +
          'title="' + carrier.name + ' Tracking">' +
          '</iframe>' +
          '</div>';
        html += '<div class="track-iframe-note">' +
          (lang === 'zh' ? '💡 上方为 ' + carrier.name + ' 官方追踪页面。如加载失败，请' : '💡 Embedded ' + carrier.name + ' tracking. If it fails to load, ') +
          '<a href="' + carrier.url + '" target="_blank" rel="noopener">' +
          (lang === 'zh' ? '在新窗口打开' : 'open in new tab') + ' →</a>' +
          '</div>';
      } else {
        // Other carriers: link button
        html += '<div class="track-external-box">' +
          '<p>' + (lang === 'zh' ? carrier.name + ' 的追踪页面无法在本站内嵌入展示（该网站安全策略限制）。' :
           carrier.name + ' tracking page cannot be embedded here due to their security policy.') + '</p>' +
          '<a href="' + carrier.url + '" target="_blank" rel="noopener" class="track-btn-external">' +
          (lang === 'zh' ? '前往 ' + carrier.name + ' 官网追踪 →' : 'Track on ' + carrier.name + ' →') +
          '</a>' +
          '</div>';
      }
    } else {
      // No carrier matched
      html += '<div class="track-no-carrier">' +
        '<p>' + (lang === 'zh' ? '未能自动识别船公司。请选择船公司前往官网查询：' :
         'Could not auto-detect carrier. Select a carrier to track:') + '</p>' +
        '<div class="track-carrier-list">';
      for (var key in carriers) {
        html += '<a href="' + carriers[key].url + '" target="_blank" rel="noopener" class="track-carrier-chip">' +
          carriers[key].name + '</a>';
      }
      html += '</div></div>';
    }

    html += '<div class="track-tip">' +
      (lang === 'zh' ? '💡 集装箱号格式：4位字母 + 7位数字（如 MSCU1234567）。提单号为船公司运单号。' :
       '💡 Container: 4 letters + 7 digits (e.g., MSCU1234567). B/L is carrier\'s shipment number.') +
      '</div>';

    html += '</div>';

    trackResult.innerHTML = html;
    window.applyI18n && window.applyI18n();
  }

})();
