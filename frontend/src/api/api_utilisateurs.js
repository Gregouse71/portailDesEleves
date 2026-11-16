import {
    API_BASE_URL,
    createApiDelete,
    createApiGet,
    createApiPost,
    createApiPostFormData,
    createApiPut,
} from "./base";

const UTILISATEUR_BASE_URL = `${API_BASE_URL}/users`;

/**
 * Envoie un fichier CSV d'utilisateurs pour prévisualisation et vérification avant création en lot.
 * @param {{ file: File }} data - Objet contenant le fichier CSV
 * @returns {Promise<Array<object>>} Liste des utilisateurs extraits du CSV
 */
export const processList = (data) => {
    const formData = new FormData();
    formData.append("file", data.file);
    return createApiPostFormData(`${UTILISATEUR_BASE_URL}/process_list`)(formData);
};

/**
 * Crée en lot une liste d'utilisateurs préalablement vérifiée via `processList`.
 * @param {{ list: Array<object> }} data
 */
export const createBulk = createApiPost(`${UTILISATEUR_BASE_URL}/create_bulk`);

/**
 * Ajoute manuellement un nouvel utilisateur avec sa photo de profil.
 * @param {string} nomUtilisateur - Identifiant de connexion
 * @param {string} email - Adresse email
 * @param {string} prenom - Prénom
 * @param {string} nom - Nom de famille
 * @param {string} cycle - Cycle (ic, ast, vs, ev, isup, de)
 * @param {string|number} promotion - Promotion (ex: "24")
 * @param {File} photo - Fichier photo de profil
 */
export const ajouterUtilisateur = async (nomUtilisateur, email, prenom, nom, cycle, promotion, photo) => {
    const formData = new FormData();
    formData.append("nom_utilisateur", nomUtilisateur);
    formData.append("prenom", prenom);
    formData.append("nom", nom);
    formData.append("cycle", cycle);
    formData.append("promotion", promotion);
    formData.append("email", email);
    formData.append("photo", photo);

    const data = await createApiPostFormData(`${UTILISATEUR_BASE_URL}/add_utilisateur`)(formData);
    if (!data) {
        throw new Error("Erreur lors de l'ajout de l'utilisateur");
    }
    return { ok: true, ...data };
};

/**
 * Récupère la liste des associations (actuelles et anciennes) dont un utilisateur est membre.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @returns {Promise<{ actuel: Array<object>, ancien: Array<object> }>}
 */
export const obtenirAssosUtilisateur = (id_utilisateur) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/assos_utilisateur`)({}, id_utilisateur);

/**
 * Récupère les informations complètes du profil d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 */
export const obtenirDataUser = (id_utilisateur) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/obtenir_infos_profil`)({}, id_utilisateur);

/**
 * Récupère les questions/réponses du portail d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 */
export const obtenirQuestionsReponses = (id_utilisateur) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/questions_reponses`)({}, id_utilisateur);

/**
 * Modifie les réponses aux questions du portail d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @param {object} new_QR - Nouvelles réponses aux questions
 */
export const modifierQuestionsReponses = (id_utilisateur, new_QR) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/questions_reponses`)(new_QR, id_utilisateur);

/**
 * Modifie les informations générales du profil d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @param {object} new_info - Nouvelles informations du profil
 */
export const modifierInfos = (id_utilisateur, new_info) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/infos`)(new_info, id_utilisateur);

/**
 * Récupère l'ID d'un utilisateur à partir de son nom d'utilisateur.
 * @param {string} nom_utilisateur - Nom d'utilisateur recherché
 */
export const obtenirIdUserParNom = (nom_utilisateur) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/obtenir_id_par_nomutilisateur`)({}, nom_utilisateur);

/**
 * Charge la liste des utilisateurs d'une promotion donnée (ou de tous les utilisateurs si `promo` est omis).
 * @param {string|number|null} [promo=null] - Promotion optionnelle
 */
export const chargerUtilisateurs = (promo = null) =>
    promo
        ? createApiGet(`${UTILISATEUR_BASE_URL}/charger_utilisateurs`)({}, promo)
        : createApiGet(`${UTILISATEUR_BASE_URL}/charger_utilisateurs`)();

/**
 * Récupère la liste de toutes les promotions présentes dans la base.
 * @returns {Promise<Array<string>>}
 */
export const obtenirListeDesPromos = () =>
    createApiGet(`${UTILISATEUR_BASE_URL}/obtenir_liste_des_promos`)();

/**
 * Récupère la liste des utilisateurs d'une promotion filtrée par cycles.
 * @param {string|number} promo - Promotion
 * @param {Array<string>} cycles - Liste des cycles sélectionnés (ex: `["ic", "ast"]`)
 */
export const obtenirListeDesUtilisateurs = (promo, cycles) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/obtenir_liste_utilisateurs`)({}, promo, cycles.join(","));

/**
 * Récupère la liste des prochains anniversaires.
 */
export const obtenirProchainsAnnivs = () =>
    createApiGet(`${UTILISATEUR_BASE_URL}/prochains_anniv`)();

/**
 * Définit la liste des fillots d'un utilisateur (réservé au VPP).
 * @param {number} user_id - ID du marrain
 * @param {Array<number>} fillots_ids - Liste des IDs des fillots
 */
export const selectionnerFillots = (user_id, fillots_ids) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/select_fillots`)({ user_id, fillots_ids });

