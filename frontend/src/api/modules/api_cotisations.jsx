import { API_BASE_URL, createApiDelete, createApiGet, createApiPost, createApiPut } from "../base";

const COTISATIONS_BASE_URL = `${API_BASE_URL}/cotisations`;

/** Obtenir les cotisations de l'association */
export const obtenirCotisationsAsso = (association_id) => 
    createApiGet(`${COTISATIONS_BASE_URL}/${association_id}/cotisations`)();

/** Créer une nouvelle cotisation */
export const creerNouvelleCotisation = (association_id, data) => 
    createApiPost(`${COTISATIONS_BASE_URL}/${association_id}/cotisation`)(data);

/** Modifier les détails d'une cotisation */
export const modifierCotisation = (association_id, cotisation_id, data) => 
    createApiPut(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}`)(data);

/** Supprimer une cotisation */
export const supprimerCotisation = (association_id, cotisation_id) => 
    createApiDelete(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}`)();

/** Ajouter un membre à une cotisation */
export const ajouterMembreCotisation = (association_id, cotisation_id, user_id) => 
    createApiPost(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}/membres`)({ utilisateur_id: user_id });

/** Retirer un membre d'une cotisation */
export const supprimerMembreCotisation = (association_id, cotisation_id, user_id) => 
    createApiDelete(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}/membres/${user_id}`)();

/** Exporter les membres d'une cotisation sous forme de CSV */
export const exporterMembresCotisation = (association_id, cotisation_id) => 
    createApiGet(`${COTISATIONS_BASE_URL}/${association_id}/cotisation/${cotisation_id}/export`, true)();
