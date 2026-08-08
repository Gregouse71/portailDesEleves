import { BIBLIOTHEQUE_BASE_URL, createApiPost, createApiPut, createApiDelete, createApiGet } from "../base";

/** Recupere la liste paginee des livres, avec recherche et filtres
 * args :
 *  - { page, per_page, query, serie, disponible, order_by, order_asc }
 */
export const getListeLivres = createApiGet(`${BIBLIOTHEQUE_BASE_URL}/livres`)

/** Ajoute un nouveau livre
 * args :
 *  - data : { serie, tome, auteur, edition, reference, etat }
 */
export const ajouterLivre = createApiPost(`${BIBLIOTHEQUE_BASE_URL}/livres`)

/** Modifie un livre existant
 * args :
 *  - data : { serie, tome, auteur, edition, reference, etat }
 *  - id : id du livre
 * appel : modifierLivre(data, id)
 */
export const modifierLivre = createApiPut(`${BIBLIOTHEQUE_BASE_URL}/livres`)

/** Supprime un livre (impossible si actuellement emprunte)
 * args :
 *  - id : id du livre a supprimer
 */
export const supprimerLivre = createApiDelete(`${BIBLIOTHEQUE_BASE_URL}/livres`)

/** Emprunte un livre disponible
 * args :
 *  - data : { livre_id, utilisateur_id }
 */
export const emprunterLivre = createApiPost(`${BIBLIOTHEQUE_BASE_URL}/emprunter`)

/** Marque un livre emprunte comme retourne
 * args :
 *  - data : { livre_id }
 */
export const retournerLivre = createApiPost(`${BIBLIOTHEQUE_BASE_URL}/retourner`)

/** Historique des emprunts, le plus recent en premier
 * args :
 *  - { page, per_page, utilisateur_id, en_cours_seulement }
 */
export const listeEmprunts = createApiGet(`${BIBLIOTHEQUE_BASE_URL}/emprunts`)