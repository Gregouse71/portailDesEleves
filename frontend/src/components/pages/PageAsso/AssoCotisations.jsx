import { useState } from "react";
import { Badge, Button, Card, Col, Form, Row, ListGroup, InputGroup } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProtected } from "../../../Protected";
import {
    obtenirCotisationsAsso,
    creerNouvelleCotisation,
    modifierCotisation,
    supprimerCotisation,
    ajouterMembreCotisation,
    supprimerMembreCotisation,
    exporterMembresCotisation
} from "../../../api/modules/api_cotisations";
import { searchUsers } from "../../../api/api_utilisateurs";
import ConfirmationModal from "../../elements/ConfirmationModal";

const format_date = (s) => s ? new Date(s).toLocaleDateString("fr-FR") : "Non précisé";

function CotisationCard({ isNew, id, association_id, canModify, cotisationData, stopCreating }) {
    const queryClient = useQueryClient();
    const [isModifying, setIsModifying] = useState(isNew);
    const [showMembres, setShowMembres] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    
    const [formState, setFormState] = useState(isNew ? {
        nom: "",
        date_debut: "",
        date_fin: ""
    } : {
        nom: cotisationData.nom,
        date_debut: cotisationData.date_debut,
        date_fin: cotisationData.date_fin
    });

    const mutation = useMutation({
        mutationFn: async () => {
            if (isNew) {
                await creerNouvelleCotisation(association_id, formState);
            } else {
                await modifierCotisation(association_id, id, formState);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cotisations_asso', association_id]);
            if (isNew) {
                stopCreating();
            } else {
                setIsModifying(false);
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await supprimerCotisation(association_id, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cotisations_asso', association_id]);
        }
    });

    const addMemberMutation = useMutation({
        mutationFn: async (user_id) => {
            await ajouterMembreCotisation(association_id, id, user_id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cotisations_asso', association_id]);
            setSearchQuery("");
            setSearchResults([]);
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (user_id) => {
            await supprimerMembreCotisation(association_id, id, user_id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cotisations_asso', association_id]);
        }
    });

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.trim().length > 1) {
            const results = await searchUsers({ query: val, limit: 5 });
            if (results) {
                setSearchResults(results);
            }
        } else {
            setSearchResults([]);
        }
    };

    if (isModifying) {
        return (
            <Card className="mb-3 shadow-sm border-0">
                <Card.Body>
                    <Card.Title>{isNew ? "Créer une cotisation" : "Modifier la cotisation"}</Card.Title>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom de la cotisation</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={formState.nom} 
                                onChange={(e) => setFormState({ ...formState, nom: e.target.value })} 
                                placeholder="ex: Cotisation Annuelle 2026"
                            />
                        </Form.Group>
                        <Row className="mb-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formState.date_debut} 
                                        onChange={(e) => setFormState({ ...formState, date_debut: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Date de fin</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formState.date_fin} 
                                        onChange={(e) => setFormState({ ...formState, date_fin: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex gap-2">
                            <Button variant="success" onClick={mutation.mutate} disabled={!formState.nom || !formState.date_debut || !formState.date_fin}>
                                Valider
                            </Button>
                            <Button variant="secondary" onClick={() => { if (isNew) { stopCreating() } else { setIsModifying(false) } }}>
                                Annuler
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        );
    }

    const today = new Date().toISOString().split("T")[0];
    const isActive = cotisationData.date_debut <= today && today <= cotisationData.date_fin;

    return (
        <Card className="mb-3 shadow-sm border-0">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <Card.Title className="mb-1 d-flex align-items-center gap-2">
                            {cotisationData.nom}
                            {isActive ? (
                                <Badge bg="success">Active</Badge>
                            ) : (
                                <Badge bg="secondary">Inactive</Badge>
                            )}
                        </Card.Title>
                        <div className="text-muted small mb-2">
                            Période : Du {format_date(cotisationData.date_debut)} au {format_date(cotisationData.date_fin)}
                        </div>
                        <div>
                            Nombre de cotisants : <Badge bg="info">{cotisationData.membres?.length || 0}</Badge>
                        </div>
                    </div>
                    {canModify && (
                        <div className="d-flex gap-2">
                            <Button variant="outline-primary" size="sm" onClick={() => setShowMembres(!showMembres)}>
                                {showMembres ? "Masquer membres" : "Gérer les membres"}
                            </Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => exporterMembresCotisation(association_id, id)}>
                                Exporter CSV
                            </Button>
                            <Button variant="outline-warning" size="sm" onClick={() => setIsModifying(true)}>
                                Modifier
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => {
                                if (window.confirm("Êtes-vous sûr de vouloir supprimer cette cotisation ?")) {
                                    deleteMutation.mutate();
                                }
                            }}>
                                Supprimer
                            </Button>
                        </div>
                    )}
                </div>

                {showMembres && canModify && (
                    <div className="mt-3 border-top pt-3">
                        <h6>Ajouter un membre payant</h6>
                        <Form.Group className="mb-3 position-relative">
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher un élève par nom, prénom ou nom d'utilisateur..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button variant="outline-secondary" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                                        Vider
                                    </Button>
                                )}
                            </InputGroup>
                            {searchResults.length > 0 && (
                                <ListGroup className="position-absolute w-100 shadow-sm mt-1" style={{ zIndex: 1000 }}>
                                    {searchResults.map((user) => {
                                        const alreadyPaid = cotisationData.membres.includes(user.id);
                                        return (
                                            <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                                                <span>{user.prenom} {user.nom} ({user.nom_utilisateur}) - promo {user.promotion}</span>
                                                <Button 
                                                    variant={alreadyPaid ? "outline-secondary" : "primary"} 
                                                    size="sm" 
                                                    disabled={alreadyPaid}
                                                    onClick={() => addMemberMutation.mutate(user.id)}
                                                >
                                                    {alreadyPaid ? "Déjà cotisé" : "Ajouter"}
                                                </Button>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            )}
                        </Form.Group>

                        {/* List of current members */}
                        <h6>Membres ayant cotisé</h6>
                        {cotisationData.membres?.length === 0 ? (
                            <p className="text-muted small">Aucun membre enregistré pour cette cotisation.</p>
                        ) : (
                            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                                <ListGroup variant="flush">
                                    {cotisationData.membres.map((userId) => (
                                        <MemberRow 
                                            key={userId} 
                                            userId={userId} 
                                            onRemove={() => removeMemberMutation.mutate(userId)} 
                                        />
                                    ))}
                                </ListGroup>
                            </div>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

// A simple component to fetch user details reactively for a row
function MemberRow({ userId, onRemove }) {
    // We can import obtaining details or use a query. 
    // In portaildeseleves users are queryable. Let's see if we can get user info or display a simple identifier.
    // To make it look extremely premium, we query the user data:
    const { data: user = null } = useQuery({
        queryKey: ['user_details', userId],
        queryFn: async () => {
            // We can fetch user profile or get from a caching query.
            const res = await fetch(`/api/users/obtenir_infos_profil/${userId}`, { credentials: "include" });
            return res.json();
        }
    });

    if (!user) return <ListGroup.Item className="d-flex justify-content-between align-items-center py-1 text-muted small">Chargement utilisateur #{userId}...</ListGroup.Item>;

    return (
        <ListGroup.Item className="d-flex justify-content-between align-items-center py-1">
            <div>
                <strong>{user.prenom} {user.nom}</strong> <span className="text-muted small">({user.nom_utilisateur}) - promo {user.promotion}</span>
            </div>
            <Button variant="link" className="text-danger p-0" onClick={onRemove}>
                Retirer
            </Button>
        </ListGroup.Item>
    );
}

export default function AssoCotisations({ asso_id, membreData }) {
    const { userData } = useProtected();
    const [isCreating, setIsCreating] = useState(false);

    const { data: cotisations = [], isLoading } = useQuery({
        queryKey: ['cotisations_asso', asso_id],
        queryFn: () => obtenirCotisationsAsso(asso_id),
    });

    const canModify = userData.is_superuser || membreData.autorise;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestion des Cotisations</h2>
                {canModify && !isCreating && (
                    <Button variant="outline-primary" onClick={() => setIsCreating(true)}>
                        Créer une cotisation
                    </Button>
                )}
            </div>

            {isCreating && (
                <CotisationCard 
                    isNew={true} 
                    association_id={asso_id} 
                    canModify={canModify} 
                    stopCreating={() => setIsCreating(false)} 
                />
            )}

            {isLoading ? (
                <div>Chargement des cotisations...</div>
            ) : cotisations.length === 0 ? (
                <div className="text-muted text-center py-4">
                    Aucune cotisation n&apos;est définie pour cette association.
                </div>
            ) : (
                cotisations.map((cot) => (
                    <CotisationCard 
                        key={cot.id} 
                        id={cot.id} 
                        association_id={asso_id} 
                        canModify={canModify} 
                        cotisationData={cot} 
                    />
                ))
            )}
        </>
    );
}
