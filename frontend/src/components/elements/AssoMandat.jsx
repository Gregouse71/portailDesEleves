import { Card, Form, Button, Row, Col } from "react-bootstrap";
import Select from "react-select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ajouterMembre, modifierMandat, modifierPositionMembre, modifierRoleMembre, retirerMembre, supprimerMandat } from "../../api/api_associations";
import { useState } from "react";
import UserCard from "./UserCard";
import DropdownEditer from "./DropdownEditer";
import { chargerUtilisateurs, obtenirListeDesPromos } from "../../api/api_utilisateurs";

export default function AssoMandat({ mandat, asso, canModify }) {
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [editingMandat, setEditingMandat] = useState(mandat);

    const [idMembreModifier, setIdMembreModifier] = useState(null); // Id du membre à modifier
    const [nouveauRole, setNouveauRole] = useState("");
    const [nouvellePosition, setNouvellePosition] = useState("");

    const [listeNouveauxMembres, setListeNouveauxMembres] = useState([]);

    const [isAjoutMembre, setIsAjoutMembre] = useState(false);
    const [promoAjoutMembre, setPromoAjoutMembre] = useState(null);
    const [idAjoutMembre, setIdAjoutMembre] = useState(null);

    const { data: listePromos = [] } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

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

    const startAjoutMembre = () => {
        if (isAjoutMembre) return;

        setIsAjoutMembre(true);
        if (listePromos.length > 0 && !promoAjoutMembre) {
            const latestPromo = listePromos[0];
            handlePromoChange({ value: latestPromo, label: latestPromo });
        }
    }

    const handleRetirerMembre = async (membreId) => {
        try {
            await retirerMembre(asso.id, mandat.id, membreId);
            queryClient.invalidateQueries(['asso', asso.id]);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePromoChange = async (selectedOption) => {
        setPromoAjoutMembre(selectedOption);
        setIdAjoutMembre(null); // Reset user selection
        setListeNouveauxMembres([]); // Reset user list

        if (selectedOption) {
            try {
                const listeMembres = await chargerUtilisateurs(selectedOption.value);
                setListeNouveauxMembres(listeMembres);
            } catch (erreur) {
                console.error(erreur);
            }
        }
    }

    const handleAjoutMembre = async () => {
        if (idAjoutMembre) {
            try {
                await ajouterMembre(asso.id, mandat.id, idAjoutMembre.value);
                setIsAjoutMembre(false);
                queryClient.invalidateQueries(['asso', asso.id]);
            } catch (erreur) {
                console.error(erreur);
            }
        }
    }


    return (
        <Card key={mandat.id} className="mb-4">
            <Card.Header><Row className="align-items-center">
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
                                        <Form.Label>Priorité d&apos;affichage</Form.Label>
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
                        canModify && <DropdownEditer list={[
                            { can: true, onClick: () => { setEditingMandat(mandat); setIsEditing(true) }, name: "Modifier" },
                            { can: true, onClick: () => handleDelMandat(mandat.id), name: "Supprimer" },
                            { can: true, onClick: startAjoutMembre, name: "Ajouter un membre" },
                        ]}
                        />
                    }
                </Col>
            </Row></Card.Header>
            <Card.Body>
                {isAjoutMembre && (
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Ajouter un membre</Card.Title>
                            <div className="w-100 p-2">
                                <Form.Group className="mb-3 text-start">
                                    <Form.Label>Promotion</Form.Label>
                                    <Select
                                        options={listePromos.map(p => ({ value: p, label: p }))}
                                        value={promoAjoutMembre}
                                        onChange={handlePromoChange}
                                        placeholder="Choisir une promo..."
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        classNamePrefix="react-select"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3 text-start">
                                    <Form.Label>Utilisateur</Form.Label>
                                    <Select
                                        options={listeNouveauxMembres.map(u => ({ value: u.id, label: u.nom_utilisateur }))}
                                        value={idAjoutMembre}
                                        onChange={setIdAjoutMembre}
                                        placeholder="Choisir un utilisateur..."
                                        isDisabled={!promoAjoutMembre || listeNouveauxMembres.length === 0}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        classNamePrefix="react-select"
                                    />
                                </Form.Group>
                                <Button variant="primary" onClick={handleAjoutMembre} disabled={!idAjoutMembre}>Ajouter</Button>
                                <Button variant="secondary" onClick={() => setIsAjoutMembre(false)} className="ms-2">Annuler</Button>
                            </div>
                        </Card.Body>
                    </Card>
                )}
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

