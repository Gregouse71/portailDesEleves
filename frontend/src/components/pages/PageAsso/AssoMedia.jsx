import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Row, Col, Button, Card, Form } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../../../api/base";
import { ajouterContenuAsso, changerPhotoAsso, obtenirPhotosAsso, supprimerPhotoAsso, renommerPhotoAsso, chargerAsso } from "../../../api/api_associations";

export default function AssosMedia({ asso_id, membreData }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);
    const [editingMediaId, setEditingMediaId] = useState(null);
    const [editingName, setEditingName] = useState("");

    const { data: photos = [], isLoading } = useQuery({
        queryKey: ['photosAsso', asso_id],
        queryFn: () => obtenirPhotosAsso({}, asso_id),
    });

    const { data: asso } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });

    const toggleGestion = () => {
        setIsGestion(!isGestion);
        setEditingMediaId(null);
        setEditingName("");
    };

    const ajouterPhoto = () => {
        document.getElementById('photo-upload').click();
    };
    const handleAjouterPhoto = async () => {
        const file = event.target.files[0];

        if (file) {
            try {
                const result = await ajouterContenuAsso(asso_id, file);
                queryClient.invalidateQueries(['photosAsso', asso_id]);
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
    };

    const mutationPhoto = useMutation({
        mutationFn: async ({ type, id }) => await changerPhotoAsso(asso_id, type, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['asso', asso_id]);
        }
    });

    const mutationRenommer = useMutation({
        mutationFn: async ({ id, name }) => {
            await renommerPhotoAsso({ name }, asso_id, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['photosAsso', asso_id]);
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
            console.log(res);
            if (!res) {
                window.confirm("Impossible de supprimer le logo.")
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['photosAsso', asso_id]);
        }
    })

    if (isLoading) return <>Loading...</>

    return (<>
        <input
            type="file"
            id="photo-upload"
            className="d-none"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleAjouterPhoto}
        />
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Mes photos</h2>
            {membreData.autorise && (<DropdownEditer list={[
                { can: true, onClick: toggleGestion, name: "Modifier" },
                { can: true, onClick: ajouterPhoto, name: "Ajouter" },
            ]} />
            )}
        </div>

        <Row xs={2} sm={3} md={4} lg={5} className="g-3">
            {photos.map((elt, i) => {
                const fileName = elt.nom || (elt.file_path ? elt.file_path.split('/').pop() : "");
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
                                                if (asso?.img === elt.file_path) {
                                                    confirmMsg = "Attention, ce média est actuellement utilisé comme logo. Si vous le supprimez, l'association n'aura plus de logo. Continuer ?";
                                                } else if (asso?.banniere_path === elt.file_path) {
                                                    confirmMsg = "Attention, ce média est actuellement utilisé comme bannière. Si vous le supprimez, l'association n'aura plus de bannière. Continuer ?";
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
                            <Card.Body className="p-2 d-flex flex-column justify-content-center">
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
                                            <Button size="sm" variant={asso?.img === elt.file_path ? "primary" : "outline-primary"} disabled={asso?.img === elt.file_path} className="w-50" style={{ fontSize: '0.7rem' }} onClick={() => { mutationPhoto.mutate({ type: "logo", id: elt.id }); handleCancelRename(); }}>Logo</Button>
                                            <Button size="sm" variant={asso?.banniere_path === elt.file_path ? "primary" : "outline-primary"} disabled={asso?.banniere_path === elt.file_path} className="w-50" style={{ fontSize: '0.7rem' }} onClick={() => { mutationPhoto.mutate({ type: "banniere", id: elt.id }); handleCancelRename(); }}>Bannière</Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-truncate text-muted small" title={fileName}>
                                        {fileName}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    </>)
}