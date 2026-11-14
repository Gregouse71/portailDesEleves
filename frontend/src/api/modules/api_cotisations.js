import { API_BASE_URL, createApiDelete, createApiGet, createApiPost, createApiPut } from "../base";

const COTISATIONS_BASE_URL = `${API_BASE_URL}/cotisations`;

/**
 * Obtient la liste des cotisations d'une association.
 * @param {number} association_id - ID de l'association
 */
export const obtenirCotisationsAsso = (association_id) =>
    createApiGet(`${COTISATIONS_BASE_URL}/${association_id}/cotisations`)();

/**
 * Crée une nouvelle cotisation pour une association.
 * @param {number} association_id - ID de l'association
 * @param {object} data - Paramètres de la cotisation (nom, date_debut, date_fin, etc.)
 */
export const creerNouvelleCotisation = (association_id, data) =>
    createApiPost(`${COTISATIONS_BASE_URL}/${association_id}/cotisation`)(data);

/**
 * Modifie les détails d'une cotisation existante.
 * @param {number} association_id - ID de l'association
 * @param {number} cotisation_id - ID de la cotisation
 * @param {object} data - Nouveaux paramètres de la cotisation
 */
export const modifierCotisation = (association_id, cotisation_id, data) =>
    createApiPut(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}`)(data);

/**
 * Supprime une cotisation d'une association.
 * @param {number} association_id - ID de l'association
 * @param {number} cotisation_id - ID de la cotisation à supprimer
 */
export const supprimerCotisation = (association_id, cotisation_id) =>
    createApiDelete(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}`)();

/**
 * Ajoute un utilisateur comme cotisant à une cotisation.
 * @param {number} association_id - ID de l'association
 * @param {number} cotisation_id - ID de la cotisation
 * @param {number} user_id - ID de l'utilisateur à ajouter
 */
export const ajouterMembreCotisation = (association_id, cotisation_id, user_id) =>
    createApiPost(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}/membres`)({ utilisateur_id: user_id });

/**
 * Retire un utilisateur d'une cotisation.
 * @param {number} association_id - ID de l'association
 * @param {number} cotisation_id - ID de la cotisation
 * @param {number} user_id - ID de l'utilisateur à retirer
 */
export const supprimerMembreCotisation = (association_id, cotisation_id, user_id) =>
    createApiDelete(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}/membres/${user_id}`)();

/**
 * Exporte la liste des membres d'une cotisation sous forme de fichier CSV.
 * @param {number} association_id - ID de l'association
 * @param {number} cotisation_id - ID de la cotisation
 */
export const exporterMembresCotisation = (association_id, cotisation_id) =>
    createApiGet(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}/export`, true)();
