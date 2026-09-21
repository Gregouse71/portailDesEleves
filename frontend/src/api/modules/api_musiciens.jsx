// frontend/src/api/modules/api_musiciens.jsx

import { API_BASE_URL, createApiGet } from "../base";

const MUSICIENS_BASE_URL = `${API_BASE_URL}/musiciens`;

/**
 * Récupère la liste des musiciens pour une association avec options de recherche.
 * @param {number} associationId - L'ID de l'association.
 * @param {object} params - { instrument?: string, search?: string, niveau?: string }
 * @returns {Promise<{ musiciens: Array<object>, available_instruments: Array<object>, total_musiciens: number }>}
 */
export const getMusiciens = (associationId, params = {}) => {
    return createApiGet(`${MUSICIENS_BASE_URL}/${associationId}`)(params);
};

