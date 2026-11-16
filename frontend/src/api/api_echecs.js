import { API_BASE_URL, createApiGet, createApiPost, createApiPut, createApiDelete } from "./base";

const ECHECS_BASE_URL = `${API_BASE_URL}/echecs`;

/**
 * Récupère la liste des défis et parties d'échecs de l'utilisateur connecté.
 */
export const getDefis = createApiGet(`${ECHECS_BASE_URL}/defis`);

/**
 * Crée un nouveau défi d'échecs.
 * @param {object} data - Paramètres du défi (adversaire_id, couleur, cadence, etc.)
 */
export const creerDefi = createApiPost(`${ECHECS_BASE_URL}/defis`);

/**
 * Annule ou refuse un défi d'échecs.
 * @param {number} id - ID du défi à supprimer
 */
export const annulerDefi = createApiDelete(`${ECHECS_BASE_URL}/defis`);

/**
 * Accepte un défi d'échecs et démarre la partie.
 * @param {number} id - ID du défi
 */
export const accepterDefi = (id) => createApiPost(`${ECHECS_BASE_URL}/defis/${id}/accepter`)({});

/**
 * Récupère l'état complet d'une partie d'échecs.
 * @param {number} id - ID de la partie
 */
export const getPartie = (id) => createApiGet(`${ECHECS_BASE_URL}/parties/${id}`)({});

/**
 * Récupère la liste des coups légaux depuis une case donnée.
 * @param {number} id - ID de la partie
 * @param {number|string} caseIdx - Indice ou coordonnée de la case de départ
 */
export const getCoupsLegaux = (id, caseIdx) =>
    createApiGet(`${ECHECS_BASE_URL}/parties/${id}/coups_legaux`)({ case: caseIdx });

/**
 * Crée la fonction permettant de jouer un coup dans une partie d'échecs.
 * @param {number} id - ID de la partie
 */
export const jouerCoup = (id) => createApiPut(`${ECHECS_BASE_URL}/parties/${id}`);

/**
 * Récupère le classement Elo des joueurs d'échecs.
 */
export const getLeaderboard = createApiGet(`${ECHECS_BASE_URL}/leaderboard`);

/**
 * Abandonne une partie d'échecs en cours.
 * @param {number} id - ID de la partie
 */
export const abandonner = (id) => createApiPost(`${ECHECS_BASE_URL}/parties/${id}/abandonner`)({});

/**
 * Propose la nulle à l'adversaire dans une partie en cours.
 * @param {number} id - ID de la partie
 */
export const proposerNulle = (id) => createApiPost(`${ECHECS_BASE_URL}/parties/${id}/proposer_nulle`)({});

/**
 * Accepte une proposition de nulle dans une partie en cours.
 * @param {number} id - ID de la partie
 */
export const accepterNulle = (id) => createApiPost(`${ECHECS_BASE_URL}/parties/${id}/accepter_nulle`)({});
