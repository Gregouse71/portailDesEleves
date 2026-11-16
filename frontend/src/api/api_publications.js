import {
    API_BASE_URL,
    createApiDelete,
    createApiGet,
    createApiPatch,
    createApiPost,
    createApiPostFormData,
    createApiPut,
} from "./base";

const PUBLICATIONS_BASE_URL = `${API_BASE_URL}/publications`;

/**
 * Récupère les publications associées à un tag donné (ex: "Vendôme", "Palum") avec pagination et recherche.
 * @param {string} tag - Nom du tag
 * @param {number} [page] - Numéro de page
 * @param {number} [per] - Nombre d'éléments par page
 * @param {string} [query] - Filtre de recherche textuel
 * @returns {Promise<{ publications: Array<object>, count: number, totalPages: number }>}
 */
export const getPublicationsByTag = (tag, page, per, query) =>
    createApiGet(`${PUBLICATIONS_BASE_URL}/tag`)({ page, per, ...(query ? { query } : {}) }, tag);

/**
 * Récupère la liste des IDs des publications d'une association avec pagination par offset/limit.
 * @param {number} asso_id - ID de l'association
 * @param {number} [offset] - Décalage pour la pagination
 * @param {number} [limit] - Nombre maximum de publications à renvoyer
 * @returns {Promise<Array<number>>}
 */
export const obtenirPublicationsAsso = (asso_id, offset, limit) =>
    createApiGet(`${PUBLICATIONS_BASE_URL}/obtenir_publications_asso`)({ offset, limit }, asso_id);

/**
 * Récupère les publications les plus récentes accessibles à l'utilisateur connecté.
 * @param {{ per?: number, page?: number, query?: string }} params - Paramètres de pagination et recherche
 */
export const obtenirPublicationsRecentes = createApiGet(`${PUBLICATIONS_BASE_URL}/recent`);

/**
 * Récupère les détails complets d'une publication et ses commentaires.
 * @param {number} post_id - ID de la publication
 */
export const obtenirPublication = (post_id) =>
    createApiGet(`${PUBLICATIONS_BASE_URL}/obtenir_publication`)({}, post_id);

/**
 * Supprime une publication d'une association.
 * @param {number} asso_id - ID de l'association
 * @param {number} publication_id - ID de la publication à supprimer
 */
export const supprimerPublication = (asso_id, publication_id) =>
    createApiDelete(`${PUBLICATIONS_BASE_URL}/${asso_id}/supprimer_publication`)(publication_id);

/**
 * Supprime un commentaire d'une publication.
 * @param {number} comment_id - ID du commentaire à supprimer
 */
export const supprimerCommentaire = (comment_id) =>
    createApiDelete(`${PUBLICATIONS_BASE_URL}/supprimer_commentaire`)(comment_id);

/**
 * Crée une nouvelle publication pour une association.
 * @param {number} id_asso - ID de l'association
 * @param {object} data - Contenu et options de la publication
 * @returns {Promise<{ message: string, id_publication: number }>}
 */
export const creerNouvellePublication = (id_asso, data) =>
    createApiPost(`${PUBLICATIONS_BASE_URL}/${id_asso}/creer_nouvelle_publication`)(data);

/**
 * Modifie une publication existante d'une association.
 * @param {number} id_asso - ID de l'association
 * @param {number} id_post - ID de la publication à modifier
 * @param {object} data - Nouveaux paramètres de la publication
 */
export const modifierPublication = (id_asso, id_post, data) =>
    createApiPut(`${PUBLICATIONS_BASE_URL}/${id_asso}/modifier_publication`)(data, id_post);

/**
 * Modifie le contenu d'un commentaire existant.
 * @param {number} id_comment - ID du commentaire
 * @param {{ contenu: string }} data - Nouveau texte du commentaire
 */
export const modifierCommentaire = (id_comment, data) =>
    createApiPut(`${PUBLICATIONS_BASE_URL}/modifier_commentaire`)(data, id_comment);

/**
 * Ajoute ou retire le "J'aime" de l'utilisateur connecté sur une publication.
 * @param {number} id_post - ID de la publication
 */
export const modifierLikePost = (id_post) =>
    createApiPatch(`${PUBLICATIONS_BASE_URL}/modifier_like_post`)({}, id_post);

/**
 * Ajoute ou retire le "J'aime" de l'utilisateur connecté sur un commentaire.
 * @param {number} id_comment - ID du commentaire
 */
export const modifierLikeComment = (id_comment) =>
    createApiPatch(`${PUBLICATIONS_BASE_URL}/modifier_like_comment`)({}, id_comment);

/**
 * Ajoute un nouveau commentaire sur une publication.
 * @param {number} id_post - ID de la publication
 * @param {string} comment - Contenu textuel du commentaire
 */
export const creerNouveauCommentaire = (id_post, comment) =>
    createApiPost(`${PUBLICATIONS_BASE_URL}/${id_post}/creer_nouveau_commentaire`)({ contenu: comment });

/**
 * Téléverse une pièce jointe et/ou une miniature pour une publication.
 * @param {number} assoId - ID de l'association
 * @param {number} publicationId - ID de la publication
 * @param {File|null} file - Fichier joint (PDF, image, etc.)
 * @param {File|null} miniatureFile - Fichier de miniature personnalisée
 */
export const ajouterContenuPublication = async (assoId, publicationId, file, miniatureFile) => {
    const formData = new FormData();
    if (file) {
        formData.append("fichier_joint", file);
    }
    if (miniatureFile) {
        formData.append("miniature", miniatureFile);
    }
    const data = await createApiPostFormData(`${PUBLICATIONS_BASE_URL}/${assoId}/${publicationId}/add_content`)(formData);
    return data
        ? { success: true, message: data.message, filePath: data.fichier_joint }
        : { success: false, message: "Erreur lors du téléversement du fichier" };
};
