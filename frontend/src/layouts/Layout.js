import { createContext, useState, useContext, useEffect } from 'react';
import Header from '../components/blocs/Header';
import BlocSondage from '../components/blocs/blocSondage';
import BlocChat from '../components/blocs/blocChat';
import BlocAnniversaire from '../components/blocs/blocAnniversaire';
import '../assets/styles/layout.scss';
import { obtenirIdUser, estAuthentifie } from '../api/api_global';
import { obtenirDataUser } from '../api/api_utilisateurs';
import { Outlet, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [reloadSondage, setReloadSondage] = useState(false);
  const navigate = useNavigate();

  const reloadBlocSondage = () => {
    setReloadSondage(prev => !prev);
  };

  const { data: userData, error } = useQuery({
    queryKey: ['userId'],
    queryFn: () => obtenirIdUser().then(id => obtenirDataUser(id)),
  });

  useEffect(() => {
    estAuthentifie().then(auth => {
      if (!auth) navigate("/login");
    });
  }, [navigate, userData]);

  return (
    <LayoutContext.Provider value={{ userData, reloadBlocSondage }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}

// Actual layout UI wrapper
export function Layout() {
  const { userData, reloadBlocSondage } = useLayout();

  if (!userData) return null;

  return (
    <div className="layout">
      <Header className="header-global" />
      <Container fluid className="main-content-global">
        <Row>
          <Col md={2} className="sidebar-global left">
            <BlocSondage reloadSondage={reloadBlocSondage} />
          </Col>
          <Col md={8} className="content-global">
            <Outlet />
          </Col>
          <Col md={2} className="sidebar-global right">
            <BlocChat />
            <BlocAnniversaire />
          </Col>
        </Row>
      </Container>
    </div>
  );
}