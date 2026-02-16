'use strict';

/**
 * functions.js — Fonctions JST personnalisées
 * Chaque fonction reçoit : (args, contexte, variables)
 *   - args      : tableau des arguments passés dans le template
 *   - contexte  : infos sur la requête (url, host, ip, method...)
 *   - variables : toutes les variables + constantes JST disponibles
 *
 * Usage dans un template :
 *   {{nomFonction(arg1, arg2)}}
 *   {{nomFonction({{_thisURL_}}, "texte fixe")}}
 */

module.exports = {

  // Génère un lien HTML <a>
  // Usage : {{lien(/contact.html, Contactez-nous)}}
  lien([href, texte]) {
    return `<a href="${href}">${texte || href}</a>`;
  },

  // Génère une balise <img>
  // Usage : {{image(/img/logo.png, Logo du site, 200)}}
  image([src, alt, largeur]) {
    const w = largeur ? ` width="${largeur}"` : '';
    return `<img src="${src}" alt="${alt || ''}"${w}>`;
  },

  // Génère un header complet avec nav
  // Usage : {{header(Mon Site, /logo.png)}}
  header([titre, logo], contexte, vars) {
    const logoHTML = logo ? `<img src="${logo}" alt="${titre}" height="40">` : '';
    return `<header>
  <div class="header-inner">
    <a href="${vars._protocol_}://${vars._host_}/">${logoHTML}<span>${titre || vars.SiteName || ''}</span></a>
  </div>
</header>`;
  },

  // Génère un footer
  // Usage : {{footer(2025, luilautre)}}
  footer([annee, auteur], contexte, vars) {
    return `<footer>
  <p>&copy; ${annee || vars._year_} ${auteur || vars.SiteAuteur || ''}</p>
</footer>`;
  },

  // Répète un texte N fois
  // Usage : {{repeter(⭐, 5)}}
  repeter([texte, fois]) {
    return texte.repeat(parseInt(fois) || 1);
  },

  // Affiche la date en format lisible
  // Usage : {{dateFormatee()}} ou {{dateFormatee(fr-FR)}}
  dateFormatee([locale]) {
    return new Date().toLocaleDateString(locale || 'fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  },

  // Majuscules
  // Usage : {{upper(mon texte)}}
  upper([texte]) {
    return (texte || '').toUpperCase();
  },

  // Minuscules
  lower([texte]) {
    return (texte || '').toLowerCase();
  },

  // Tronque un texte avec ...
  // Usage : {{tronquer(Mon long texte ici, 20)}}
  tronquer([texte, max]) {
    const n = parseInt(max) || 100;
    return texte.length > n ? texte.slice(0, n) + '…' : texte;
  },

  // Balise meta pour le SEO
  // Usage : {{meta(description, Mon site cool)}}
  meta([nom, contenu]) {
    return `<meta name="${nom}" content="${contenu}">`;
  },

  // Inclut un script JS externe
  // Usage : {{script(/js/app.js)}}
  script([src, defer]) {
    const d = defer !== 'false' ? ' defer' : '';
    return `<script src="${src}"${d}></script>`;
  },

  // Inclut une feuille de style
  // Usage : {{style(/css/main.css)}}
  style([href]) {
    return `<link rel="stylesheet" href="${href}">`;
  },

};
