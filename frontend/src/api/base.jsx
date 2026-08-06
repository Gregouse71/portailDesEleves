// Configuration de base pour l'api
import { _BASE_URL } from "./base_url";

export const BASE_URL = _BASE_URL;
export const API_BASE_URL = `${BASE_URL}/api`;
export const UPLOAD_BASE_URL = `${BASE_URL}/upload`;
export const SOIFGUARD_BASE_URL = `${API_BASE_URL}/soifguard`;
export const BIBLIOTHEQUE_BASE_URL = `${API_BASE_URL}/bibliotheque`;
export const SOCKET_BASE_URL = `${BASE_URL}`

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

export function createApiPost(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json", }, credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

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
                return
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

export function createApiGet(route, getFile = false) {
    return async (data, ...params) => {
        try {
            const search_param = new URLSearchParams(data);
            const string = search_param.toString();
            const url = `${[route, ...params].join('/')}${string ? `?${string}` : ""}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json", }, credentials: "include",
            });

            if (!response.ok) {
                let errorMessage = "Erreur inconnue";
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    // If it's HTML/Text, grab the text or just use the status text
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
                console.log(contentDisposition)
                console.log(response.headers)
                let filename = 'download.csv'; // default filename
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

                return true; // Indicate success
            }
            else {
                return await response.json();
            }
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

export function createApiDelete(route) {
    return async (...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", }, credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

export function createApiPut(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "PUT",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json", }, credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}

export function createApiPatch(route) {
    return async (data, ...params) => {
        try {
            const url = [route, ...params].join('/');
            const response = await fetch(url, {
                method: "PATCH",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json", }, credentials: "include",
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
                return
            }

            return await response.json();
        } catch (erreur) {
            console.error("Erreur réseau :", erreur);
            throw erreur;
        }
    };
}