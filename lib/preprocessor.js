'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Chargement des fichiers de config ───────────────────────────────────────

function chargerVariables(dossier) {
  const chemin = path.join(dossier, 'variables.json');
  if (!fs.existsSync(chemin)) return {};
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch (e) {
    console.error(`[JST] variables.json invalide : ${e.message}`);
    return {};
  }
}

function chargerIgnore(dossier) {
  const chemin = path.join(dossier, '.jstignore');
  if (!fs.existsSync(chemin)) return [];
  return fs.readFileSync(chemin, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function chargerFonctions(dossier) {
  const chemin = path.join(dossier, 'functions.js');
  if (!fs.existsSync(chemin)) return {};
  try {
    delete require.cache[require.resolve(chemin)];
    return require(chemin);
  } catch (e) {
    console.error(`[JST] functions.js invalide : ${e.message}`);
    return {};
  }
}

// ─── Constantes internes JST ──────────────────────────────────────────────────

function construireConstantes(contexte) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  return {
    _thisURL_:      contexte.url        || '',
    _thisFile_:     contexte.fichier    || '',
    _thisDir_:      contexte.dossier    || '',
    _thisExt_:      path.extname(contexte.fichier || ''),
    _thisBase_:     path.basename(contexte.fichier || '', path.extname(contexte.fichier || '')),
    _host_:         contexte.host       || '',
    _protocol_:     contexte.protocol   || 'http',
    _method_:       contexte.method     || 'GET',
    _query_:        contexte.query      || '',
    _ip_:           contexte.ip         || '',
    _date_:         `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    _time_:         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    _datetime_:     now.toISOString(),
    _timestamp_:    String(now.getTime()),
    _year_:         String(now.getFullYear()),
    _month_:        pad(now.getMonth() + 1),
    _day_:          pad(now.getDate()),
    _hours_:        pad(now.getHours()),
    _minutes_:      pad(now.getMinutes()),
    _seconds_:      pad(now.getSeconds()),
    _weekday_:      ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][now.getDay()],
    _jstVersion_:   require('../package.json').version,
    _env_:          process.env.NODE_ENV || 'development',
  };
}

// ─── Parsing des arguments ────────────────────────────────────────────────────

function parseArgs(argsStr) {
  const args = [];
  let courant = '';
  let dansString = false;
  let quoteChar = '';
  let profondeur = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const c = argsStr[i];
    if (!dansString && (c === '"' || c === "'")) { dansString = true; quoteChar = c; }
    else if (dansString && c === quoteChar) { dansString = false; }
    else if (!dansString && c === '(') { profondeur++; courant += c; }
    else if (!dansString && c === ')') { profondeur--; courant += c; }
    else if (!dansString && c === ',' && profondeur === 0) {
      args.push(courant.trim().replace(/^["']|["']$/g, ''));
      courant = '';
      continue;
    } else { courant += c; }
  }
  if (courant.trim()) args.push(courant.trim().replace(/^["']|["']$/g, ''));
  return args;
}

// ─── Préprocesseur principal ──────────────────────────────────────────────────

function preprocesser(contenu, variables, dossierFichier, contexte, fonctions) {
  contexte  = contexte  || {};
  fonctions = fonctions || {};

  const constantes = construireConstantes(contexte);
  const tout = Object.assign({}, constantes, variables);

  // 1. Inclusions
  contenu = contenu.replace(/\{\{include:\s*(.+?)\}\}/g, (match, nomFichier) => {
    nomFichier = nomFichier.trim();
    const cheminInc = path.join(dossierFichier, nomFichier);
    if (!fs.existsSync(cheminInc)) return `<!-- [JST] include introuvable: ${nomFichier} -->`;
    return fs.readFileSync(cheminInc, 'utf8');
  });

  // 2. Fonctions {{nomFn(arg1, arg2)}}
  contenu = contenu.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\(([^}]*)\)\}\}/g, (match, nomFn, argsStr) => {
    if (!(nomFn in fonctions)) return `<!-- [JST] fonction inconnue: ${nomFn} -->`;
    try {
      argsStr = argsStr.replace(/\{\{([^}]+)\}\}/g, (m, k) => tout[k.trim()] || m);
      const args = parseArgs(argsStr);
      const resultat = fonctions[nomFn](args, contexte, tout);
      return resultat !== undefined ? String(resultat) : '';
    } catch (e) {
      return `<!-- [JST] erreur dans ${nomFn}(): ${e.message} -->`;
    }
  });

  // 3. Variables + constantes (multi-passes)
  let precedent = '';
  let passes = 0;
  while (precedent !== contenu && passes < 10) {
    precedent = contenu;
    contenu = contenu.replace(/\{\{([^}()]+)\}\}/g, (match, nomVar) => {
      nomVar = nomVar.trim();
      return (nomVar in tout) ? tout[nomVar] : match;
    });
    passes++;
  }

  return contenu;
}

function estIgnore(urlPath, listeIgnore) {
  const propre = urlPath.replace(/^\//, '');
  return listeIgnore.some(motif => {
    if (motif.includes('*')) {
      const regex = new RegExp('^' + motif.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return regex.test(propre);
    }
    return propre === motif || propre.startsWith(motif.replace(/\/$/, '') + '/');
  });
}

module.exports = { chargerVariables, chargerIgnore, chargerFonctions, estIgnore, preprocesser, construireConstantes };
