/* ============================================================
   Longsday — Main Navigation & Utilities
   ============================================================ */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    // --- Mobile menu toggle ---
    var toggle = document.querySelector('.menu-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
      });

      // Close mobile menu on link click
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
        });
      });
    }

    // --- Active nav link ---
    var currentPath = window.location.pathname;
    var currentPage = currentPath.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // --- Nav background on scroll ---
    var nav = document.querySelector('.nav');
    if (nav) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 10) {
          nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
        } else {
          nav.style.boxShadow = '';
        }
      });
    }

  });

})();
