import { API_BASE_URL, handleResponse } from "./base";

export async function getPublicationsByTag(tag, offset, limit) {
  try {
    const params = new URLSearchParams();
    if (offset !== undefined) params.append("offset", offset);
    if (limit !== undefined) params.append("limit", limit);
    const queryString = params.toString();
    const res = await fetch(`${API_BASE_URL}/publications/tag/${tag}${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}

export async function obtenirPublicationsAsso(asso_id, offset, limit) {
  try {
    const params = new URLSearchParams();
    if (offset !== undefined) params.append("offset", offset);
    if (limit !== undefined) params.append("limit", limit);
    const queryString = params.toString();
    const res = await fetch(`${API_BASE_URL}/publications/obtenir_publications_asso/${asso_id}${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}

export async function obtenirPublicationsRecentes(limit) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/recent${limit ? `?limit=${limit}` : ''}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}

export async function obtenirPublication(post_id) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/obtenir_publication/${post_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}

export async function supprimerPublication(asso_id, publication_id) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/${asso_id}/supprimer_publication/${publication_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}

export async function supprimerCommentaire(comment_id) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/supprimer_commentaire/${comment_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}

export async function creerNouvellePublication(id_asso, data) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/${id_asso}/creer_nouvelle_publication`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data)
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur);
    throw erreur;
  }
}

export async function modifierPublication(id_asso, id_post, data) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/${id_asso}/modifier_publication/${id_post}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data)
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur);
    throw erreur;
  }
}

export async function modifierCommentaire(id_comment, data) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/modifier_commentaire/${id_comment}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data)
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur);
    throw erreur;
  }
}

export async function modifierLikePost(id_post) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/modifier_like_post/${id_post}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur);
    throw erreur;
  }
}

export async function modifierLikeComment(id_comment) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/modifier_like_comment/${id_comment}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur);
    throw erreur;
  }
}

export async function creerNouveauCommentaire(id_post, comment) {
  try {
    const res = await fetch(`${API_BASE_URL}/publications/${id_post}/creer_nouveau_commentaire`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({"contenu" : comment})
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur);
    throw erreur;
  }
}

export async function ajouterContenuPublication(assoId, publicationId, file, miniatureFile) {
  try {
    const formData = new FormData();
    if (file) {
      formData.append("fichier_joint", file);
    }
    if (miniatureFile) {
      formData.append("miniature", miniatureFile);
    }

    const response = await fetch(`${API_BASE_URL}/publications/${assoId}/${publicationId}/add_content`, {
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
    return { success: true, message: data.message, filePath: data.file_path };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: error.message };
  }
}