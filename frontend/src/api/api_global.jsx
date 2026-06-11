import { API_BASE_URL, createApiDelete, createApiGet, createApiPost } from "./base";

const LOGIN_BASE_URL = `${API_BASE_URL}/login`;


/** Récupère la liste des permissions, avec pagination
 * args :
 *  - { per_page, page, query }
 */
export const getPermissions = createApiGet(`${LOGIN_BASE_URL}/permissions`);

/** Supprime la permission
 * args :
 *  - id : id de la perm à supprimer
 */
export const deletePermission = createApiDelete(`${LOGIN_BASE_URL}/permissions`);

/** Supprime la permission
 * args :
 *  - { user_id, permission }
 */
export const addPermission = createApiPost(`${LOGIN_BASE_URL}/permissions`);

/** Fetch l'id de l'utilisateur actuel
 * 
 */
export const obtenirIdUser = createApiGet(`${LOGIN_BASE_URL}/current_user_id`);

/** Fetch l'état de l'api
 * 
 */
export const obtenirAlive = () => createApiGet(`${API_BASE_URL}/alive`)();


export async function seDeconnecter() {
  await fetch(`${API_BASE_URL}/login/deconnexion`, {
    method: "POST",
    credentials: "include"
  });
}

export async function seConnecter(username, password) {
  const res = await fetch(`${API_BASE_URL}/login/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important pour gérer les cookies de session
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  return data.connecte; // Flask renvoie { "connecte": true/false }
}

export async function resetMotDePasse(username) {
  const res = await fetch(`${API_BASE_URL}/login/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important pour gérer les cookies de session
    body: JSON.stringify({ username }),
  });

  const data = await res.json();
  return data.sent; // Flask renvoie { "connecte": true/false }
}

export async function setNouveauMDP(token, password) {
  const res = await fetch(`${API_BASE_URL}/login/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important pour gérer les cookies de session
    body: JSON.stringify({ token, password }),
  });

  const data = await res.json();
  return data.set; // Flask renvoie { "connecte": true/false }
}

/** Vérifie si la permission *perm* appartient à l'utilisateur *user_id*
 *   @param {string} perm : la chaine de caractères représentant la permission
 *   @param {number} user_id : l'id de l'utilisateur
 */
export const verifierPermission = createApiGet(`${LOGIN_BASE_URL}/verifier_permission`)

/** Marque tous les utilisateurs comme baptisés, sauf ceux de P00
 * 
 */
export const baptiserToutLeMonde = createApiPost(`${LOGIN_BASE_URL}/baptiser_tous`)
