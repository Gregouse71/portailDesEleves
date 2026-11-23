import { useState } from "react";
import { Container } from "react-bootstrap";
import { NavLink, Link, Outlet } from "react-router-dom";
import "../assets/styles/public.scss";
import { VP_GEEK_EMAIL } from "../globals";

export default function PublicLayout() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="public-site">
            <header className="public-banner">
                <Container>
                    <div className="public-logo">
                        <Link to="/public">Portail des Élèves des Mines de Paris</Link>
                    </div>
                </Container>

                <div className="public-nav-wrapper">
                    <Container>

                        <nav className="d-block">
                            <ul className="public-nav">
                                <li>
                                    <NavLink to="/public" end>
                                        Accueil
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/public/lavie">
                                        La vie aux Mines
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="https://www.minesparis.psl.eu/blog/actualites/guide-des-admissibles-de-mines-paris-psl/">
                                        Admissibles
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/public/entreprises">
                                        Entreprises
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/public/cours">
                                        Cours particuliers
                                    </NavLink>
                                </li>
                                <li>
                                    <Link to="/login">
                                        Connexion
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </Container>
                </div>
            </header>

            <main className="public-content">
                <Outlet />
            </main>

            <footer className="public-footer">
                <Container>
                    <div className="public-footer-inner d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <p className="mb-0">
                            Copyright &copy; 2016 Inventor. All Rights Reserved.
                        </p>
                        <p className="mb-0">
                            En cas de problème ou de question, contactez le{" "}
                            <a className="see-more-link" href={`mailto:${VP_GEEK_EMAIL}`}>VP Geek</a>
                        </p>
                    </div>
                </Container>
            </footer>
        </div>
    );
}
