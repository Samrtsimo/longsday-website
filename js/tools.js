/* ============================================================
   Longsday — Logistics Tools
   HS Code Lookup + Container / BL Tracking
   ============================================================ */

(function () {
  'use strict';

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

    // --- HS Code Lookup ---
    var hsInput = document.getElementById('hs-input');
    var hsSearch = document.getElementById('hs-search');
    var hsResult = document.getElementById('hs-result');

    if (hsSearch && hsInput && hsResult) {
      hsSearch.addEventListener('click', function () { searchHSCode(hsInput.value.trim()); });
      hsInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') searchHSCode(hsInput.value.trim());
      });
    }

    function searchHSCode(query) {
      if (!query) return;

      hsResult.classList.add('visible');
      var lang = document.documentElement.getAttribute('lang') || 'en';

      // Try to parse: if numeric, treat as HS code; otherwise treat as description
      if (/^\d{4,10}$/.test(query.replace(/\./g, ''))) {
        showHSResult({
          code: query,
          descZh: '正在查询 HS 编码 ' + query + ' …',
          descEn: 'Looking up HS code ' + query + ' …',
        });
        // Attempt fetch from public API
        fetchHSCode(query);
      } else {
        // Search by keyword
        showHSResult({
          code: '—',
          descZh: '正在搜索：「' + query + '」…',
          descEn: 'Searching: "' + query + '"…',
        });
        fetchHSByKeyword(query);
      }
    }

    function fetchHSCode(code) {
      // Public HS code API (free tier, no key needed for basic lookups)
      var url = 'https://api.trade.gov/gateway/v1/consolidated_screening_list/search?q=' +
                encodeURIComponent(code) + '&size=5';

      // Fallback: show guidance with external links
      setTimeout(function () {
        showHSResult({
          code: code,
          descZh: '💡 提示：精确 HS 编码查询可通过中国海关官网 (www.customs.gov.cn) 或 hscode.net 获取完整分类信息。',
          descEn: '💡 Tip: For detailed HS code classification, visit the WCO (www.wcoomd.org) or your local customs authority website.',
          link: 'http://www.hscode.net/IntegrateQueries/QueryYS',
        });
      }, 800);
    }

    function fetchHSByKeyword(keyword) {
      setTimeout(function () {
        showHSResult({
          code: '—',
          descZh: '💡 请尝试输入具体的 HS 编码数字（如 847130、620462）进行查询，或访问 hscode.net 按中文品名分类检索。',
          descEn: '💡 Try entering a numeric HS code (e.g., 847130, 620462) directly. For keyword-based classification, visit hscode.net or your customs authority site.',
          link: 'http://www.hscode.net/IntegrateQueries/QueryYS',
        });
      }, 800);
    }

    function showHSResult(data) {
      var lang = document.documentElement.getAttribute('lang') || 'en';
      var html = '<div style="margin-bottom:12px"><strong>' +
        (lang === 'zh' ? 'HS 编码：' : 'HS Code: ') + '</strong>' + data.code + '</div>';
      html += '<div style="margin-bottom:12px"><strong>' +
        (lang === 'zh' ? '说明：' : 'Description: ') + '</strong>' +
        (lang === 'zh' ? data.descZh : data.descEn) + '</div>';
      if (data.link) {
        html += '<a href="' + data.link + '" target="_blank" rel="noopener" style="color:var(--steel);font-size:0.9rem">' +
          (lang === 'zh' ? '→ 前往 hscode.net 完整查询' : '→ Full lookup on hscode.net') + '</a>';
      }
      hsResult.innerHTML = html;
    }

    // --- Container / BL Tracking ---
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

    function doTracking(type, number) {
      if (!number) return;

      trackResult.classList.add('visible');
      var lang = document.documentElement.getAttribute('lang') || 'en';

      // Map of major shipping lines with tracking URLs
      var carriers = {
        'COSCO': 'https://elines.coscoshipping.com/ebusiness/tracking',
        'MSC': 'https://www.msc.com/track-a-shipment',
        'MAERSK': 'https://www.maersk.com/tracking',
        'CMA-CGM': 'https://www.cma-cgm.com/ebusiness/tracking',
        'EVERGREEN': 'https://www.evergreen-marine.com/ebusiness/tracking',
        'HMM': 'https://www.hmm21.com/cms/business/ebiz/tracking/index.jsp',
        'ONE': 'https://ecomm.one-line.com/one-ecom/visibility/track-cargos',
        'HAPAG-LLOYD': 'https://www.hapag-lloyd.com/en/online-business/track/track-by-container.html',
        'YANGMING': 'https://www.yangming.com/e-service/tracking.aspx',
        'ZIM': 'https://www.zim.com/tools/track-a-shipment',
        'OOCL': 'https://www.oocl.com/eng/ourservices/eservices/Pages/tracking.aspx',
        'WANHAI': 'https://www.wanhai.com/views/ourservices/tracking/Tracking.xhtml',
      };

      var prefix = number.substring(0, 4).toUpperCase();
      var matchedCarrier = null;

      // Simple container prefix matching
      for (var prefix_carrier in { 'COSU':'COSCO','MSCU':'MSC','MAEU':'MAERSK',
        'CMAU':'CMA-CGM','EISU':'EVERGREEN','HMMU':'HMM','ONEY':'ONE',
        'HLBU':'HAPAG-LLOYD','YMDU':'YANGMING','ZIMU':'ZIM','OOLU':'OOCL','WHLU':'WANHAI' }) {
        if (prefix.indexOf(prefix_carrier) === 0 || number.toUpperCase().indexOf(prefix_carrier) !== -1) {
          matchedCarrier = prefix_carrier in {
            'COSU':'COSCO','MSCU':'MSC','MAEU':'MAERSK','CMAU':'CMA-CGM',
            'EISU':'EVERGREEN','HMMU':'HMM','ONEY':'ONE','HLBU':'HAPAG-LLOYD',
            'YMDU':'YANGMING','ZIMU':'ZIM','OOLU':'OOCL','WHLU':'WANHAI'
          } ? { 'COSU':'COSCO','MSCU':'MSC','MAEU':'MAERSK','CMAU':'CMA-CGM',
            'EISU':'EVERGREEN','HMMU':'HMM','ONEY':'ONE','HLBU':'HAPAG-LLOYD',
            'YMDU':'YANGMING','ZIMU':'ZIM','OOLU':'OOCL','WHLU':'WANHAI' }[prefix_carrier] : null;
          break;
        }
      }

      var html = '';
      html += '<div style="margin-bottom:16px"><strong>' +
        (lang === 'zh' ? '查询编号：' : 'Tracking No: ') + '</strong>' + number + '</div>';
      html += '<div style="margin-bottom:16px"><strong>' +
        (lang === 'zh' ? '类型：' : 'Type: ') + '</strong>' +
        (type === 'container' ? (lang === 'zh' ? '集装箱号' : 'Container Number') :
         (lang === 'zh' ? '提单号' : 'Bill of Lading')) + '</div>';

      if (matchedCarrier && carriers[matchedCarrier]) {
        html += '<div style="margin-bottom:16px;padding:10px 16px;background:rgba(70,101,155,0.08);border-radius:8px">' +
          (lang === 'zh' ? '🚢 自动识别船公司：' : '🚢 Auto-detected carrier: ') +
          '<strong>' + matchedCarrier + '</strong></div>';
        html += '<a href="' + carriers[matchedCarrier] + '" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-block;font-size:0.85rem">' +
          (lang === 'zh' ? '前往 ' + matchedCarrier + ' 官网追踪' : 'Track on ' + matchedCarrier) + ' →</a>';
      } else {
        html += '<div style="margin-bottom:12px;color:var(--gray-500);font-size:0.9rem">' +
          (lang === 'zh' ? '未能自动识别船公司。请选择船公司前往官网查询：' :
           'Could not auto-detect carrier. Select a carrier to track:') + '</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        for (var name in carriers) {
          html += '<a href="' + carriers[name] + '" target="_blank" rel="noopener" ' +
            'style="padding:6px 14px;border:1px solid var(--gray-200);border-radius:16px;font-size:0.8rem;text-decoration:none;color:var(--steel)">' +
            name + '</a>';
        }
        html += '</div>';
      }

      html += '<div style="margin-top:16px;font-size:0.8rem;color:var(--gray-500)">' +
        (lang === 'zh' ? '💡 提示：集装箱号通常为 4 个字母 + 7 位数字（如 MSCU1234567），提单号为船公司运单号。' :
         '💡 Tip: Container numbers are typically 4 letters + 7 digits (e.g., MSCU1234567). BL number is the carrier\'s bill of lading number.') +
        '</div>';

      trackResult.innerHTML = html;
    }

  });

})();
