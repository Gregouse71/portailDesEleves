import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../layouts/Layout';
import { seDeconnecter } from '../../api/api_global';
import {  useState } from 'react';
import { verifierPermission } from '../../api/api_soifguard';
import { Container, Navbar, Nav, NavDropdown, Button, Form, FormControl } from 'react-bootstrap';
import '../../assets/styles/header.scss';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const { userData } = useLayout();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: octoPermission = false } = useQuery({
    queryKey: ['permOcto'],
    queryFn: () => verifierPermission("octo"),
  });
  const { data: bieroPermission = false } = useQuery({
    queryKey: ['permBiero'],
    queryFn: () => verifierPermission("biero"),
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.length > 0) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  async function handleLogout() {
    await seDeconnecter();
    navigate("/login");  // Rediriger après déconnexion
  }

  return (
    <Navbar bg="dark" data-bs-theme="dark" expand="md" color='#005a9e' className="global-header-header">
      <Container fluid>
        <Navbar.Brand href="#" onClick={() => navigate("/")}><em>Le nouveau</em> portail des élèves (work in progress)</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="w-100 d-flex flex-column flex-md-row align-items-md-center gap-2">
            <NavDropdown title="Menu" id="basic-nav-dropdown">
              <NavDropdown.Item onClick={() => navigate("/")}>Accueil</NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/assos")}>Assos</NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/assos/planning")}>Planning associatif</NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/trombi")}>Trombinoscope</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Services" id="services-nav-dropdown">
              <NavDropdown.Item onClick={() => navigate("/vendomes")}>Vendômes</NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/palums")}>Palums</NavDropdown.Item>
            </NavDropdown>

            <Button variant="danger" size="sm" href="mailto:portail@kataevskiy.com">Signaler un bug</Button>

            <div className="d-flex flex-column flex-md-row gap-2">
              {(octoPermission || bieroPermission) && <Button variant="info" size="sm" onClick={() => navigate("/soifguard")}>Soifguard</Button>}
              {userData.is_superuser && <Button variant="danger" size="sm" onClick={() => navigate("/administration")}>Administration</Button>}
            </div>

            <div className="d-none d-md-block flex-grow-1"></div>

            <Form className="d-flex" onSubmit={handleSearchSubmit}>
              <FormControl
                type="search"
                placeholder="Rechercher"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Form>

            <NavDropdown title={userData ? userData.nom_utilisateur : "Chargement..."} id="user-nav-dropdown" align="end">
              <NavDropdown.Item onClick={() => navigate(`utilisateur/${userData.id}`)}>Ma page</NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleLogout()}>Se déconnecter</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};