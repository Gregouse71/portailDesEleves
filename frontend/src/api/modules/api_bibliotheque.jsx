import { API_BASE_URL, createApiPost, createApiPut, createApiDelete, createApiGet, createApiPostFormData } from "../base";

export const BIBLIOTHEQUE_BASE_URL = `${API_BASE_URL}/bibliotheque`;

/** Recupere la liste paginee des livres d'une asso, avec recherche et filtres
 * appel : getListeLivres(asso_id, { page, per_page, query, serie, disponible, order_by, order_asc })
 */
export const getListeLivres = (asso_id, params) =>
    createApiGet(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/livres`)(params)

/** Ajoute un nouveau livre a l'asso
 * appel : ajouterLivre(asso_id, { serie, tome, auteur, edition, reference, etat })
 */
export const ajouterLivre = (asso_id, data) =>
    createApiPost(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/livres`)(data)

/** Modifie un livre existant
 * appel : modifierLivre(asso_id, data, livre_id)
 */
export const modifierLivre = (asso_id, data, id) =>
    createApiPut(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/livres`)(data, id)

/** Supprime un livre (impossible si actuellement emprunte)
 * appel : supprimerLivre(asso_id, livre_id)
 */
export const supprimerLivre = (asso_id, id) =>
    createApiDelete(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/livres`)(id)

/** Emprunte un livre disponible
 * appel : emprunterLivre(asso_id, { livre_id, utilisateur_id })
 */
export const emprunterLivre = (asso_id, data) =>
    createApiPost(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/emprunter`)(data)

/** Marque un livre emprunte comme retourne
 * appel : retournerLivre(asso_id, { livre_id })
 */
export const retournerLivre = (asso_id, data) =>
    createApiPost(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/retourner`)(data)

/** Historique des emprunts, le plus recent en premier
 * appel : listeEmprunts(asso_id, { page, per_page, utilisateur_id, en_cours_seulement })
 */
export const listeEmprunts = (asso_id, params) =>
    createApiGet(`${BIBLIOTHEQUE_BASE_URL}/${asso_id}/emprunts`)(params)

/** Importe des livres depuis un fichier Excel (colonnes attendues : Auteur, Edition, Série, Tome, Référence, Etat)
 * appel : importerLivresExcel(asso_id, formData) -> Promise<{ crees, ignores }>
 * (formData doit contenir le fichier sous la cle "fichier")
 */
export const importerLivresExcel =
    createApiPostFormData(`${BIBLIOTHEQUE_BASE_URL}`)