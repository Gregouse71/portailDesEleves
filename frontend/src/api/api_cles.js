import { API_BASE_URL, createApiDelete, createApiGet, createApiPost } from "./base";

const CLES_BASE_URL = `${API_BASE_URL}/cles`;

/**
 * Récupère la liste des clés d'API de l'utilisateur connecté et son éligibilité (permission cle_api).
 * @param {object} [data={}] - Paramètres de requête
 * @returns {Promise<{ cles: Array<object>, eligible_api: boolean }>}
 */
export const listerCles = createApiGet(`${CLES_BASE_URL}/liste`);

/**
 * Crée une nouvelle clé d'API personnelle (la valeur en clair n'est retournée qu'une seule fois).
 * @param {{ nom: string }} data - Nom de la clé (1 à 100 caractères)
 * @returns {Promise<{ cle: object, valeur: string } | undefined>}
 */
export const creerCle = createApiPost(`${CLES_BASE_URL}/creer`);

/**
 * Révoque une clé d'API appartenant à l'utilisateur connecté par son identifiant.
 * @param {number} id - Identifiant de la clé
 * @returns {Promise<{ cle: object } | undefined>}
 */
export const revoquerCle = createApiDelete(`${CLES_BASE_URL}/revoquer`);

/**
 * Révoque toutes les clés d'API actives d'un utilisateur donné (réservé aux superutilisateurs).
 * @param {number} utilisateurId - Identifiant de l'utilisateur
 * @returns {Promise<{ message: string } | undefined>}
 */
export const revoquerToutesCle = createApiDelete(`${CLES_BASE_URL}/revoquer_tout`);

/**
 * Récupère la spécification OpenAPI dynamique de l'API du portail.
 * @param {object} [data={}] - Paramètres de requête
 * @returns {Promise<object>}
 */
export const obtenirSwagger = createApiGet(`${API_BASE_URL}/apispec_1.json`);