/**
 * Définit la liste des marrains d'un utilisateur (réservé au VPP).
 * @param {number} user_id - ID du fillot
 * @param {Array<number>} marrains_id - Liste des IDs des marrains
 */
export const selectionnerMarrains = (user_id, marrains_id) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/select_marrains`)({ user_id, marrains_id });

/**
 * Met à jour la liste des colocataires (cos) d'un utilisateur.
 * @param {number} user_id - ID de l'utilisateur
 * @param {Array<number>} co_ids - Liste des IDs des cos
 */
export const changerCo = (user_id, co_ids) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/changer_co`)({ user_id, co_ids });

/**
 * Supprime un lien de colocation avec un utilisateur donné.
 * @param {number} co_id - ID du co à retirer
 */
export const supprimerCo = (co_id) =>
    createApiDelete(`${UTILISATEUR_BASE_URL}/supprimer_co`)(co_id);

/**
 * Recherche des utilisateurs par nom d'utilisateur, prénom, nom ou téléphone.
 * @param {{ query: string, limit?: number, offset?: number }} data
 */
export const searchUsers = createApiPost(`${UTILISATEUR_BASE_URL}/search`);

/**
 * Téléverse un fichier média (photo) dans la galerie d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @param {File} file - Fichier image à téléverser
 */
export const ajouterContenuUtilisateur = async (id_utilisateur, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const data = await createApiPostFormData(`${UTILISATEUR_BASE_URL}/content`)(formData, id_utilisateur);
    return data
        ? { success: true, message: data.message, fileName: data.file_name, mediaId: data.media_id }
        : { success: false, message: "Erreur lors du téléversement du fichier" };
};

/**
 * Ajoute un lien vidéo externe aux médias d'un utilisateur.
 * @param {{ url: string }} data - URL de la vidéo
 * @param {number} id - ID de l'utilisateur
 */
export const ajouterLienVideoUtilisateur = createApiPost(`${UTILISATEUR_BASE_URL}/content`);

/**
 * Définit un média existant comme photo de profil d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @param {number} new_name - ID du média à utiliser comme photo
 */
export const changerPhotoUtilisateur = (id_utilisateur, new_name) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/${id_utilisateur}/modifier_photo`)({}, new_name);

/**
 * Définit un média existant comme bannière du profil d'un utilisateur.
 * @param {number} id - ID de l'utilisateur
 * @param {number|string} fileName - ID du média à utiliser comme bannière
 */
export const changerBanniereUtilisateur = (id, fileName) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/${id}/modifier_banniere`)({ banniere: fileName });

/**
 * Modifie l'ordre d'affichage des associations sur le profil d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @param {Array<{ id: number, ordre: number }>} ordre - Liste ordonnée des mandats
 */
export const modifierOrdreAssos = (id_utilisateur, ordre) =>
    createApiPost(`${UTILISATEUR_BASE_URL}/${id_utilisateur}/ordre_assos`)(ordre);

/**
 * Récupère la liste des médias (photos et vidéos) d'un utilisateur.
 * @param {object} data - Paramètres de requête (vide `{}`)
 * @param {number} user_id - ID de l'utilisateur
 */
export const obtenirPhotosUtilisateur = createApiGet(`${UTILISATEUR_BASE_URL}/content`);

/**
 * Supprime un média de la galerie d'un utilisateur.
 * @param {number} media_id - ID du média à supprimer
 */
export const supprimerPhotoUtilisateur = createApiDelete(`${UTILISATEUR_BASE_URL}/content`);

/**
 * Renomme un média de la galerie d'un utilisateur.
 * @param {{ name: string }} data - Nouveau nom du média
 * @param {number} media_id - ID du média
 */
export const renommerPhotoUtilisateur = createApiPut(`${UTILISATEUR_BASE_URL}/content`);

/**
 * Récupère l'arbre généalogique complet (famille de parrainage et cos) d'un utilisateur.
 * @param {number} id_utilisateur - ID de l'utilisateur
 * @returns {Promise<{ noeuds: Array<object>, liens: Array<object> }>}
 */
export const obtenirFamilleUtilisateur = (id_utilisateur) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/famille`)({}, id_utilisateur);

/**
 * Recherche et récupère le plus court chemin généalogique entre deux utilisateurs.
 * @param {number} id_depart - ID du premier utilisateur
 * @param {number} id_arrivee - ID du second utilisateur
 * @returns {Promise<{ noeuds: Array<object>, liens: Array<object>, chemin: Array<number> }>}
 */
export const obtenirCheminEntreUtilisateurs = (id_depart, id_arrivee) =>
    createApiGet(`${UTILISATEUR_BASE_URL}/chemin`)({ depart: id_depart, arrivee: id_arrivee });
