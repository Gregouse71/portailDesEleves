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

    const [ordre, setOrdre] = useState(0);
    const [nom, setNom] = useState("");

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
            }
        }

        if (asso && nom !== asso.nom) {
            try {
                await modifierNomAsso(asso.id, nom);
                hasChanged = true;
            } catch (error) {
                console.error("Failed to update name:", error);
            }
        }

        if (hasChanged) {
            queryClient.invalidateQueries(['listeAssos']);
            queryClient.invalidateQueries(['asso', asso_id]);
        }
        onEditAsso(null); // Stop editing after saving
    };

    const handleCancelEdit = () => {
        onEditAsso(null); // Stop editing
    };

    const handleStartEdit = () => {
        if (asso) {
            setNom(asso.nom);
            setOrdre(asso.ordre_importance);
        }
        onEditAsso(asso.id);
    }

    const handleCardClick = () => {
        if (!isEditMode) {
            navigate(`/assos/get/${asso.id}`);
        }
    };

    return (isLoading
        ? <Card className="h-100 text-center">
            <Card.Body>
            </Card.Body>
        </Card>
        : <Card
            className="h-100 text-center"
            onClick={handleCardClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
            role="button"
            tabIndex={isEditMode ? -1 : 0}
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
                            handleStartEdit();
                        }
                    }}
                    style={{ position: 'absolute', zIndex: 1 }}
                >
                    <img src="/assets/icons/edit.svg" alt="Editer la priorité" />
                </Button>
            )}

            <Card.Img
                variant="top"
                className="mt-3 object-fit-contain"
                src={asso.img ? `${UPLOAD_BASE_URL}/${asso.img}` : '/assets/icons/group.svg'}
                alt={asso.nom}
                style={{ height: '120px', backgroundColor: "white" }}
            />
            <Card.Body className="px-2">
                {!isEditingAsso && <Card.Title>{asso.nom}</Card.Title>}
                {role && <> <hr /><Card.Text>{role}</Card.Text></>}
                {isEditMode && !isEditingAsso && (
                    <>
                        <hr />
                        <Card.Text>Position : {asso.ordre_importance}</Card.Text>
                    </>
                )}
                {isEditingAsso && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex="0"
                        style={{ cursor: 'auto' }}
                    >
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

