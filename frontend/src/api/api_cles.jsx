import { API_BASE_URL, createApiGet, createApiPost } from "./base";

const CLES_BASE_URL = `${API_BASE_URL}/cles`;

/** Liste SES clés + son éligibilité (2A+ ou non) */
export const listerCles = createApiGet(`${CLES_BASE_URL}/liste`);

/** Crée une clé : la valeur en clair n'est retournée qu'une seule fois */
export const creerCle = createApiPost(`${CLES_BASE_URL}/creer`);

/** Révoque une de SES clés */
export const revoquerCle = createApiPost(`${CLES_BASE_URL}/revoquer`);
