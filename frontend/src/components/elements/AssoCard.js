import { Card, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { UPLOAD_BASE_URL } from "../../api/base";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chargerAsso, modifierOrdreImportanceAsso, modifierNomAsso } from "../../api/api_associations";
import { useEffect, useState } from "react";

export default function AssoCard({ asso_id, mandat, role, isEditMode, isEditingAsso, onEditAsso }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: asso, isLoading } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });

    const [ordre, setOrdre] = useState(asso?.ordre_importance || 0);
    const [nom, setNom] = useState(asso?.nom || "");

    useEffect(() => {
        if (asso) {
            setOrdre(asso.ordre_importance || 0);
            setNom(asso.nom || "");
        }
    }, [asso]);

    useEffect(() => {
        if (!isEditMode) {
            onEditAsso(null); // Reset editing when edit mode is turned off
        }
    }, [isEditMode, onEditAsso]);

    const handleSave = async () => {
        let hasChanged = false;

        if (asso && parseInt(ordre, 10) !== asso.ordre_importance) {
            try {
                await modifierOrdreImportanceAsso(asso.id, parseInt(ordre, 10));
                hasChanged = true;
            } catch (error) {
                console.error("Failed to update priority:", error);
                if (asso) {
                    setOrdre(asso.ordre_importance);
                }
            }
        }

        if (asso && nom !== asso.nom) {
            try {
                await modifierNomAsso(asso.id, nom);
                hasChanged = true;
            } catch (error) {
                console.error("Failed to update name:", error);
                if (asso) {
                    setNom(asso.nom);
                }
            }
        }

        if (hasChanged) {
            queryClient.invalidateQueries(['listeAssos']);
            queryClient.invalidateQueries(['asso', asso_id]);
        }
        onEditAsso(null); // Stop editing after saving
    };

    const handleCancelEdit = () => {
        if (asso) {
            setOrdre(asso.ordre_importance || 0); // Reset to original value
            setNom(asso.nom || "");
        }
        onEditAsso(null); // Stop editing
    };

    const handleCardClick = () => {
        if (!isEditMode) {
            navigate(`/assos/get/${asso.id}`);
        }
    };

    return (isLoading
        ? <div> Chargement ...</div>
        : <Card
            className="h-100 text-center"
            onClick={handleCardClick}
            style={{ cursor: isEditMode ? 'default' : 'pointer', position: 'relative' }}
        >
            {isEditMode && (
                <Button
                    className="btn-sm"
                    variant="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isEditingAsso) {
                            handleCancelEdit();
                        } else {
                            onEditAsso(asso.id);
                        }
                    }}
                    style={{ position: 'absolute', zIndex: 1 }}
                >
                    <img src="/assets/icons/edit.svg" alt="Editer la priorité" />
                </Button>
            )}

            {asso.img !== null && <Card.Img
                variant="top"
                className="mt-3 object-fit-contain"
                src={`${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}`}
                alt={asso.nom}
                style={{ height: '120px', backgroundColor: "white" }}
            />}
            <Card.Body className="px-2">
                {!isEditingAsso && <Card.Title>{nom}</Card.Title>}
                {role && <> <hr /><Card.Text>{role}</Card.Text></>}
                {isEditMode && !isEditingAsso && (
                    <>
                        <hr />
                        <Card.Text>Position : {ordre}</Card.Text>
                    </>
                )}
                {isEditingAsso && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Form.Group className="mb-2">
                            <Form.Label>Nom</Form.Label>
                            <Form.Control
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Position</Form.Label>
                            <Form.Control
                                type="number"
                                value={ordre}
                                onChange={(e) => setOrdre(e.target.value)}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-around mt-2">
                            <Button variant="success" onClick={handleSave}>Valider</Button>
                        </div>
                    </div>
                )}
            </Card.Body>
            {mandat && <Card.Footer><Card.Text>{mandat}</Card.Text></Card.Footer>}
        </Card>);
}

