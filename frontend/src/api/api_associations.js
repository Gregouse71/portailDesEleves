import {
    API_BASE_URL,
    createApiDelete,
    createApiGet,
    createApiPatch,
    createApiPost,
    createApiPostFormData,
    createApiPut,
} from "./base";

const ASSOCIATIONS_BASE_URL = `${API_BASE_URL}/associations`;

/**
 * Obtient la liste des médias d'une association.
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {number} asso_id - ID de l'association
 */
export const obtenirPhotosAsso = createApiGet(`${ASSOCIATIONS_BASE_URL}/content`);

/**
 * Supprime un média d'une association.
 * @param {number} association_id - ID de l'association
 * @param {number} media_id - ID du média à supprimer
 */
export const supprimerPhotoAsso = createApiDelete(`${ASSOCIATIONS_BASE_URL}/content`);

/**
 * Renomme un média d'une association.
 * @param {{ name: string }} data - Nouveau nom du média
 * @param {number} association_id - ID de l'association
 * @param {number} mandat_id - ID du mandat
 * @param {number} media_id - ID du média
 */
export const renommerPhotoAsso = createApiPut(`${ASSOCIATIONS_BASE_URL}/content`);

/**
 * Charge les détails d'un mandat (membres, médias, logo, bannière).
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {number} mandat_id - ID du mandat
 */
export const chargerMandat = createApiGet(`${ASSOCIATIONS_BASE_URL}/mandat`);

/**
 * Ajoute un lien vidéo externe aux médias d'un mandat d'association.
 * @param {{ url: string }} data - URL de la vidéo
 * @param {number} association_id - ID de l'association
 * @param {number} mandat_id - ID du mandat
 */
export const ajouterLienVideoAsso = createApiPost(`${ASSOCIATIONS_BASE_URL}/add_content`);

/**
 * Crée une nouvelle association.
 * @param {string} nom - Nom de l'association
 * @param {string} description - Description HTML de l'association
 * @param {string} type_association - Type d'association (ex: "Club BDE", "Asso Loi 1901")
 * @param {number|string} ordre_importance - Ordre d'affichage
 * @param {boolean} a_cacher_aux_nouveaux - Si l'association doit être masquée aux élèves non baptisés
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export const ajouterAsso = async (nom, description, type_association, ordre_importance, a_cacher_aux_nouveaux) => {
    try {
        const data = await createApiPost(`${ASSOCIATIONS_BASE_URL}/route_creer_asso`)({
            nom,
            description,
            type_association,
            ordre_importance,
            a_cacher_aux_nouveaux,
        });
        if (!data) {
            return { success: false, message: "Erreur lors de l'ajout de l'association" };
        }
        return { success: true, message: data.message };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Modifie la description d'une association.
 * @param {number} asso_id - ID de l'association
 * @param {string} new_desc - Nouvelle description HTML
 */
export const modifierDescriptionAsso = (asso_id, new_desc) =>
    createApiPatch(`${ASSOCIATIONS_BASE_URL}/${asso_id}/editer_description`)({ new_desc });

/**
 * Modifie l'ordre d'importance (priorité d'affichage) d'une association.
 * @param {number} asso_id - ID de l'association
 * @param {number} ordre_importance - Nouvel ordre d'importance
 */
export const modifierOrdreImportanceAsso = (asso_id, ordre_importance) =>
    createApiPatch(`${ASSOCIATIONS_BASE_URL}/${asso_id}/modifier_ordre_importance`)({ ordre_importance });

/**
 * Modifie le nom d'une association.
 * @param {number} asso_id - ID de l'association
 * @param {string} nom - Nouveau nom
 */
export const modifierNomAsso = (asso_id, nom) =>
    createApiPatch(`${ASSOCIATIONS_BASE_URL}/${asso_id}/modifier_nom`)({ nom });

/**
 * Ajoute un utilisateur comme membre d'un mandat d'association.
 * @param {number} associationId - ID de l'association
 * @param {number} mandatId - ID du mandat
 * @param {number} membreId - ID de l'utilisateur à ajouter
 */
export const ajouterMembre = (associationId, mandatId, membreId) =>
    createApiPost(`${ASSOCIATIONS_BASE_URL}/${associationId}/ajouter_membre/${mandatId}/${membreId}`)({});

/**
 * Crée un nouveau mandat pour une association.
 * @param {number} associationId - ID de l'association
 * @param {string} nom - Nom du mandat
 * @param {number} position - Position d'affichage du mandat
 */
export const ajouterMandat = (associationId, nom, position) =>
    createApiPost(`${ASSOCIATIONS_BASE_URL}/${associationId}/ajouter_mandat/${nom}`)({ position });

/**
 * Modifie les informations d'un mandat d'association.
 * @param {number} associationId - ID de l'association
 * @param {number} mandatId - ID du mandat
 * @param {string} nom - Nouveau nom du mandat
 * @param {number} pos - Nouvelle position d'affichage
 * @param {boolean} actuel - Indique s'il s'agit du mandat actuel
 */
