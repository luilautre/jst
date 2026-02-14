'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Charge variables.json depuis un dossier donné.
 * Retourne {} si le fichier est absent ou invalide.
 */
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

/**
 * Charge .jstignore depuis un dossier donné.
 * Retourne un tableau de motifs (strings).
 */
function chargerIgnore(dossier) {
  const chemin = path.join(dossier, '.jstignore');
  if (!fs.existsSync(chemin)) return [];
  return fs.readFileSync(chemin, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

/**
 * Vérifie si un chemin URL correspond à un motif du .jstignore.
 */
function estIgnore(urlPath, listeIgnore) {
  const propre = urlPath.replace(/^\//, '');
  return listeIgnore.some(motif => {
    if (motif.includes('*')) {
      const regex = new RegExp(
        '^' + motif.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
      );
      return regex.test(propre);
    }
    return propre === motif || propre.startsWith(motif.replace(/\/$/, '') + '/');
  });
}

/**
 * Préprocesse un contenu texte :
 * 1. Remplace {{include: fichier}}
 * 2. Remplace {{NomVariable}} (plusieurs passes pour les variables imbriquées)
 */
function preprocesser(contenu, variables, dossierFichier) {
  // 1. Inclusions
  contenu = contenu.replace(/\{\{include:\s*(.+?)\}\}/g, (match, nomFichier) => {
    nomFichier = nomFichier.trim();
    const cheminInc = path.join(dossierFichier, nomFichier);
    if (!fs.existsSync(cheminInc)) {
      return `<!-- [JST] include introuvable: ${nomFichier} -->`;
    }
    return fs.readFileSync(cheminInc, 'utf8');
  });

  // 2. Variables (plusieurs passes pour les valeurs imbriquées)
  let precedent = '';
  let passes = 0;
  while (precedent !== contenu && passes < 10) {
    precedent = contenu;
    contenu = contenu.replace(/\{\{([^}]+)\}\}/g, (match, nomVar) => {
      nomVar = nomVar.trim();
      return (nomVar in variables) ? variables[nomVar] : match;
    });
    passes++;
  }

  return contenu;
}

module.exports = { chargerVariables, chargerIgnore, estIgnore, preprocesser };
