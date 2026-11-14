// frontend/src/api/modules/api_audio.jsx

import { API_BASE_URL, createApiDelete, createApiGet, createApiPatch, createApiPost, createApiPostFormData } from "../base";

const AUDIO_BASE_URL = `${API_BASE_URL}/audio`;

/**
 * Gets all albums and their songs for an association.
 * @param {number} associationId - The ID of the association.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of album objects with nested songs.
 */
export const getAlbums = (associationId) => createApiGet(`${AUDIO_BASE_URL}/${associationId}/albums`)();

/**
 * Gets all albums and their songs for an association.
 * @param {number} associationId - The ID of the association.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of album objects with nested songs.
 */
export const getAlbum = createApiGet(`${AUDIO_BASE_URL}/album`);

/**
 * Adds a new album to an association.
 * @param {number} associationId - The ID of the association.
 * @param {string} name - The name of the new album.
 * @returns {Promise<object>} - A promise that resolves to the new album object.
 */
export const addAlbum = (associationId, name) => {
    const data = { name };
    return createApiPost(`${AUDIO_BASE_URL}/${associationId}/album`)(data);
};

/**
 * Deletes an album.
 * @param {number} associationId - The ID of the association.
 * @param {number} albumId - The ID of the album to delete.
 * @returns {Promise<object>}
 */
export const deleteAlbum = createApiDelete(`${AUDIO_BASE_URL}/album`);

/**
 * Updates an album's details.
 * @param {number} associationId - The ID of the association.
 * @param {number} albumId - The ID of the album to update.
 * @param {string} name - The new name for the album.
 * @param {number} position - The new position for the album.
 * @returns {Promise<object>}
 */
export const updateAlbum = (associationId, albumId, name, position) => {
    const data = { name, position };
    return createApiPatch(`${AUDIO_BASE_URL}/${associationId}/album/${albumId}`)(data);
};

// --- Audios (Songs) ---

/**
 * Adds an audio file to a specific album.
 * @param {number} associationId - The ID of the parent association.
 * @param {number} albumId - The ID of the album.
 * @param {FormData} formData - The form data containing the file and song name.
 * @returns {Promise<object>} - A promise that resolves to the new audio object.
 */
export const addAudio = (associationId, albumId, formData) => createApiPostFormData(`${AUDIO_BASE_URL}/${associationId}/album/${albumId}/audio`)(formData);

/**
 * Removes an audio file.
 * @param {number} associationId - The ID of the parent association.
 * @param {number} audioId - The ID of the audio file to remove.
 * @returns {Promise<object>} - A promise that resolves to the response from the server.
 */
export const removeAudio = (associationId, audioId) => createApiDelete(`${AUDIO_BASE_URL}/${associationId}/audio/${audioId}`)();


/**
 * Updates an audio's details.
 * @param {number} associationId - The ID of the association.
 * @param {number} audioId - The ID of the audio to update.
 * @param {string} name - The new name for the audio.
 * @param {number} position - The new position for the audio.
 * @returns {Promise<object>}
 */
export const updateAudio = (associationId, audioId, name, position) => {
    const data = { name, position };
    return createApiPatch(`${AUDIO_BASE_URL}/${associationId}/audio/${audioId}`)(data);
};