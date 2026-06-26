import { API_BASE_URL, createApiGet, createApiPost, createApiPut, createApiDelete } from "./base";

const ECHECS_BASE_URL = `${API_BASE_URL}/echecs`;

export const getDefis     = createApiGet(`${ECHECS_BASE_URL}/defis`);
export const creerDefi    = createApiPost(`${ECHECS_BASE_URL}/defis`);
export const annulerDefi  = createApiDelete(`${ECHECS_BASE_URL}/defis`);

export const accepterDefi = (id) => createApiPost(`${ECHECS_BASE_URL}/defis/${id}/accepter`)({});

export const getPartie      = (id) => createApiGet(`${ECHECS_BASE_URL}/parties/${id}`)({});
export const getCoupsLegaux = (id, caseIdx) => createApiGet(`${ECHECS_BASE_URL}/parties/${id}/coups_legaux`)({ case: caseIdx });
export const jouerCoup      = (id) => createApiPut(`${ECHECS_BASE_URL}/parties/${id}`);

export const getLeaderboard = createApiGet(`${ECHECS_BASE_URL}/leaderboard`);

export const abandonner     = (id) => createApiPost(`${ECHECS_BASE_URL}/parties/${id}/abandonner`)({});
export const proposerNulle  = (id) => createApiPost(`${ECHECS_BASE_URL}/parties/${id}/proposer_nulle`)({});
export const accepterNulle  = (id) => createApiPost(`${ECHECS_BASE_URL}/parties/${id}/accepter_nulle`)({});