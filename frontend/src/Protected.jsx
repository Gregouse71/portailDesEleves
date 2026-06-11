import { useQuery } from '@tanstack/react-query';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { obtenirAlive, obtenirIdUser } from './api/api_global';
import { createContext, useContext } from 'react';
import { obtenirDataUser } from './api/api_utilisateurs';
import { Alert } from 'react-bootstrap';

const ProtectedContext = createContext();

export function ProtectedRoute() {
    const location = useLocation();

    const { data: isAlive, isError: isDead } = useQuery({
        queryKey: ["alive"],
        queryFn: obtenirAlive,
        retry: 1,
        staleTime: 1000 * 60, // 1 minute
    });

    const { data: idData, isLoading, isError, error } = useQuery({
        queryKey: ['id'],
        queryFn: () => obtenirIdUser({}),
        enabled: !isDead,
        retry: (failureCount, error) => {
            console.log(isDead)
            if (error?.response?.status === 401) return false;
            return failureCount < 3;
        }
    });

    const id = idData?.id_utilisateur;

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
    }, isLoading: isLoadingUser, isError: isErrorUser, error: errorUser } = useQuery({
        queryKey: ['donneesUtilisateurs', id],
        queryFn: () => obtenirDataUser(id),
        enabled: !!id,
        retry: (failureCount, error) => {
            if (error?.response?.status === 401) return false;
            return failureCount < 3;
        }
    });

    if (isDead) return <>
        <h1 className="text-center mb-4 fs-3">
            <strong className="text-primary">Portail des élèves</strong>
        </h1>
        <Alert variant="warning" className="text-center">
            <strong>Maintenance en cours</strong><br />
            Le portail est temporairement indisponible.
        </Alert>
    </>

    if (isLoading) return <div>Chargement ...</div>;

    const isUnauthorized = (isError && error?.response?.status === 401) || (isErrorUser && errorUser?.response?.status === 401);

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