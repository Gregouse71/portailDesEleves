import { API_BASE_URL, createApiDelete, createApiGet, createApiPost, createApiPut, handleResponse } from "./base";

const EVENEMENTS_BASE_URL = `${API_BASE_URL}/evenements`;

/** Obtenir les événements de l'asso
 * args :
 *  - asso_id : id de l'asso
 * 
 * renvoie: une liste des id des événements de l'asso
 */
export const obtenirEvenementsAsso = createApiGet(`${EVENEMENTS_BASE_URL}/asso`)

/** Obtenir les détails d'un événement
 * args :
 *  - event_id : id de l'evenement
 */
export const obteniEvenement = createApiGet(`${EVENEMENTS_BASE_URL}/event`)

/** Créer un nouvel événement
 * args :
 *  - data  : données de l'événement à créer
 *  - asso_id : id de l'asso
 * 
 * renvoie :
 *  - l'id de l'événement créee
 */
export const creerNouvelEvenement = createApiPost(`${EVENEMENTS_BASE_URL}/event`)

/** Modifier les détails d'un événement
 * args :
 *  - data  : nouveau paramètres de l'événement
 *  - association_id : id de l'asso de l'événement
 *  - id    : id de l'élection
 */
export const modifierEvenement = createApiPut(`${EVENEMENTS_BASE_URL}/event`)

/** Supprimer une élection
 * args :
 *  - id : id de l'election
 */
export const supprimerEvenement = createApiDelete(`${EVENEMENTS_BASE_URL}/event`)

/** Obtenir les prochains événements
 * args :
 *  - date : paramètre spécifiant les événements qu'on veut
*/
export const getEvenementsMois = createApiGet(`${EVENEMENTS_BASE_URL}/obtenir_evenements`)
