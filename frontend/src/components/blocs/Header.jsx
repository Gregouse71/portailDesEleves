import { useNavigate } from 'react-router-dom';
import { seDeconnecter, verifierPermission } from '../../api/api_global';
import { useState, useRef } from 'react';
import { Container, Navbar, Nav, NavDropdown, Button, Form, FormControl } from 'react-bootstrap';
import '../../assets/styles/header.scss';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ThemeSwitcher from '../elements/ThemeSwitcher';
import { useProtected } from '../../Protected';
import { useLayout } from '../../layouts/Layout';

export default function Header() {
    const [expanded, setExpanded] = useState(false); // State to control Navbar collapse

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
        setExpanded(false);
        e.preventDefault();
        if (searchQuery.length > 0) {
            navigate(`/search?q=${searchQuery}`);
        }
    };

    async function handleLogout() {
        await seDeconnecter();
        navigate("/login");  // Rediriger après déconnexion
        queryClient.invalidateQueries(['id']);
        setExpanded(false); // Collapse the menu
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const Dropdown = ({ title, list }) => {
        const [show, setShow] = useState(false);
        const timeout = useRef(null);
        const handleMouseEnter = () => {
            if (timeout.current) clearTimeout(timeout.current);
            setShow(true);
        };

        const handleMouseLeave = () => {
            timeout.current = setTimeout(() => {
                setShow(false);
            }, 150);
        };

        return <>
            {/* Visible uniquement sur PC */}
            <NavDropdown
                title={title} id="basic-nav-dropdown" className="d-none d-md-block"
                show={show} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
            >
                {list.map(elt => {
                    const [type, target, title] = elt;
                    switch (type) {
                        case "divider": return <NavDropdown.Divider />;
                        case "navigate": return <NavDropdown.Item onClick={() => navigate(target)}>{title}</NavDropdown.Item>;
                        case "link": return <NavDropdown.Item href={target} target="_blank" rel="noopener noreferrer">{title}</NavDropdown.Item>;
                        case "onClick": return <NavDropdown.Item onClick={target}>{title}</NavDropdown.Item>;
                        case "custom": return target;
                        default: return <></>;
                    }
                })}
            </NavDropdown>

            {/* Expanded Menu for mobile */}
            <div className="mobile-dropdown d-md-none d-flex flex-column">
                {list.map(elt => {
                    const [type, target, title] = elt;
                    switch (type) {
                        case "divider": return <hr className="my-2 text-muted" />;
                        case "navigate": return <Nav.Link onClick={() => navigate(target)}>{title}</Nav.Link>;
                        case "link": return <Nav.Link href={target} target="_blank" rel="noopener noreferrer">{title}</Nav.Link>;
                        case "onClick": return <Nav.Link onClick={target}>{title}</Nav.Link>;
                        case "custom": return target;
                        default: return <></>;
                    }
                })}
            </div>
        </>
    }

    return (
        <Navbar expand="md" expanded={expanded} onToggle={() => setExpanded(!expanded)} className="global-header-header navbar-dark">
            <Container fluid>
                <Navbar.Brand style={{cursor: "pointer"}} onClick={() => { navigate("/"); setExpanded(false); }}>Le portail des élèves</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="w-100 d-flex flex-column flex-md-row align-items-md-center gap-2">
                        <Dropdown title="Menu"
                            list={[
                                ["navigate", "/", "Accueil"],
                                ["navigate", "/assos", "Associations"],
                                ["navigate", "/assos/planning", "Planning associatif"],
                                ["navigate", "/trombi", "Trombinoscope"],
                                ... (octoPermission || octoAdminPermission || bieroPermission || bieroAdminPermission) ?
                                    [["navigate", "/soifguard", "Soifguard"]] : [],
                                ["divider"],
                                ["navigate", "/publications", "Publicatons récentes"],
                                ["navigate", "/vendomes", "Vendômes"],
                                ["navigate", "/palums", "Palums"],
                                ["link", "https://discord.gg/3MtV8cgTRu/", "Serveur Discord de dev"],
                                ["link", "https://oasis.minesparis.psl.eu/", "Oasis"],
                                ["link", "https://moodle.psl.eu/", "Moodle"],
                                ["link", "https://docs.google.com/spreadsheets/d/1ajgPhZc1xKjB0WZGNqucb5h47aMxdxAfbpOEtxj0Uis/edit?usp=sharing", "Sheet des stages"],
                                ["link", "https://demarches.portail.minesparis.psl.eu/ordre-de-mission-apprenant/", "Réservation véhicule des Mines"],
                                ["divider"],
                                ["navigate", "/jeux/2048", "2048"],
                            ]}
                        />

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

                        <Dropdown title={userData ? userData.nom_utilisateur : "Connexion..."} align="end"
                            list={[
                                ["navigate", `/utilisateur/${userData.id}`, "Ma page"],
                                ...userData.is_superuser ? [["navigate", "/administration", "Administration"]] : [],
                                ["onClick", handleLogout, "Déconnexion"],
                                ["divider"],
                                ["custom", <div className="d-flex justify-content-between align-items-center px-3">
                                    Thème
                                    <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                                </div>]
                            ]}
                        />
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}