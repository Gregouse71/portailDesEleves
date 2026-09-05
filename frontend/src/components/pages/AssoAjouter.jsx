import { useState } from "react";
import { ajouterAsso } from '../../api/api_associations';  // Importation de la fonction ajouterAsso
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert } from "react-bootstrap";
import RichEditor from "../elements/RichEditor";
import { useQueryClient } from "@tanstack/react-query";

function AjouterAssociation() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");
    const [typeAssociation, setTypeAssociation] = useState("");
    const [ordreImportance, setOrdreImportance] = useState("");
    const [estSensible, setEstSensible] = useState(false);
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérifier que les champs obligatoires sont remplis
        if (!nom.trim()) {
            setErreur("Le nom de l'association est requis.");
            setMessage("");
            return;
        }

        if (!ordreImportance.trim()) {
            setErreur("L'ordre d'importance est requis.");
            setMessage("");
            return;
        }

        // Appel à la fonction pour ajouter l'association
        const response = await ajouterAsso(nom, description, typeAssociation, ordreImportance, estSensible);
        queryClient.invalidateQueries(['listeAssos']);

        if (response.success) {
            setMessage("Association ajoutée avec succès.");
            setErreur("");
        } else {
            setErreur(response.message || "Erreur lors de l'ajout de l'association.");
            setMessage("");
        }
    };

    return (
        <Container className="mt-4">
            <h1>Ajout d&apos;une association</h1>

            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            {erreur && <Alert variant="danger" onClose={() => setErreur('')} dismissible>{erreur}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formNomAsso">
                    <Form.Label>Nom de l&apos;association</Form.Label>
                    <Form.Control
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Nom de l'association"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formDescriptionAsso">
                    <Form.Label>Description</Form.Label>
                    <RichEditor value={description}
                        onChange={(value) => setDescription(value)} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formTypeAsso">
                    <Form.Label>Type d&apos;association</Form.Label>
                    <Form.Select
                        value={typeAssociation}
                        onChange={(e) => setTypeAssociation(e.target.value)}
                    >
                        <option value="">Sélectionner</option>
                        <option value="Club BDE">Club BDE</option>
                        <option value="Asso Loi 1901">Asso Loi 1901</option>
                        {/* Ajoutez d'autres options si nécessaire */}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formOrdreImportance">
                    <Form.Label>Ordre d&apos;importance</Form.Label>
                    <Form.Control
                        type="number"
                        value={ordreImportance}
                        onChange={(e) => setOrdreImportance(e.target.value)}
                        placeholder="Ordre d'importance"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formEstSensible">
                    <Form.Check
                        type="checkbox"
                        label="Association sensible"
                        checked={estSensible}
                        onChange={(e) => setEstSensible(e.target.checked)}
                    />
                </Form.Group>

                <Button variant="primary" type="submit">
                    Ajouter l&apos;association
                </Button>
                <Button variant="secondary" onClick={() => navigate("/assos")} className="ms-2">
                    Retour
                </Button>
            </Form>
        </Container>
    );
}

export default AjouterAssociation;