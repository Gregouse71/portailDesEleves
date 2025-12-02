import { createContext, useState, useContext, useEffect } from 'react';
import Header from '../components/blocs/Header';
import BlocSondage from '../components/blocs/blocSondage';
import BlocChat from '../components/blocs/blocChat';
import BlocAnniversaire from '../components/blocs/blocAnniversaire';
import '../assets/styles/layout.scss';
import { obtenirIdUser, estAuthentifie } from '../api/api_global';
import { obtenirDataUser } from '../api/api_utilisateurs';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BlocEvents from '../components/blocs/blocEvents';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const { data: id } = useQuery({
        queryKey: ['id'],
        queryFn: obtenirIdUser
    })

    const { data: userData = {
        promotion: 2,
        date_de_naissance: "0",
        chambre: "0",
        ville_origine: "",
        instruments: [],
        co: null,
        marrain: null,
        fillots: []
    } } = useQuery({
        queryKey: ['donneesUtilisateur', id],
        queryFn: () => obtenirDataUser(id),
        enabled: !!id
    });

    useEffect(() => {
        estAuthentifie().then(auth => {
            if (!auth && location.pathname !== "/login") {
                navigate("/login");
            }
        });
    }, [navigate, location.pathname]);

    return (
        <LayoutContext.Provider value={{ userData }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    return useContext(LayoutContext);
}

// Actual layout UI wrapper
export function Layout() {
    const { userData } = useLayout();

    if (!userData) return null;

    return (
        <div className="layout">
            <Header className="header-global" />
            <Container fluid className="main-content-global">
                <Row>
                    <Col md={2} className=" left order-2 order-md-1">
                        <BlocEvents />
                        <BlocSondage />
                    </Col>
                    <Col md={8} className="mb-3 order-1 order-md-2">
                        <Outlet />
                    </Col>
                    <Col md={2} className=" right order-3 order-md-3">
                        <BlocChat />
                        <BlocAnniversaire />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}