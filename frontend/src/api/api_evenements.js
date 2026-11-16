import { API_BASE_URL, createApiDelete, createApiGet, createApiPost, createApiPut } from "./base";

const EVENEMENTS_BASE_URL = `${API_BASE_URL}/evenements`;

/**
 * Obtient la liste des événements d'une association.
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {number} asso_id - ID de l'association
 * @returns {Promise<Array<{ id: number, evenement_periodique: boolean, date_de_debut: string }>>}
 */
export const obtenirEvenementsAsso = createApiGet(`${EVENEMENTS_BASE_URL}/asso`);

/**
 * Obtient les détails d'un événement.
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {number} event_id - ID de l'événement
 */
export const obteniEvenement = createApiGet(`${EVENEMENTS_BASE_URL}/event`);

/**
 * Crée un nouvel événement pour une association.
 * @param {object} data - Données de l'événement à créer
 * @param {number} asso_id - ID de l'association
 */
export const creerNouvelEvenement = createApiPost(`${EVENEMENTS_BASE_URL}/event`);

/**
 * Modifie les détails d'un événement existant.
 * @param {object} data - Nouveaux paramètres de l'événement
 * @param {number} association_id - ID de l'association de l'événement
 * @param {number} id - ID de l'événement
 */
export const modifierEvenement = createApiPut(`${EVENEMENTS_BASE_URL}/event`);

/**
 * Supprime un événement d'une association.
 * @param {number} association_id - ID de l'association
 * @param {number} evenement_id - ID de l'événement à supprimer
 */
export const supprimerEvenement = createApiDelete(`${EVENEMENTS_BASE_URL}/event`);

/**
 * Obtient les événements d'une période donnée (jour, semaine ou mois).
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {string} date - Chaîne de date / période recherchée
 */
export const getEvenementsMois = createApiGet(`${EVENEMENTS_BASE_URL}/obtenir_evenements`);
