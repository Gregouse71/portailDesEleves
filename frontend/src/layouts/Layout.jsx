import { createContext, useContext, useEffect } from 'react';
import Header from '../components/blocs/Header';
import BlocSondage from '../components/blocs/blocSondage';
import BlocChat from '../components/blocs/blocChat';
import BlocAnniversaire from '../components/blocs/blocAnniversaire';
import '../assets/styles/layout.scss';
import { obtenirIdUser } from '../api/api_global';
import { obtenirDataUser } from '../api/api_utilisateurs';
import { Outlet, useLocation } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import BlocEvents from '../components/blocs/blocEvents';
import BlocSoldes from '../components/blocs/blocSoldes';

const LayoutContext = createContext();

function ScrollToTop() {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Use a timeout to ensure DOM has settled, especially for dynamically loaded content
        const timeoutId = setTimeout(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }, 0); // A small delay can help

        return () => clearTimeout(timeoutId);
    }, [pathname, search]);

    return null;
}

export function LayoutProvider({ children, theme, setTheme }) {

    return (
        <LayoutContext.Provider value={{ theme, setTheme }}>
            <ScrollToTop />
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    return useContext(LayoutContext);
}

// Actual layout UI wrapper
export function Layout() {
    return (
        <div className="layout">
            <Header />
            <Container fluid className="main-content-global">
                <Row>
                    <Col md={2} className="left order-2 order-md-1">
                        <BlocEvents />
                        <BlocSondage />
                        <BlocSoldes />
                    </Col>
                    <Col md={8} className="mb-3 order-1 order-md-2">
                        <Outlet />
                    </Col>
                    <Col md={2} className="right order-3 order-md-3">
                        <BlocChat />
                        <BlocAnniversaire />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}