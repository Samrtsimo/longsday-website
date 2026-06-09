/* ============================================================
   Longsday — i18n Bilingual System
   ============================================================ */

(function () {
  'use strict';

  const LANG_KEY = 'longsday_lang';

  function getLang() {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
    // Default: detect browser language
    const navLang = navigator.language || '';
    return navLang.startsWith('zh') ? 'zh' : 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
    updateButtons(lang);
  }

  function updateButtons(lang) {
    document.querySelectorAll('.lang-switch button').forEach(function (btn) {
      var bl = btn.getAttribute('data-lang-val');
      btn.classList.toggle('active', bl === lang);
    });
  }

  function toggleLang() {
    var current = document.documentElement.getAttribute('lang') || 'en';
    setLang(current === 'zh' ? 'en' : 'zh');
  }

  // Init
  var lang = getLang();
  setLang(lang);

  // Bind switchers
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-switch button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(this.getAttribute('data-lang-val'));
      });
    });
  });

  // Expose toggle
  window.toggleLang = toggleLang;
  window.getCurrentLang = function () {
    return document.documentElement.getAttribute('lang') || 'en';
  };
})();
