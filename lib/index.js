'use strict';

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { chargerVariables, chargerIgnore, estIgnore, preprocesser } = require('./preprocessor');

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
 * @param {string} options.racine   — dossier racine du site (défaut: process.cwd())
 */
function creerApp(options = {}) {
  const racine = options.racine || process.cwd();
  const app    = express();

  app.use((req, res, next) => {
    let urlPath = req.path;

    // Dossier → index.html
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    const cheminFichier = path.join(racine, urlPath);
    const ext           = path.extname(cheminFichier).toLowerCase();
    const contentType   = MIME[ext] || 'application/octet-stream';
    const estTexteType  = MIME_TEXTE.has(ext);

    // Sécurité : pas de sortie hors du dossier racine
    if (!cheminFichier.startsWith(path.resolve(racine))) {
      return res.status(403).send('Accès refusé');
    }

    // Fichier introuvable
    if (!fs.existsSync(cheminFichier) || fs.statSync(cheminFichier).isDirectory()) {
      return next(); // laisser Express gérer le 404
    }

    const listeIgnore = chargerIgnore(racine);

    // Fichier binaire ou ignoré → envoi brut
    if (!estTexteType || estIgnore(urlPath, listeIgnore)) {
      res.setHeader('Content-Type', contentType);
      return res.sendFile(cheminFichier);
    }

    // Fichier texte → préprocesseur
    try {
      const variables = chargerVariables(racine);
      const brut      = fs.readFileSync(cheminFichier, 'utf8');
      const traite    = preprocesser(brut, variables, path.dirname(cheminFichier));
      res.setHeader('Content-Type', contentType);
      return res.send(traite);
    } catch (e) {
      return res.status(500).send(`[JST] Erreur : ${e.message}`);
    }
  });

  return app;
}

module.exports = { creerApp };
