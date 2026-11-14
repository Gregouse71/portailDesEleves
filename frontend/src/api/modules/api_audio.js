import { API_BASE_URL, createApiDelete, createApiGet, createApiPatch, createApiPost, createApiPostFormData } from "../base";

const AUDIO_BASE_URL = `${API_BASE_URL}/audio`;

/**
 * Récupère tous les albums d'une association.
 * @param {number} associationId - ID de l'association
 * @returns {Promise<Array<object>>} Liste des albums
 */
export const getAlbums = (associationId) => createApiGet(`${AUDIO_BASE_URL}/${associationId}/albums`)();

/**
 * Récupère les détails d'un album et ses pistes audio.
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {number} albumId - ID de l'album
 * @returns {Promise<object>} Détails de l'album et liste des pistes
 */
export const getAlbum = createApiGet(`${AUDIO_BASE_URL}/album`);

/**
 * Ajoute un nouvel album à une association.
 * @param {number} associationId - ID de l'association
 * @param {string} name - Nom du nouvel album
 * @returns {Promise<object>} Album créé
 */
export const addAlbum = (associationId, name) => {
    const data = { name };
    return createApiPost(`${AUDIO_BASE_URL}/${associationId}/album`)(data);
};

/**
 * Supprime un album d'une association.
 * @param {number} associationId - ID de l'association
 * @param {number} albumId - ID de l'album à supprimer
 * @returns {Promise<object>}
 */
export const deleteAlbum = createApiDelete(`${AUDIO_BASE_URL}/album`);

/**
 * Met à jour le nom ou la position d'un album.
 * @param {number} associationId - ID de l'association
 * @param {number} albumId - ID de l'album à modifier
 * @param {string} name - Nouveau nom de l'album
 * @param {number} position - Nouvelle position d'affichage
 * @returns {Promise<object>}
 */
export const updateAlbum = (associationId, albumId, name, position) => {
    const data = { name, position };
    return createApiPatch(`${AUDIO_BASE_URL}/${associationId}/album/${albumId}`)(data);
};

/**
 * Ajoute un fichier audio à un album.
 * @param {number} associationId - ID de l'association
 * @param {number} albumId - ID de l'album
 * @param {FormData} formData - Données multipart contenant le fichier et le titre
 * @returns {Promise<object>} Piste audio créée
 */
export const addAudio = (associationId, albumId, formData) =>
    createApiPostFormData(`${AUDIO_BASE_URL}/${associationId}/album/${albumId}/audio`)(formData);

/**
 * Supprime un fichier audio d'une association.
 * @param {number} associationId - ID de l'association
 * @param {number} audioId - ID du fichier audio à supprimer
 * @returns {Promise<object>}
 */
export const removeAudio = (associationId, audioId) =>
    createApiDelete(`${AUDIO_BASE_URL}/${associationId}/audio/${audioId}`)();

/**
 * Met à jour le titre ou la position d'une piste audio.
 * @param {number} associationId - ID de l'association
 * @param {number} audioId - ID de la piste audio à modifier
 * @param {string} name - Nouveau titre
 * @param {number} position - Nouvelle position dans l'album
 * @returns {Promise<object>}
 */
export const updateAudio = (associationId, audioId, name, position) => {
    const data = { name, position };
    return createApiPatch(`${AUDIO_BASE_URL}/${associationId}/audio/${audioId}`)(data);
};
