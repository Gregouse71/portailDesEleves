import "../assets/styles/formulaire_connexion.scss"

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { seConnecter } from "../api/api_global";
import { Container, Form, Button, Alert, Card, Spinner } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const VP_GEEK_EMAIL = "vianney.decroux@etu.minesparis.psl.eu";
const PORTAL_TITLE = "Portail des élèves";

export default function FormulaireConnexion() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [erreur, setErreur] = useState(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const nextParam = searchParams.get("next");
    const from = nextParam || location.state?.from?.pathname || "/";

    async function handleSubmit(e) {
        e.preventDefault();
        const success = await seConnecter(username, password);
        if (success) {
            queryClient.removeQueries({ queryKey: ['id'] })
            queryClient.removeQueries({ queryKey: ['donneesUtilisateur'] })

            // If it's an absolute URL or starts with /api, use window.location.href
            if (from.startsWith("http") || from.startsWith("/api")) {
                window.location.href = from;
            } else {
                navigate(from, { replace: true });
            }
        } else {
            setErreur("Identifiants incorrects");
        }
    }

    return (
        <Container className="connexion-main-container d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
            <Card className="shadow-lg p-4 mb-4" style={{ maxWidth: '450px', width: '100%' }}>
                <Card.Body>
                    <>
                        <h1 className="text-center mb-4 fs-3">
                            Identification au <br />
                            <strong className="text-primary">{PORTAL_TITLE}</strong>
                        </h1>
                        {erreur && <Alert variant="danger">{erreur}</Alert>}
                        <Form onSubmit={handleSubmit} className="d-flex flex-column">
                            <Form.Group className="mb-3" controlId="formBasicUsername">
                                <Form.Label>Nom d&apos;utilisateur</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Entrer le nom d'utilisateur"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formBasicPassword">
                                <Form.Label>Mot de passe</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <div className="d-grid gap-2 mb-3">
                                <Button variant="primary" type="submit" size="lg">
                                    Se connecter
                                </Button>
                            </div>

                            <Link to={'/oublie'} className="text-center text-muted mt-2">
                                J&apos;ai oublié mon mot de passe
                            </Link>

                        </Form>
                    </>
                </Card.Body>
            </Card>

            <div className="text-center mt-3 text-secondary" style={{ maxWidth: '500px' }}>
                <p className="fs-6">
                    Accès au <strong>{PORTAL_TITLE}</strong> de l&apos;École des <strong>Mines de Paris</strong>.
                </p>
                <p className="small mb-1">
                    En cas de problèmes d&apos;identification, contactez le
                    <a href={`mailto:${VP_GEEK_EMAIL}`} className="ms-1">VP Geek ({VP_GEEK_EMAIL})</a>.
                </p>
                <p className="small">
                    Si vous souhaitez vous désinscrire du site et/ou retirer vos données, contactez également le
                    <a href={`mailto:${VP_GEEK_EMAIL}`} className="ms-1">VP Geek ({VP_GEEK_EMAIL})</a>.
                </p>
            </div>

        </Container>
    );
}