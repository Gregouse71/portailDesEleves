import { SOIFGUARD_BASE_URL, createApiPost, createApiDelete, createApiPut, createApiGet } from "./base";

/**
 * Encaisse une consommation pour un utilisateur auprès d'Octo ou du Biero.
 * @param {{ id_utilisateur: number, id_conso: number }} data
 * @param {"octo"|"biero"} asso - Association concernée
 */
export const encaisserAsso = createApiPost(`${SOIFGUARD_BASE_URL}/encaisser`);

/**
 * Crédite le solde d'un utilisateur pour Octo ou le Biero.
 * @param {{ id_utilisateur: number, somme: number|string }} data
 * @param {"octo"|"biero"} asso - Association concernée
 */
export const crediterAsso = createApiPost(`${SOIFGUARD_BASE_URL}/crediter`);

/**
 * Fixe le plafond de dette maximale autorisée pour Octo ou le Biero.
 * @param {{ maximum: number }} data
 * @param {"octo"|"biero"} asso - Association concernée
 */
export const fixerDetteMax = createApiPost(`${SOIFGUARD_BASE_URL}/fixer_negatif_maximum`);

/**
 * Crée une nouvelle consommation (boisson/article) dans Soifguard.
 * @param {{ nom_conso: string, prix: number, prix_cotisant: number|null, asso: "octo"|"biero" }} data
 */
export const ajouterConso = createApiPost(`${SOIFGUARD_BASE_URL}/conso`);

/**
 * Supprime une consommation de Soifguard.
 * @param {number} id - ID de la consommation à supprimer
 */
export const supprimerConso = createApiDelete(`${SOIFGUARD_BASE_URL}/conso`);

/**
 * Modifie les informations ou tarifs d'une consommation existante.
 * @param {{ nom_conso: string, prix: number, prix_cotisant: number|null }} data
 * @param {number} id - ID de la consommation
 */
export const modifierConso = createApiPut(`${SOIFGUARD_BASE_URL}/conso`);

/**
 * Récupère la liste des consommations disponibles pour Octo et Biero.
 */
export const getListeConsos = createApiGet(`${SOIFGUARD_BASE_URL}/liste_consos`);

/**
 * Bascule le statut de cotisant d'un utilisateur pour Octo ou le Biero.
 * @param {{ asso: "octo"|"biero" }} data
 * @param {number} id - ID de l'utilisateur
 */
export const toggleCotisation = createApiPut(`${SOIFGUARD_BASE_URL}/toggle_cotisation`);

/**
 * Récupère le plafond de dette maximale autorisée pour une association ("octo" ou "biero").
 * @param {"octo"|"biero"} asso - Association concernée
 */
export const obtenirDetteMaxi = (asso) =>
    createApiGet(`${SOIFGUARD_BASE_URL}/get_negatif_max`)({}, asso);

/**
 * Récupère la liste paginée des dernières opérations Soifguard.
 * @param {{ asso: "octo"|"biero", page?: number, per?: number, query?: string }} data
 */
export const listeOperations = createApiPost(`${SOIFGUARD_BASE_URL}/operations`);

/**
 * Récupère la liste paginée des permissions Soifguard.
 * @param {{ per_page?: number, page?: number, query?: string, asso: "octo"|"biero" }} params
 */
export const getPermissionsSoifguard = createApiGet(`${SOIFGUARD_BASE_URL}/permissions`);

/**
 * Supprime une permission Soifguard.
 * @param {number} id - ID de la permission à supprimer
 */
export const deletePermissionsSoifguard = createApiDelete(`${SOIFGUARD_BASE_URL}/permissions`);

/**
 * Ajoute une permission Soifguard à un utilisateur.
 * @param {{ user_id: number, permission: string }} data
 */
export const addPermissionsSoifguard = createApiPost(`${SOIFGUARD_BASE_URL}/permissions`);

/**
 * Récupère les derniers utilisateurs ayant effectué une opération Soifguard.
 * @param {{ limit?: number, asso: "octo"|"biero" }} params
 */
export const derniersUtilisateurs = createApiGet(`${SOIFGUARD_BASE_URL}/derniers`);

/**
 * Récupère la liste paginée et triée des utilisateurs et leurs soldes Soifguard.
 * @param {{ page?: number, perPage?: number, asso: "octo"|"biero", query?: string, orderBy?: string, orderAsc?: boolean }} params
 */
export const listeUtilisateurs = createApiGet(`${SOIFGUARD_BASE_URL}/liste`);

/**
 * Exporte la liste des soldes utilisateurs au format CSV.
 * @param {{ asso: "octo"|"biero", query?: string, orderBy?: string, orderAsc?: boolean }} params
 */
export const exportListeUtilisateurs = createApiGet(`${SOIFGUARD_BASE_URL}/liste/export`, true);
