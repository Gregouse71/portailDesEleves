import "../assets/styles/formulaire_connexion.scss"

import { useState } from "react";
import { setNouveauMDP } from "../api/api_global";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";

export default function NouveauMDP() {
  const [mdp, setMdp] = useState(""); // Pour le reset mot de passe
  const [err, setErr] = useState(false);

  const token = useParams().token;

  async function handleNew(e) {
    e.preventDefault();
    const res = await setNouveauMDP(token, mdp);
    setErr(!res.set);
  }

  return (
    <Container className="connexion-main-container d-flex flex-column align-items-center justify-content-center vh-100">
      <h2 className="m-4">Nouveau mot de passe</h2>
      <Form onSubmit={handleNew} className="connexion-form border rounded p-4 d-flex flex-column">
        {err && <Alert variant="danger">Lien invalide. Veuillez obtenir un nouveau lien.</Alert>}
        <Form.Group className="mb-3" controlId="formBasicEmail2">
          <Form.Control type="text" placeholder="Identifiant" value={mdp} onChange={(e) => setMdp(e.target.value)} />
        </Form.Group>
        <Button variant="primary" type="submit">Valider ce mot de passe</Button>
      </Form>
    </Container>
  );
}
