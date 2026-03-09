import { useNavigate } from 'react-router-dom';
import { seDeconnecter, verifierPermission } from '../../api/api_global';
import { useState } from 'react';
import { Container, Navbar, Nav, NavDropdown, Button, Form, FormControl } from 'react-bootstrap';
import '../../assets/styles/header.scss';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import ThemeSwitcher from '../elements/ThemeSwitcher';
import { useProtected } from '../../Protected';
import { useLayout } from '../../layouts/Layout';

export default function Header() {
    const { userData } = useProtected();
    const { theme, setTheme } = useLayout();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: octoPermission = false } = useQuery({
        queryKey: ['permOcto'],
        queryFn: () => verifierPermission({}, "octo", userData.id),
    });
    const { data: bieroPermission = false } = useQuery({
        queryKey: ['permBiero'],
        queryFn: () => verifierPermission({}, "biero", userData.id),
    });
    const { data: octoAdminPermission = false } = useQuery({
        queryKey: ['permAdminOcto'],
        queryFn: () => verifierPermission({}, "admin_octo", userData.id),
    });
    const { data: bieroAdminPermission = false } = useQuery({
        queryKey: ['permAdminBiero'],
        queryFn: () => verifierPermission({}, "admin_biero", userData.id),
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
        queryClient.invalidateQueries(['id']);
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Navbar expand="md" className="global-header-header navbar-dark">
            <Container fluid>
                <Navbar.Brand href="#" onClick={() => navigate("/")}>Le portail des élèves (WIP)</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="w-100 d-flex flex-column flex-md-row align-items-md-center gap-2">
                        <NavDropdown title="Menu" id="basic-nav-dropdown">
                            <NavDropdown.Item onClick={() => navigate("/")}>Accueil</NavDropdown.Item>
                            <NavDropdown.Item onClick={() => navigate("/assos")}>Associations</NavDropdown.Item>
                            <NavDropdown.Item onClick={() => navigate("/assos/planning")}>Planning associatif</NavDropdown.Item>
                            <NavDropdown.Item onClick={() => navigate("/trombi")}>Trombinoscope</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={() => navigate("/vendomes")}>Vendômes</NavDropdown.Item>
                            <NavDropdown.Item onClick={() => navigate("/palums")}>Palums</NavDropdown.Item>
                            <NavDropdown.Item href="https://docs.google.com/spreadsheets/d/1ajgPhZc1xKjB0WZGNqucb5h47aMxdxAfbpOEtxj0Uis/edit?usp=sharing" target="_blank" rel="noopener noreferrer">Sheet des stages</NavDropdown.Item>
                            <NavDropdown.Item href="https://demarches.portail.minesparis.psl.eu/ordre-de-mission-apprenant/" target="_blank" rel="noopener noreferrer">Réservation véhicule des Mines</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={() => navigate("/jeux/2048")}>2048</NavDropdown.Item>
                        </NavDropdown>

                        <Button variant="danger" size="sm" href="https://discord.gg/3MtV8cgTRu">Serveur Discord</Button>

                        <div className="d-flex flex-column flex-md-row gap-2">
                            {(octoPermission || octoAdminPermission || bieroPermission || bieroAdminPermission) && <Button variant="info" size="sm" onClick={() => navigate("/soifguard")}>Soifguard</Button>}
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
                            <NavDropdown.Divider />
                            <div className="d-flex justify-content-between align-items-center px-3">
                                Thème
                                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                            </div>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}