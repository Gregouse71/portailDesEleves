import "../assets/styles/formulaire_connexion.scss"
import { useState } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation back to login
import { resetMotDePasse } from "../api/api_global";
import { Container, Form, Button, Alert, Card } from "react-bootstrap";

export default function MDPoublie() {
    const [identifiant, setIdentifiant] = useState(""); // Pour l'identifiant (username/email)
    const [sent, setSent] = useState(null); // Tracks if the reset request has been sent
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleReset(e) {
        e.preventDefault();
        setIsSubmitting(true);
        setSent(null);

        await resetMotDePasse(identifiant);

        setSent(true);
        setIsSubmitting(false);
    }

    return (
        <Container className="connexion-main-container d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
            <Card className="shadow-lg p-4 mb-4 text-center" style={{ maxWidth: '400px', width: '100%' }}>
                <Card.Body>
                    <h1 className="mb-4 fs-3 text-primary">
                        Mot de passe oublié
                    </h1>
                    <p className="text-muted mb-4">
                        Entrez votre nom d'utilisateur ou votre email ci-dessous pour recevoir un lien de réinitialisation.
                    </p>

                    {sent && (
                        <Alert variant="info" className="text-start">
                            Si cet identifiant existe, un email a été envoyé à l'adresse associée pour la réinitialisation du mot de passe. Vérifiez votre boîte de réception.
                        </Alert>
                    )}

                    <Form onSubmit={handleReset} className="d-flex flex-column">
                        <Form.Group className="mb-4" controlId="formIdentifiant">
                            <Form.Label className="text-start w-100">Identifiant / E-mail</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nom d'utilisateur ou email"
                                value={identifiant}
                                onChange={(e) => setIdentifiant(e.target.value)}
                                required
                                autoFocus
                            />
                        </Form.Group>
                        <div className="d-grid gap-2">
                            <Button variant="primary" type="submit" size="lg" disabled={isSubmitting || sent}>
                                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Link back to login */}
            <Link to={'/login'} className="text-center text-muted mt-3">
                &#x2190; Retour à la page de connexion
            </Link>
        </Container>
    );
}