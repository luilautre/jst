'use strict';

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { chargerVariables, chargerIgnore, chargerFonctions, estIgnore, preprocesser } = require('./preprocessor');

// Types MIME texte (à préprocesser)
const MIME_TEXTE = new Set([
  '.html', '.css', '.js', '.json', '.txt', '.xml', '.svg'
]);

// Types MIME complets
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'text/xml; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.pdf':  'application/pdf',
};

/**
 * Crée et retourne une app Express avec le middleware JST.
 * @param {object} options
 * @param {string} options.racine   — dossier des fichiers de config (variables.json, functions.js, .jstignore)
 *                                    défaut: process.cwd()
 * @param {string} options.public   — dossier des fichiers servis au client (html, css, js...)
 *                                    défaut: identique à racine
 */
function creerApp(options = {}) {
  const racine      = options.racine  || process.cwd();
  const dossierPublic = options.public || racine;
  const app         = express();

  app.use((req, res, next) => {
    let urlPath = req.path;

    // Dossier → index.html
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    const cheminFichier = path.join(dossierPublic, urlPath);
    const ext           = path.extname(cheminFichier).toLowerCase();
    const contentType   = MIME[ext] || 'application/octet-stream';
    const estTexteType  = MIME_TEXTE.has(ext);

    // Sécurité : pas de sortie hors du dossier public
    if (!cheminFichier.startsWith(path.resolve(dossierPublic))) {
      return res.status(403).send('Accès refusé');
    }

    // Fichier introuvable
    if (!fs.existsSync(cheminFichier) || fs.statSync(cheminFichier).isDirectory()) {
      return next();
    }

    // Config chargée depuis racine (pas public)
    const listeIgnore = chargerIgnore(racine);

    // Fichier binaire ou ignoré → envoi brut
    if (!estTexteType || estIgnore(urlPath, listeIgnore)) {
      res.setHeader('Content-Type', contentType);
      return res.sendFile(cheminFichier);
    }

    // Fichier texte → préprocesseur
    try {
      const variables = chargerVariables(racine);
      const fonctions = chargerFonctions(racine);
      const contexte  = {
        url:      req.path,
        fichier:  path.basename(cheminFichier),
        dossier:  path.dirname(cheminFichier),
        host:     req.hostname,
        protocol: req.protocol,
        method:   req.method,
        query:    req.url.includes('?') ? req.url.split('?')[1] : '',
        ip:       req.ip || req.connection.remoteAddress,
      };
      const brut   = fs.readFileSync(cheminFichier, 'utf8');
      const traite = preprocesser(brut, variables, path.dirname(cheminFichier), contexte, fonctions);
      res.setHeader('Content-Type', contentType);
      return res.send(traite);
    } catch (e) {
      return res.status(500).send(`[JST] Erreur : ${e.message}`);
    }
  });

  return app;
}

module.exports = { creerApp };
