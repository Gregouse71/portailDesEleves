import { API_BASE_URL, createApiGet } from "./base";

const CHAT_BASE_URL = `${API_BASE_URL}/chat`;

/**
 * Récupère les messages du chat antérieurs à une date donnée.
 * @param {string|number} last_sent - Timestamp ou date du dernier message chargé (ou 0 pour les plus récents)
 * @returns {Promise<Array<object>>} Liste des messages
 */
export const obtenirPlusDeMessages = (last_sent) =>
    createApiGet(`${CHAT_BASE_URL}/more`)({}, last_sent);
