import { useQuery } from '@tanstack/react-query';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { estAuthentifie } from './api/api_global';

export default function ProtectedRoute() {
    const location = useLocation();

    const { data: isAuthenticated, isLoading } = useQuery({
        queryKey: ['isAuthenticated'],
        queryFn: estAuthentifie,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    console.log(isAuthenticated)
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (isAuthenticated) {
        return <Outlet />;
    }

    return <div>Loading...</div>;
}
