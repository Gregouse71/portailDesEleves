import { API_BASE_URL, createApiDelete, createApiGet, createApiPatch, createApiPost, createApiPut, handleResponse } from "./base";

const ASSOCIATIONS_BASE_URL = `${API_BASE_URL}/associations`;

/** Obtenir les photos d'une asso
 * args :
 *  - user_id : id de l'utilisateur
 * 
 * renvoie :
 *  - la liste des photos de l'asso
 */
export const obtenirPhotosAsso = createApiGet(`${ASSOCIATIONS_BASE_URL}/content`)

/** Supprimer un media
 * 
 */
export const supprimerPhotoAsso = createApiDelete(`${ASSOCIATIONS_BASE_URL}/content`)

/** Renommer un media
 * 
 */
export const renommerPhotoAsso = createApiPut(`${ASSOCIATIONS_BASE_URL}/content`)

/** Charge le mandat
 * args :
 * - id : l'id du mandat
 */
export const chargerMandat = createApiGet(`${ASSOCIATIONS_BASE_URL}/mandat`)

/** Ajoute un lien vidéo aux medias de l'utilisateur
 * 
 * args :
 * - { url } : l'url du lien
 * - association_id: l'id de l'asso
 * - mandat_id: l'id du mandat
 */
export const ajouterLienVideoAsso = createApiPost(`${ASSOCIATIONS_BASE_URL}/add_content`)


export async function ajouterAsso(nom, description, type_association, ordre_importance, logo_path, banniere_path, a_cacher_aux_nouveaux) {
  try {
    const response = await fetch(`${API_BASE_URL}/associations/route_creer_asso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        nom,
        description,
        type_association,
        ordre_importance,
        logo_path,
        banniere_path,
        a_cacher_aux_nouveaux,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'ajout de l'association");
    }
    return { success: true, message: data.message };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: error.message };
  }
}

export async function modifierDescriptionAsso(asso_id, new_desc) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${asso_id}/editer_description`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ new_desc })
    });
    return handleResponse(res);
  } catch (error) {
    console.error("Erreur lors de la modification de la description : ", error);
    throw error;
  }
}

export async function modifierOrdreImportanceAsso(asso_id, ordre_importance) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${asso_id}/modifier_ordre_importance`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ ordre_importance })
    });
    return handleResponse(res);
  } catch (error) {
    console.error("Erreur lors de la modification de l'ordre d'importance : ", error);
    throw error;
  }
}

export async function modifierNomAsso(asso_id, nom) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${asso_id}/modifier_nom`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ nom })
    });
    return handleResponse(res);
  } catch (error) {
    console.error("Erreur lors de la modification du nom : ", error);
    throw error;
  }
}

export async function ajouterMembre(associationId, mandatId, membreId) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${associationId}/ajouter_membre/${mandatId}/${membreId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })
    return handleResponse(res);
  }
  catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
}

export async function ajouterMandat(associationId, nom, position) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${associationId}/ajouter_mandat/${nom}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ position })
    })
    return handleResponse(res);
  }
  catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
}

export async function modifierMandat(associationId, mandatId, nom, pos, actuel) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${associationId}/modifier_mandat/${mandatId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ "nom": nom, "position": pos, "actuel": actuel })
    })
    return handleResponse(res);
  }
  catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
}

export async function supprimerMandat(associationId, mandatId) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${associationId}/supprimer_mandat/${mandatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })
    return handleResponse(res);
  }
  catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
}


export async function retirerMembre(associationId, mandatId, membreId) {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/${associationId}/retirer_membre/${mandatId}/${membreId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })
    return handleResponse(res);
  }
  catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
}

/** Modifie les paramètre du membre dans le mandat
 * - role : nouveau nom de role
 * - position : nouvelle position
 */
export const modifierMembreAsso = createApiPatch(`${ASSOCIATIONS_BASE_URL}/modifier_membre`)


export async function ajouterContenuAsso(associationId, mandatId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/associations/add_content/${associationId}/${mandatId}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors du téléversement du fichier");
    }
    return { success: true, message: data.message, fileName: data.file_name };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: error.message };
  }
}

export async function uploadLogoBanniereAsso(associationId, type, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/associations/${associationId}/upload_logo_banniere/${type}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors du téléversement du fichier");
    }
    return { success: true, message: data.message, fileName: data.file_name };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: error.message };
  }
}

export async function changerPhotoAsso(asso_id, photo_type, mandat_id, new_id) {
  try {
    await fetch(`${API_BASE_URL}/associations/${asso_id}/modifier_logo_banniere/${photo_type}/${mandat_id}/${new_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  } catch (error) {
    console.error("Erreur lors du changement de photo :", error);
    throw error;
  }
}

export async function estUtilisateurDansAsso(asso_id) {
  // renvoie True aussi pour le superutilisateur
  const res = await fetch(`${API_BASE_URL}/associations/route_est_membre_de_asso/${asso_id}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data;
}

export async function chargerAsso(asso_id) {
  const res = await fetch(`${API_BASE_URL}/associations/${asso_id}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data;
}

export async function chargerListeAssos() {
  try {
    const res = await fetch(`${API_BASE_URL}/associations/assos`,
      { credentials: "include" }
    );
    return handleResponse(res);
  } catch (error) {
    console.error("Erreur réseau :", error);
  }
}