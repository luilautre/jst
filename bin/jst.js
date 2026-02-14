#!/usr/bin/env node
'use strict';

const { creerApp } = require('../lib/index');
const { chargerVariables, chargerIgnore } = require('../lib/preprocessor');

const PORT   = parseInt(process.argv[2]) || 3000;
const racine = process.cwd();

// ─── Couleurs terminal ────────────────────────────────────────────────────────
const OK  = (s) => `\x1b[32m✔ ${s}\x1b[0m`;
const ERR = (s) => `\x1b[31m✖ ${s}\x1b[0m`;
const INF = (s) => `\x1b[36mℹ ${s}\x1b[0m`;

const app = creerApp({ racine });

const serveur = app.listen(PORT, () => {
  const vars   = Object.keys(chargerVariables(racine));
  const ignore = chargerIgnore(racine);

  console.log('');
  console.log('  \x1b[1m██ JST Server\x1b[0m');
  console.log(`  ↳ \x1b[4mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  ↳ Dossier   : ${racine}`);
  console.log(`  ↳ Variables : ${vars.length ? vars.join(', ') : '(aucune)'}`);
  if (ignore.length) console.log(`  ↳ Ignorés   : ${ignore.join(', ')}`);
  console.log('');
  console.log(INF('Ctrl+C pour arrêter'));
  console.log('─'.repeat(40));
});

serveur.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(ERR(`Port ${PORT} déjà utilisé. Essaie : jst ${PORT + 1}`));
  } else {
    console.error(ERR(e.message));
  }
  process.exit(1);
});
