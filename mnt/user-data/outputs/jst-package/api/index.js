'use strict';

// Point d'entrée Vercel — exporte l'app Express sans .listen()
const path = require('path');
const { creerApp } = require('../lib/index');

const app = creerApp({
  racine: path.join(__dirname, '..', 'public') // ton site est dans /public
});

module.exports = app;
