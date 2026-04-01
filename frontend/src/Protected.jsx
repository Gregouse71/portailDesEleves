import { useQuery } from '@tanstack/react-query';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { obtenirIdUser } from './api/api_global';
import { createContext, useContext } from 'react';
import { obtenirDataUser } from './api/api_utilisateurs';

const ProtectedContext = createContext();

export function ProtectedRoute() {
    const location = useLocation();

    const { data: id, isLoading, isError, error } = useQuery({
        queryKey: ['id'],
        queryFn: obtenirIdUser,
        retry: (failureCount, error) => {
            console.log(error)
            if (error?.response?.status === 401) return false;
            return failureCount < 3;
        }
    });
    const isUnauthorized = isError && error?.response?.status === 401;

    const { data: userData = {
        promotion: 2,
        date_de_naissance: "0",
        chambre: "0",
        ville_origine: "",
        instruments: [],
        co: null,
        marrain: null,
        fillots: [],
        vote_sondaj_du_jour: null
    }, isLoading: isLoadingUser } = useQuery({
        queryKey: ['donneesUtilisateurs', id],
        queryFn: () => obtenirDataUser(id),
        enabled: !!id
    });

    if (isLoading) return <div>Chargement ...</div>;

    if (!id || isUnauthorized || isError) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (isLoadingUser) return <div>Chargement ...</div>;

    return <ProtectedContext.Provider value={{ userData }}>
        <Outlet />
    </ProtectedContext.Provider>;
}

export function useProtected() {
    return useContext(ProtectedContext);
}