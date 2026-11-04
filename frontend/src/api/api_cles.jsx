import { API_BASE_URL, createApiDelete, createApiGet, createApiPost } from "./base";

const CLES_BASE_URL = `${API_BASE_URL}/cles`;

/** Liste SES clés + son droit d'en créer (permission cle_api) */
export const listerCles = createApiGet(`${CLES_BASE_URL}/liste`);

/** Crée une clé : la valeur en clair n'est retournée qu'une seule fois */
export const creerCle = createApiPost(`${CLES_BASE_URL}/creer`);

/** Révoque une de SES clés, par son id */
export const revoquerCle = createApiDelete(`${CLES_BASE_URL}/revoquer`);

/** Révoque toutes les clés d'un utilisateur, par son id (superutilisateur) */
export const revoquerToutesCle = createApiDelete(`${CLES_BASE_URL}/revoquer_tout`);

/** Récupère la documentation de l'api */
export const obtenirSwagger = createApiGet(`${API_BASE_URL}/apispec_1.json`)