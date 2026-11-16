import { API_BASE_URL, createApiDelete, createApiGet, createApiPost } from "./base";

const LOGIN_BASE_URL = `${API_BASE_URL}/login`;

/**
 * Récupère la liste paginée des utilisateurs et leurs permissions.
 * @param {{ page?: number, per_page?: number, pseudo?: string, identite?: string, email?: string, promo?: string, cycle?: string, permission?: string, est_baptise?: string }} params
 */
export const getPermissions = createApiGet(`${LOGIN_BASE_URL}/permissions`);

/**
 * Supprime une permission accordée à un utilisateur.
 * @param {number} id - ID de la permission à supprimer
 */
export const deletePermission = createApiDelete(`${LOGIN_BASE_URL}/permissions`);

/**
 * Ajoute une permission à un utilisateur.
 * @param {{ user_id: number, permission: string }} data
 */
export const addPermission = createApiPost(`${LOGIN_BASE_URL}/permissions`);

/**
 * Récupère l'ID de l'utilisateur actuellement connecté.
 * @returns {Promise<{ id_utilisateur: number }>}
 */
export const obtenirIdUser = createApiGet(`${LOGIN_BASE_URL}/current_user_id`);

/**
 * Vérifie l'état du serveur API (mode maintenance ou actif).
 */
export const obtenirAlive = () => createApiGet(`${API_BASE_URL}/alive`)();

/**
 * Déconnecte l'utilisateur de la session courante.
 */
export const seDeconnecter = () => createApiPost(`${LOGIN_BASE_URL}/deconnexion`)({});

/**
 * Authentifie un utilisateur avec son identifiant et son mot de passe.
 * @param {string} username - Nom d'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<boolean>} `true` si la connexion a réussi, `false` sinon
 */
export const seConnecter = async (username, password) => {
    const data = await createApiPost(`${LOGIN_BASE_URL}/connexion`)({ username, password });
    return Boolean(data?.connecte);
};

/**
 * Demande l'envoi d'un email de réinitialisation de mot de passe.
 * @param {string} username - Nom d'utilisateur ou adresse email
 * @returns {Promise<boolean>} `true` si la demande a bien été envoyée
 */
export const resetMotDePasse = async (username) => {
    const data = await createApiPost(`${LOGIN_BASE_URL}/reset`)({ username });
    return Boolean(data?.sent);
};

/**
 * Définit un nouveau mot de passe à l'aide d'un jeton de réinitialisation.
 * @param {string} token - Jeton de réinitialisation reçu par email
 * @param {string} password - Nouveau mot de passe
 * @returns {Promise<boolean>} `true` si le mot de passe a été modifié avec succès
 */
export const setNouveauMDP = async (token, password) => {
    const data = await createApiPost(`${LOGIN_BASE_URL}/new`)({ token, password });
    return Boolean(data?.set);
};

/**
 * Vérifie si la permission `perm` appartient à l'utilisateur `user_id`.
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {string} perm - Nom de la permission à vérifier
 * @param {number} user_id - ID de l'utilisateur
 * @returns {Promise<boolean>}
 */
export const verifierPermission = createApiGet(`${LOGIN_BASE_URL}/verifier_permission`);

/**
 * Marque tous les utilisateurs comme baptisés (hors P00).
 */
export const baptiserToutLeMonde = createApiPost(`${LOGIN_BASE_URL}/baptiser_tous`);

/**
 * Génère un jeton de réinitialisation de mot de passe pour un utilisateur (réservé aux administrateurs).
 * @param {{ user_id: number }} data
 * @returns {Promise<{ token: string }>}
 */
export const generateResetLinkAdmin = createApiPost(`${LOGIN_BASE_URL}/admin/generate_reset_link`);

/**
 * Force la modification du mot de passe d'un utilisateur (réservé aux administrateurs).
 * @param {{ user_id: number, password: string }} data
 */
export const setPasswordAdmin = createApiPost(`${LOGIN_BASE_URL}/admin/set_password`);
