import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { obtenirPhotosUtilisateur, changerPhotoUtilisateur, changerBanniereUtilisateur, ajouterContenuUtilisateur, supprimerPhotoUtilisateur, ajouterLienVideoUtilisateur, renommerPhotoUtilisateur, obtenirDataUser } from "../../../api/api_utilisateurs";
import { Row, Col, Button, Card, Form } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../../../api/base";

export default function TabMedia({ id, autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);
    const [editingMediaId, setEditingMediaId] = useState(null);
    const [editingName, setEditingName] = useState("");

    const { data: photos = [], isLoading } = useQuery({
        queryKey: ['photosUtilisateur', id],
        queryFn: () => obtenirPhotosUtilisateur({}, id),
    });

    const { data: utilisateur } = useQuery({
        queryKey: ['donneesUtilisateur', id],
        queryFn: () => obtenirDataUser(id),
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
                const result = await ajouterContenuUtilisateur(id, file);
                queryClient.invalidateQueries(['photosUtilisateur', id]);
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
    };

    const handleAjouterVideo = async () => {
        const url = window.prompt("Entrez le lien de la vidéo (YouTube, PeerTube, Vimeo, Dailymotion...) :");
        if (url) {
            try {
                const result = await ajouterLienVideoUtilisateur(id, url);
                if (result.success) {
                    queryClient.invalidateQueries(['photosUtilisateur', id]);
                } else {
                    alert(`Erreur : ${result.message}`);
                }
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
    };

    const mutationPhoto = useMutation({
        mutationFn: (id_photo) => changerPhotoUtilisateur(id, id_photo),
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
        }
    });

    const mutationBanniere = useMutation({
        mutationFn: (id_photo) => changerBanniereUtilisateur(id, id_photo),
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
        }
    });

    const mutationRenommer = useMutation({
        mutationFn: async ({ id, name }) => {
            await renommerPhotoUtilisateur({ name }, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['photosUtilisateur', id]);
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
            const res = await supprimerPhotoUtilisateur(id_photo);
            console.log(res);
            if (!res) {
                window.confirm("Impossible de supprimer la photo de profil.")
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
            queryClient.invalidateQueries(['photosUtilisateur', id]);
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
            {autoriseAModifier && (<DropdownEditer list={[
                { can: true, onClick: toggleGestion, name: "Modifier" },
                { can: true, onClick: ajouterPhoto, name: "Ajouter une photo" },
                { can: true, onClick: handleAjouterVideo, name: "Ajouter un lien vidéo" },
            ]} />
            )}
        </div>

        <Row xs={2} sm={3} md={4} lg={5} className="g-3">
            {photos.map((elt, i) => {
                const isIframe = elt.file_path && (elt.file_path.startsWith("http://") || elt.file_path.startsWith("https://"));
                const fileName = elt.nom || (elt.file_path ? elt.file_path.split('/').pop().split('.').shift() : "");
                return (
                    <Col key={i}>
                        <Card className="h-100 text-center">
                            <div className="position-relative">
                                <div className="ratio ratio-1x1">
                                    {isIframe ? (
                                        <iframe
                                            src={elt.file_path}
                                            title="Video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            className="card-img-top p-2"
                                        ></iframe>
                                    ) : (
                                        <Card.Img
                                            variant="top"
                                            src={`${UPLOAD_BASE_URL}/${elt.file_path}`}
                                            alt="Photo"
                                            style={{ objectFit: 'scale-down', cursor: 'pointer' }}
                                            className="p-2"
                                            onClick={() => window.open(`${UPLOAD_BASE_URL}/${elt.file_path}`, '_blank')}
                                        />
                                    )}
                                </div>
                                {autoriseAModifier && isGestion && (
                                    <>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="position-absolute top-0 end-0"
                                            title="Supprimer"
                                            onClick={() => {
                                                let confirmMsg = "Êtes-vous sûr de vouloir supprimer ce média ?";
                                                if (utilisateur?.photo === elt.file_path) {
                                                    confirmMsg = "Attention, ce média est actuellement utilisé comme photo de profil. Si vous le supprimez, vous n'aurez plus de photo de profil. Continuer ?";
                                                } else if (utilisateur?.banniere === elt.file_path) {
                                                    confirmMsg = "Attention, ce média est actuellement utilisé comme bannière. Si vous le supprimez, vous n'aurez plus de bannière. Continuer ?";
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
                                        <Button size="sm" variant="success" onClick={() => handleSaveRename(elt.id)} className="mb-2">
                                            Valider
                                        </Button>
                                        {!isIframe && (
                                            <div className="d-flex gap-1">
                                                <Button size="sm" variant={utilisateur?.photo === elt.file_path ? "primary" : "outline-primary"} disabled={utilisateur?.photo === elt.file_path} className="w-50" style={{ fontSize: '0.7rem' }} onClick={() => { mutationPhoto.mutate(elt.id); handleCancelRename(); }}>Profil</Button>
                                                <Button size="sm" variant={utilisateur?.banniere === elt.file_path ? "primary" : "outline-primary"} disabled={utilisateur?.banniere === elt.file_path} className="w-50" style={{ fontSize: '0.7rem' }} onClick={() => { mutationBanniere.mutate(elt.id); handleCancelRename(); }}>Bannière</Button>
                                            </div>
                                        )}
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
    </>)
}