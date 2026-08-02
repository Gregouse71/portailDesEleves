import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Row, Col, Button, Card, Form, Image } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../../../api/base";
import { ajouterContenuAsso, changerPhotoAsso, supprimerPhotoAsso, renommerPhotoAsso, chargerAsso, chargerMandat } from "../../../api/api_associations";


/**
 * Media d'un seul mandat — similaire à AssoMandat pour les membres.
 */
function MandatMedia({ mandatId, asso_id, assoData, membreData }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);
    const [editingMediaId, setEditingMediaId] = useState(null);
    const [editingName, setEditingName] = useState("");

    const { data: mandat, isLoading } = useQuery({
        queryKey: ['mandatAsso', mandatId],
        queryFn: () => chargerMandat({}, mandatId),
    });

    const toggleGestion = () => {
        setIsGestion(!isGestion);
        setEditingMediaId(null);
        setEditingName("");
    };

    const ajouterPhoto = () => {
        document.getElementById(`photo-upload-${mandatId}`).click();
    };

    const handleAjouterPhoto = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                await ajouterContenuAsso(asso_id, mandatId, file);
                queryClient.invalidateQueries(['mandatAsso', mandatId]);
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
        event.target.value = '';
    };

    const mutationPhoto = useMutation({
        mutationFn: async ({ type, id }) => await changerPhotoAsso(asso_id, type, mandatId, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['asso', asso_id]);
            queryClient.invalidateQueries(['mandatAsso', mandatId]);
        }
    });

    const mutationRenommer = useMutation({
        mutationFn: async ({ id, name }) => {
            await renommerPhotoAsso({ name }, asso_id, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['mandatAsso', mandatId]);
            setEditingMediaId(null);
            setEditingName("");
        },
        onError: (error) => {
            alert(`Erreur lors du renommage : ${error.message}`);
        }
    });

    const startRename = (elt) => {
        setEditingMediaId(elt.id);
        setEditingName(elt.nom || (elt.file_path ? elt.file_path.split('/').pop().split('.').shift() : ""));
    };

    const handleSaveRename = (id) => {
        if (editingName.trim()) {
            mutationRenommer.mutate({ id, name: editingName.trim() });
        }
    };

    const handleCancelRename = () => {
        setEditingMediaId(null);
        setEditingName("");
    };

    const mutationSupprimer = useMutation({
        mutationFn: async (id_photo) => {
            const res = await supprimerPhotoAsso(asso_id, id_photo);
            if (!res) {
                window.confirm("Impossible de supprimer le média.");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['mandatAsso', mandatId]);
            queryClient.invalidateQueries(['asso', asso_id]);
        }
    });

    if (isLoading || !mandat) return (
        <Card className="mb-4">
            <Card.Header></Card.Header>
        </Card>
    );

    const photos = mandat.media || [];
    const mandatBanniere = mandat.banniere || null;
    const mandatLogo = mandat.logo || null;
    const isActuel = mandat.actuel;

    return (
        <Card className="mb-4">
            {/* En-tête visuel du mandat (bannière + logo + nom) */}
            <div
                className="mandat-header-banner"
                style={{
                    backgroundImage: mandatBanniere ? `url(${UPLOAD_BASE_URL}/${mandatBanniere})` : 'none',
                }}
            />
            <Card.Header>
                <Row className="align-items-center flex-nowrap">
                    <Col xs="auto">
                        <Image
                            className="mandat-header-logo rounded-3"
                            src={mandatLogo ? `${UPLOAD_BASE_URL}/${mandatLogo}` : '/assets/icons/group.svg'}
                            alt={mandat.nom}
                            rounded
                        />
                    </Col>
                    <Col>
                        <Card.Title className="m-0">{mandat.nom}</Card.Title>
                    </Col>
                    <Col xs="auto">
                        {membreData.autorise && (
                            <DropdownEditer list={[
                                { can: true, onClick: toggleGestion, name: isGestion ? "Terminer" : "Modifier" },
                                { can: true, onClick: ajouterPhoto, name: "Ajouter" },
                            ]} />
                        )}
                    </Col>
                </Row>
            </Card.Header>

            <input
                type="file"
                id={`photo-upload-${mandatId}`}
                className="d-none"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleAjouterPhoto}
            />

            <Card.Body>


                {photos.length === 0 ? (
                    <p className="text-muted mb-0">Aucun média pour ce mandat.</p>
                ) : (
                    <Row xs={2} sm={3} md={4} lg={5} className="g-3">
                        {photos.map((elt, i) => {
                            const fileName = elt.nom || (elt.file_path ? elt.file_path.split('/').pop().split('.').shift() : "");
                            const isLogo = mandat.logo_id === elt.id;
                            const isBanniere = mandat.banniere_id === elt.id;
                            return (
                                <Col key={i}>
                                    <Card className="h-100 text-center">
                                        <div className="position-relative">
                                            <div className="ratio ratio-1x1">
                                                <Card.Img
                                                    variant="top"
                                                    src={`${UPLOAD_BASE_URL}/${elt.file_path}`}
                                                    alt="Photo"
                                                    style={{ objectFit: 'scale-down', cursor: 'pointer' }}
                                                    className="p-2"
                                                    onClick={() => window.open(`${UPLOAD_BASE_URL}/${elt.file_path}`, '_blank')}
                                                />
                                            </div>
                                            {membreData.autorise && isGestion && (
                                                <>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="position-absolute top-0 end-0"
                                                        title="Supprimer"
                                                        onClick={() => {
                                                            let confirmMsg = "Êtes-vous sûr de vouloir supprimer ce média ?";
                                                            if (isLogo) {
                                                                confirmMsg = `Attention, ce média est le logo du mandat « ${mandat.nom} ». Continuer ?`;
                                                            } else if (isBanniere) {
                                                                confirmMsg = `Attention, ce média est la bannière du mandat « ${mandat.nom} ». Continuer ?`;
                                                            }
                                                            if (window.confirm(confirmMsg)) {
                                                                mutationSupprimer.mutate(elt.id);
                                                            }
                                                        }}
                                                        style={{ zIndex: 1 }}
                                                    >
                                                        <img src="/assets/icons/delete.svg" alt="suppression" />
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="position-absolute top-0 start-0"
                                                        title="Modifier"
                                                        onClick={() => {
                                                            if (editingMediaId === elt.id) {
                                                                handleCancelRename();
                                                            } else {
                                                                startRename(elt);
                                                            }
                                                        }}
                                                        style={{ zIndex: 1 }}
                                                    >
                                                        <img src="/assets/icons/edit.svg" alt="modification" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                        <Card.Footer className="p-2 d-flex flex-column justify-content-center">
                                            {editingMediaId === elt.id ? (
                                                <>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label>Nom</Form.Label>
                                                        <Form.Control
                                                            size="sm"
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </Form.Group>
                                                    <Button size="sm" variant="success" onClick={() => handleSaveRename(elt.id)} className="mb-2 w-100">
                                                        Valider
                                                    </Button>
                                                    <div className="d-flex gap-1">
                                                        <Button size="sm" variant={isLogo ? "primary" : "outline-primary"} disabled={isLogo} className="w-50" style={{ fontSize: '0.7rem' }} onClick={() => { mutationPhoto.mutate({ type: "logo", id: elt.id }); handleCancelRename(); }}>Logo</Button>
                                                        <Button size="sm" variant={isBanniere ? "primary" : "outline-primary"} disabled={isBanniere} className="w-50" style={{ fontSize: '0.7rem' }} onClick={() => { mutationPhoto.mutate({ type: "banniere", id: elt.id }); handleCancelRename(); }}>Bannière</Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-truncate text-muted small" title={fileName}>
                                                    {fileName}
                                                </div>
                                            )}
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}


/**
 * Page Media — structure identique à AssoMembres.
 * Liste les mandats, chacun avec ses photos.
 */
export default function AssosMedia({ asso_id, membreData }) {
    const { data: asso, isLoading } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });

    const sortedMandats = useMemo(() => {
        if (!asso?.mandats) return [];
        return [...asso.mandats].sort((a, b) => {
            if (a.actuel) return -1;
            if (b.actuel) return 1;
            return b.position - a.position;
        });
    }, [asso]);

    if (isLoading) return <>Chargement...</>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Les photos</h2>
            </div>

            {sortedMandats.map((mandat) => (
                <MandatMedia
                    key={mandat.id}
                    mandatId={mandat.id}
                    asso_id={asso_id}
                    assoData={asso}
                    membreData={membreData}
                />
            ))}
        </div>
    );
}