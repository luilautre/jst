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
 * Crée et retourne une app Express avec le middleware JST,
 * ou ajoute le middleware JST à une app Express existante.
 * 
 * @param {object|express.Application} optionsOrApp
 *   - Si c'est un objet options : crée une nouvelle app Express
 *   - Si c'est une app Express : ajoute le middleware à cette app
 * @param {string} optionsOrApp.racine   — dossier des fichiers de config (variables.json, functions.js, .jstignore)
 * @param {string} optionsOrApp.public   — dossier des fichiers servis au client
 * @returns {express.Application}
 */
function creerApp(optionsOrApp = {}) {
  let app;
  let racine;
  let dossierPublic;

  // Mode 1 : app Express passée en paramètre
  if (typeof optionsOrApp === 'function' && optionsOrApp.use) {
    app = optionsOrApp;
    racine = process.cwd();
    dossierPublic = racine;
  }
  // Mode 2 : options passées
  else {
    app = express();
    racine = optionsOrApp.racine || process.cwd();
    dossierPublic = optionsOrApp.public || racine;
  }

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

    // Fichier introuvable → next() pour laisser les autres routes gérer
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

/**
 * Crée un middleware JST pour l'ajouter à une app Express existante.
 * @param {object} options
 * @param {string} options.racine   — dossier des fichiers de config
 * @param {string} options.public   — dossier des fichiers servis
 * @param {string} options.page404  — nom du fichier 404 (défaut: '404.html')
 */
function jstMiddleware(options = {}) {
  const racine        = options.racine  || process.cwd();
  const dossierPublic = options.public  || racine;
  const nomPage404    = options.page404 || '404.html';

  return (req, res, next) => {
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

    // Fichier introuvable → essayer la page 404 personnalisée
    if (!fs.existsSync(cheminFichier) || fs.statSync(cheminFichier).isDirectory()) {
      const chemin404 = path.join(dossierPublic, nomPage404);
      if (fs.existsSync(chemin404)) {
        const variables = chargerVariables(racine);
        const fonctions = chargerFonctions(racine);
        const contexte  = {
          url:      req.path,
          fichier:  nomPage404,
          dossier:  dossierPublic,
          host:     req.hostname,
          protocol: req.protocol,
          method:   req.method,
          query:    req.url.includes('?') ? req.url.split('?')[1] : '',
          ip:       req.ip || req.connection.remoteAddress,
        };
        const brut   = fs.readFileSync(chemin404, 'utf8');
        const traite = preprocesser(brut, variables, dossierPublic, contexte, fonctions);
        res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(traite);
      }
      return next();
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
  };
}

module.exports = { creerApp, jstMiddleware, preprocesser, chargerVariables, chargerFonctions };
