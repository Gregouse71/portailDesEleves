import { _BASE_URL } from "./base_url";

export const BASE_URL = _BASE_URL;
export const API_BASE_URL = `${BASE_URL}/api`;
export const UPLOAD_BASE_URL = `${BASE_URL}/upload`;
export const SOIFGUARD_BASE_URL = `${API_BASE_URL}/soifguard`;
export const SOCKET_BASE_URL = `${BASE_URL}`;

/**
 * Traite une réponse HTTP fetch et lève une erreur explicite si le statut n'est pas OK.
 * @param {Response} response - Objet Response renvoyé par fetch
 * @returns {Promise<any>} Données JSON de la réponse
 */
export async function handleResponse(response) {
    if (!response.ok) {
        let errorMessage = "Erreur inconnue";
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } else {
            const textError = await response.text();
            console.error("Server returned non-JSON error:", textError.substring(0, 100));
            errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        const error = new Error(errorMessage);
        error.response = response;
        throw error;
    }
    return response.json();
}

/**
 * Crée une fonction d'appel API POST envoyant du JSON.
 * @param {string} route - URL de base de la route
 * @returns {(data?: object, ...params: Array<string|number>) => Promise<any>}
 */
export function createApiPost(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return;
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

/**
 * Crée une fonction d'appel API POST envoyant un objet FormData (multipart/form-data).
 * @param {string} route - URL de base de la route
 * @returns {(data: FormData, ...params: Array<string|number>) => Promise<any>}
 */
export function createApiPostFormData(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "POST",
                body: data,
                credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return;
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

/**
 * Crée une fonction d'appel API GET avec paramètres de requête (query string) et paramètres d'URL.
 * @param {string} route - URL de base de la route
 * @param {boolean} [getFile=false] - Si true, déclenche le téléchargement du fichier renvoyé (CSV, etc.)
 * @returns {(data?: object, ...params: Array<string|number>) => Promise<any>}
 */
export function createApiGet(route, getFile = false) {
    return async (data, ...params) => {
        try {
            const cleanData = data
                ? Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null))
                : {};
            const search_param = new URLSearchParams(cleanData);
            const string = search_param.toString();
            const url = `${[route, ...params].join('/')}${string ? `?${string}` : ""}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!response.ok) {
                let errorMessage = "Erreur inconnue";
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const textError = await response.text();
                    console.error("Server returned non-JSON error:", textError.substring(0, 100));
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                const error = new Error(errorMessage);
                error.response = response;
                throw error;
            }
            if (getFile) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'download.csv';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/(?:filename\*?|filename)=(?:"([^"]+)"|([^;]+))/i);
                    if (filenameMatch) {
                        filename = (filenameMatch[1] || filenameMatch[2]).trim();
                    }
                }

                const link = document.createElement('a');
                const urlObject = window.URL.createObjectURL(blob);
                link.href = urlObject;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(urlObject);

                return true;
            } else {
                return await response.json();
            }
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

/**
 * Crée une fonction d'appel API DELETE.
 * @param {string} route - URL de base de la route
 * @returns {(...params: Array<string|number>) => Promise<any>}
 */
export function createApiDelete(route) {
    return async (...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return;
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

/**
 * Crée une fonction d'appel API PUT envoyant du JSON.
 * @param {string} route - URL de base de la route
 * @returns {(data?: object, ...params: Array<string|number>) => Promise<any>}
 */
export function createApiPut(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "PUT",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return;
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

/**
 * Crée une fonction d'appel API PATCH envoyant du JSON.
 * @param {string} route - URL de base de la route
 * @returns {(data?: object, ...params: Array<string|number>) => Promise<any>}
 */
export function createApiPatch(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "PATCH",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return;
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}