export const modifierMandat = (associationId, mandatId, nom, pos, actuel) =>
    createApiPatch(`${ASSOCIATIONS_BASE_URL}/${associationId}/modifier_mandat/${mandatId}`)({
        nom,
        position: pos,
        actuel,
    });

/**
 * Supprime un mandat d'une association.
 * @param {number} associationId - ID de l'association
 * @param {number} mandatId - ID du mandat à supprimer
 */
export const supprimerMandat = (associationId, mandatId) =>
    createApiPost(`${ASSOCIATIONS_BASE_URL}/${associationId}/supprimer_mandat/${mandatId}`)({});

/**
 * Retire un membre d'un mandat d'association.
 * @param {number} associationId - ID de l'association
 * @param {number} mandatId - ID du mandat
 * @param {number} membreId - ID de l'utilisateur à retirer
 */
export const retirerMembre = (associationId, mandatId, membreId) =>
    createApiDelete(`${ASSOCIATIONS_BASE_URL}/${associationId}/retirer_membre/${mandatId}/${membreId}`)();

/**
 * Modifie le rôle, la position ou le statut admin d'un membre dans un mandat.
 * @param {{ role: string, position: number|string, admin: boolean }} data - Nouveaux paramètres du membre
 * @param {number} association_id - ID de l'association
 * @param {number} mandat_id - ID du mandat
 * @param {number} membre_id - ID du membre
 */
export const modifierMembreAsso = createApiPatch(`${ASSOCIATIONS_BASE_URL}/modifier_membre`);

/**
 * Téléverse un fichier média (image) dans un mandat d'association.
 * @param {number} associationId - ID de l'association
 * @param {number} mandatId - ID du mandat
 * @param {File} file - Fichier à téléverser
 */
export const ajouterContenuAsso = async (associationId, mandatId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const data = await createApiPostFormData(`${ASSOCIATIONS_BASE_URL}/add_content`)(formData, associationId, mandatId);
    return data
        ? { success: true, message: data.message, fileName: data.file_name }
        : { success: false, message: "Erreur lors du téléversement du fichier" };
};

/**
 * Téléverse et définit directement un nouveau logo ou une nouvelle bannière pour une association (ou un mandat).
 * @param {number} associationId - ID de l'association
 * @param {"logo"|"banniere"} type - Type d'image à modifier
 * @param {File} file - Fichier image
 * @param {number|null} [mandatId=null] - ID du mandat cible (ou mandat actuel par défaut)
 */
export const uploadLogoBanniereAsso = async (associationId, type, file, mandatId = null) => {
    const formData = new FormData();
    formData.append("file", file);
    const params = mandatId ? [type, mandatId] : [type];
    const data = await createApiPostFormData(`${ASSOCIATIONS_BASE_URL}/${associationId}/upload_logo_banniere`)(formData, ...params);
    return data
        ? { success: true, message: data.message, fileName: data.file_name }
        : { success: false, message: "Erreur lors du téléversement du fichier" };
};

/**
 * Change le logo ou la bannière d'un mandat à partir d'un média existant (ou 0 pour retirer).
 * @param {number} asso_id - ID de l'association
 * @param {"logo"|"banniere"} photo_type - Type d'image ("logo" ou "banniere")
 * @param {number} mandat_id - ID du mandat
 * @param {number} new_id - ID du média (ou 0 pour retirer)
 */
export const changerPhotoAsso = (asso_id, photo_type, mandat_id, new_id) =>
    createApiPost(`${ASSOCIATIONS_BASE_URL}/${asso_id}/modifier_logo_banniere/${photo_type}/${mandat_id}/${new_id}`)({});

/**
 * Vérifie les droits et l'appartenance de l'utilisateur connecté vis-à-vis d'une association.
 * @param {number} asso_id - ID de l'association
 * @returns {Promise<{ is_membre: boolean, autorise: boolean, is_actuel: boolean, user_mandats: number[], cotisant: boolean, admin: boolean }>}
 */
export const estUtilisateurDansAsso = (asso_id) =>
    createApiGet(`${ASSOCIATIONS_BASE_URL}/route_est_membre_de_asso`)({}, asso_id);

/**
 * Charge les informations détaillées d'une association.
 * @param {number} asso_id - ID de l'association
 */
export const chargerAsso = (asso_id) =>
    createApiGet(`${ASSOCIATIONS_BASE_URL}`)({}, asso_id);

/**
 * Modifie les modules d'une asso
 * @param {number} asso_id - ID de l'association
 * @param {{ modules: list }} - Modules disponibles pour l'asso
 */
export const editerModulesAsso = (asso_id, modules) =>
    createApiPatch(`${ASSOCIATIONS_BASE_URL}/${asso_id}/editer_modules`)({ modules });


/**
 * Charge la liste de toutes les associations visibles par l'utilisateur connecté.
 * @returns {Promise<Array<{ id: number, ordre_importance: number, nom: string }>>}
 */
export const chargerListeAssos = () =>
    createApiGet(`${ASSOCIATIONS_BASE_URL}/assos`)();
