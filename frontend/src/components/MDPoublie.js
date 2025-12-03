import "../assets/styles/formulaire_connexion.scss"

import { useState } from "react";
import { resetMotDePasse } from "../api/api_global";
import { Container, Form, Button, Alert } from "react-bootstrap";

export default function MDPoublie() {
    const [identifiant, setIdentifiant] = useState(""); // Pour le reset mot de passe
    const [sent, setSent] = useState(null);

    async function handleReset(e) {
        e.preventDefault();
        setSent(true);
        await resetMotDePasse(identifiant);
    }

    return (
        <Container className="connexion-main-container d-flex flex-column align-items-center justify-content-center vh-100">
            <h2 className="m-4">Mot de passe oublié</h2>
            {sent && <Alert variant="primary">Si cet identifiant existe, un mail a été envoyé à l'adresse associée pour la réinitialisation du mot de passe.</Alert>}
            <Form onSubmit={handleReset} className="connexion-form border rounded p-4 d-flex flex-column">
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Control type="text" placeholder="Identifiant" value={identifiant} onChange={(e) => { setIdentifiant(e.target.value); console.log(identifiant) }} />
                </Form.Group>
                <Button type="submit">Envoyer un mail de réinitialisation</Button>
            </Form>
        </Container>
    );
}
