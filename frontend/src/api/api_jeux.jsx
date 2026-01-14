import { API_BASE_URL, createApiGet, createApiPost, createApiPut } from "./base";

const JEUX_BASE_URL = `${API_BASE_URL}/jeux`;

/** Nouvelle partie
 * args :
 *  - data : json contenant un champ *jeu*
 * 
 * renvoie :
 *  la partie créée
 */
export const nouvellePartie = createApiPost(`${JEUX_BASE_URL}/partie`)

/** Nouvelle partie
 * args :
 *  - data : json contenant un champ *jeu*
 */
export const partieEnCours = createApiGet(`${JEUX_BASE_URL}/partie`)

/** Faire un coup
 * args :
 *  - data : json contenant le coup à faire
 */
export const faireUnCoup = createApiPut(`${JEUX_BASE_URL}/partie`)

/** Leaderboard
 * args :
 *  - jeu : le nom du jeu
 */
export const leaderboardJeu = createApiGet(`${JEUX_BASE_URL}/leaderboard`)