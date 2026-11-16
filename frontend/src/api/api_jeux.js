import { API_BASE_URL, createApiGet, createApiPost, createApiPut } from "./base";

const JEUX_BASE_URL = `${API_BASE_URL}/jeux`;

/**
 * Crée une nouvelle partie d'un mini-jeu.
 * @param {{ jeu: string }} data - Objet contenant le nom du jeu
 * @returns {Promise<object>} La partie créée
 */
export const nouvellePartie = createApiPost(`${JEUX_BASE_URL}/partie`);

/**
 * Récupère la partie en cours de l'utilisateur connecté pour un jeu donné.
 * @param {{ jeu: string }} data - Paramètres de requête contenant le nom du jeu
 */
export const partieEnCours = createApiGet(`${JEUX_BASE_URL}/partie`);

/**
 * Joue un coup dans la partie en cours.
 * @param {object} data - Données du coup à effectuer
 */
export const faireUnCoup = createApiPut(`${JEUX_BASE_URL}/partie`);

/**
 * Récupère le classement général d'un mini-jeu.
 * @param {{ jeu: string }} data - Paramètres de requête contenant le nom du jeu
 */
export const leaderboardJeu = createApiGet(`${JEUX_BASE_URL}/leaderboard`);
