import { Card, Form, Button, Row, Col } from "react-bootstrap";
import { useQueryClient } from "@tanstack/react-query";
import { modifierMandat, modifierPositionMembre, modifierRoleMembre, retirerMembre, supprimerMandat } from "../../api/api_associations";
import { useState } from "react";
import UserCard from "./UserCard";
import DropdownEditer from "./DropdownEditer";

export default function AssoMandat({ mandat, asso, canModify }) {
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [editingMandat, setEditingMandat] = useState(mandat);

    const [idMembreModifier, setIdMembreModifier] = useState(null); // Id du membre à modifier
    const [nouveauRole, setNouveauRole] = useState("");
    const [nouvellePosition, setNouvellePosition] = useState("");

    const handleDelMandat = async () => {
        try {
            await supprimerMandat(asso.id, mandat.id);
            queryClient.invalidateQueries(['asso', asso.id]);
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const handleSaveMandat = async () => {
        try {
            await modifierMandat(asso.id, editingMandat.id, editingMandat.nom, editingMandat.position, editingMandat.actuel);
            if (editingMandat.actuel) {
                const otherMandats = asso.mandats.filter(m => m.id !== editingMandat.id && m.actuel);
                for (const other of otherMandats) {
                    await modifierMandat(asso.id, other.id, other.nom, other.position, false);
                }
            }
            queryClient.invalidateQueries(['asso', asso.id]);
            setIsEditing(false);
            setEditingMandat(null);
        } catch (error) {
            console.error(error);
        }
    }

    const handleModifierParametres = (userId, userRole, userPosition) => {
        if (idMembreModifier === userId) {
            setIdMembreModifier(null);
        }
        else {
            setNouveauRole(userRole || "");
            setNouvellePosition(userPosition?.toString() || "");
            setIdMembreModifier(userId);
        }
    }

    const handleMembreChange = async (membreId) => {
        const memberToModify = mandat.membres.find(u => u.id === membreId);
        if (!memberToModify) return;

        const originalRole = memberToModify.role || "";
        const originalPosition = memberToModify.position?.toString() || "";

        let roleChanged = nouveauRole !== originalRole;
        let positionChanged = nouvellePosition !== originalPosition;

        if (roleChanged) {
            try {
                await modifierRoleMembre(asso.id, mandat.id, membreId, nouveauRole);
            } catch (erreur) {
                console.error(erreur);
            }
        }
        if (positionChanged) {
            try {
                await modifierPositionMembre(asso.id, mandat.id, membreId, parseInt(nouvellePosition));
            } catch (erreur) {
                console.error(erreur)
            }
        }

        if (roleChanged || positionChanged) {
            queryClient.invalidateQueries(['asso', asso.id]);
        }

        setIdMembreModifier(null);
    }

    const handleRetirerMembre = async (membreId) => {
        try {
            await retirerMembre(asso.id, mandat.id, membreId);
            queryClient.invalidateQueries(['asso', asso.id]);
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <Card key={mandat.id} className="mb-4">
            <Card.Header>
                <Row className="align-items-center">
                    <Col xs={12} md>
                        {isEditing ? (
                            <Form className="w-100">
                                <Row className="align-items-end">
                                    <Col>
                                        <Form.Group>
                                            <Form.Label>Nom</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingMandat.nom}
                                                onChange={(e) => setEditingMandat({ ...editingMandat, nom: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group>
                                            <Form.Label>Priorité d'affichage</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={editingMandat.position}
                                                onChange={(e) => setEditingMandat({ ...editingMandat, position: parseInt(e.target.value) || 0 })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col className="d-flex align-items-end pb-1">
                                        <Form.Check
                                            type="checkbox"
                                            label="Mandat actuel"
                                            checked={editingMandat.actuel}
                                            onChange={(e) => setEditingMandat({ ...editingMandat, actuel: e.target.checked })}
                                        />
                                    </Col>
                                </Row>
                            </Form>
                        ) : (
                            <Card.Title className="m-0">{mandat.nom}</Card.Title>
                        )}
                    </Col>
                    <Col xs={12} md="auto" className="d-flex gap-2 mt-2 mt-md-0">
                        {isEditing ?
                            <>
                                <Button variant="success" onClick={handleSaveMandat}>Valider</Button>
                                <Button variant="secondary" onClick={() => { setEditingMandat(mandat); setIsEditing(false) }}>Annuler</Button>
                            </>
                            :
                            <DropdownEditer list={[
                                {can: canModify, onClick: () => { setEditingMandat(mandat); setIsEditing(true)}, name: "Modifier"},
                                {can: canModify, onClick: () => handleDelMandat(mandat.id), name: "Supprimer"},
                            ]}
                            />
                        }
                    </Col>
                </Row>
            </Card.Header>
            <Card.Body>
                <div className="member-grid">
                    {[...mandat.membres].sort((a, b) => {
                        if (a.position === null) return 1;
                        if (b.position === null) return -1;
                        return b.position - a.position;
                    }).map((user) => (
                        <UserCard user={user} isGestion={isEditing} isModifying={idMembreModifier === user.id}
                            key={user.id}
                            f1={() => handleRetirerMembre(user.id)}
                            t1="Supprimer ce membre"
                            f2={() => { handleModifierParametres(user.id, user.role, user.position) }}
                            t2="Modifier les paramètres"
                            values={[
                                { label: "Rôle", value: nouveauRole, onChange: (e) => setNouveauRole(e.target.value) },
                                { label: "Position", value: nouvellePosition, onChange: (e) => setNouvellePosition(e.target.value) }
                            ]}
                            validate={() => handleMembreChange(user.id)}
                        />
                    ))}
                </div>
            </Card.Body>
        </Card>);
}

