import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlbums, addAlbum, addAudio, removeAudio, updateAlbum, deleteAlbum, updateAudio, getAlbum } from '../../../api/modules/api_audio';
import { estUtilisateurDansAsso } from '../../../api/api_associations';
import { UPLOAD_BASE_URL } from '../../../api/base';
import { Button, Form, Card, ListGroup, Spinner, Col, Row } from 'react-bootstrap';
import DropdownEditer from '../../elements/DropdownEditer';

function AddAlbumForm({ mutation, onCancel }) {
    const [name, setName] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(name, {
            onSuccess: () => {
                setName('');
                onCancel();
            }
        });
    };

    return (
        <Card className="mb-3">
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nom de l'album</Form.Label>
                        <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nouveau nom d'album" />
                    </Form.Group>
                    <div className="d-flex gap-2">
                        <Button type="submit" variant="success" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Création...' : 'Créer'}
                        </Button>
                        <Button variant="danger" onClick={onCancel}>Annuler</Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

function AddSongForm({ mutation, assoId, albumId, onCancel }) {
    const [nom, setNom] = useState('');
    const [file, setFile] = useState(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nom', nom);
        formData.append('file', file);
        mutation.mutate({ assoId, albumId, formData }, {
            onSuccess: () => {
                setNom('');
                setFile(null);
                e.target.reset();
                onCancel();
            }
        });
    };

    return (
        <Card className="m-3">
            <Card.Body>
                <Card.Title>Ajouter un son</Card.Title>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nom du son</Form.Label>
                        <Form.Control type="text" value={nom} onChange={(e) => setNom(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Fichier audio</Form.Label>
                        <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} required accept="audio/*" />
                    </Form.Group>
                    <div className="d-flex gap-2">
                        <Button type="submit" variant="success" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Ajout en cours...' : 'Ajouter'}
                        </Button>
                        <Button variant="danger" onClick={onCancel}>Annuler</Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

const Audio = ({ audio, asso_id, isEditing, invalidateQueries, validate }) => {
    const [editingAudio, setEditingAudio] = useState(audio);

    const removeAudioMutation = useMutation({
        mutationFn: async () => {
            if (window.confirm("Êtes-vous sûr de vouloir supprimer ce son ?")) {
                await removeAudio(asso_id, audio.id)
            }
        },
        onSuccess: invalidateQueries
    });
    const updateAudioMutation = useMutation({
        mutationFn: async () => {
            await updateAudio(asso_id, audio.id, editingAudio.nom, editingAudio.position)
        },
        onSuccess: () => {
            invalidateQueries();
        }
    });

    useEffect(() => {
        updateAudioMutation.mutate();
    }, [validate]);

    return <>
        {isEditing ? (
            <Form className="w-100">
                <Row className="align-items-end">
                    <Col>
                        <Form.Group>
                            <Form.Label>Nom</Form.Label>
                            <Form.Control
                                type="text"
                                value={editingAudio.nom}
                                onChange={(e) => setEditingAudio({ ...editingAudio, nom: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Position</Form.Label>
                            <Form.Control
                                type="number"
                                value={editingAudio.position}
                                onChange={(e) => setEditingAudio({ ...editingAudio, position: parseInt(e.target.value) || 0 })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md="auto" className="d-flex gap-2 mt-2 mt-md-0">
                        <Button variant="danger" size="sm" onClick={removeAudioMutation.mutate}>Supprimer</Button>
                    </Col>
                </Row>
            </Form>
        ) : (
            <Row>
                <Col md={3} className="d-flex justify-content-between align-items-center">
                    {audio.nom}
                </Col>
                <Col as="audio" controls src={`${UPLOAD_BASE_URL}/${audio.file_path}`} style={{ width: '100%' }}>
                    Votre navigateur ne supporte pas l'élément audio.
                </Col>
            </Row>
        )}
    </>
}

const Album = ({ id, autorise, asso_id }) => {
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [validate, setValidate] = useState(false);
    const [addSongState, setAddSongState] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);

    const { data: album, isLoading } = useQuery({
        queryKey: ['audioAlbum', id],
        queryFn: () => getAlbum({}, id),
    });

    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['audioAlbum', id] });
    const deleteAlbumMutation = useMutation({
        mutationFn: async () => {
            if (window.confirm("Êtes-vous sûr de vouloir supprimer cet album et tous les sons qu'il contient ?")) {
                await deleteAlbum(asso_id, album.id);
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audioAlbums', asso_id] })
    });
    const updateAlbumMutation = useMutation({
        mutationFn: async () => {
            await updateAlbum(asso_id, album.id, editingAlbum.name, editingAlbum.position);
            setValidate(!validate);
        },
        onSuccess: () => {
            invalidateQueries();
            setIsEditing(false);
        }
    });
    const addAudioMutation = useMutation({
        mutationFn: async ({ assoId, formData }) => await addAudio(assoId, album.id, formData),
        onSuccess: invalidateQueries
    });

    const startEditing = () => {
        setEditingAlbum({ ...album });
        setIsEditing(true);
    };

    if (isLoading) return <Spinner animation="border" size="sm" />;

    return <Card>
        <Card.Header>
            {isEditing ?
                <Form className="w-100">
                    <Row className="align-items-end">
                        <Col>
                            <Form.Group>
                                <Form.Label>Nom</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingAlbum.name}
                                    onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Priorité d&apos;affichage</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editingAlbum.position}
                                    onChange={(e) => setEditingAlbum({ ...editingAlbum, position: parseInt(e.target.value) || 0 })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md="auto" className="d-flex gap-2 mt-2 mt-md-0">
                            <Button variant="primary" onClick={() => setAddSongState(!addSongState)}>Ajouter un son</Button>
                            <Button variant="success" onClick={updateAlbumMutation.mutate}>Valider</Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>Annuler</Button>
                        </Col>
                    </Row>
                </Form>
                :
                <div className="d-flex align-items-center justify-content-between w-100">
                    <span className="h5 mb-0">{album.name}</span>
                    {autorise && (
                        <DropdownEditer list={[
                            { can: true, name: "Modifier", onClick: startEditing },
                            { can: true, name: "Supprimer", onClick: deleteAlbumMutation.mutate }
                        ]} />
                    )}
                </div>
            }
        </Card.Header>
        <Card.Body>
            {addSongState && (
                <AddSongForm
                    mutation={addAudioMutation}
                    assoId={asso_id}
                    albumId={album.id}
                    onCancel={() => setAddSongState(false)}
                />
            )}
            <ListGroup variant="flush">
                {[...album.audios].sort((a, b) => b.position - a.position).map(audio => (
                    <Audio key={audio.id} audio={audio} asso_id={asso_id} autorise={autorise}
                        isEditing={isEditing} invalidateQueries={invalidateQueries}
                        validate={validate}
                    />
                ))}
                {album.audios.length === 0 && !addSongState.show && <p className="text-muted">Cet album est vide.</p>}
            </ListGroup>
        </Card.Body>
    </Card>
}

function AssoAudio({ asso_id }) {
    const queryClient = useQueryClient();
    const [showAddAlbumForm, setShowAddAlbumForm] = useState(false);

    const { data: albums = [], isLoading } = useQuery({
        queryKey: ['audioAlbums', asso_id],
        queryFn: () => getAlbums(asso_id),
    });

    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
    });

    const sortedAlbums = useMemo(() => {
        if (!albums) return [];
        return [...albums].sort((a, b) => b.position - a.position);
    }, [albums]);

    // Mutations
    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['audioAlbums', asso_id] });

    const addAlbumMutation = useMutation({ mutationFn: (name) => addAlbum(asso_id, name), onSuccess: invalidateQueries });

    if (isLoading) {
        return <div className="text-center"><Spinner animation="border" /></div>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Audios</h2>
                {membreData.autorise && (
                    <Button variant="outline-secondary" onClick={() => setShowAddAlbumForm(prev => !prev)}>
                        <img src="/assets/icons/plus.svg" alt="Créer un album" className="theme-icon" />
                    </Button>
                )}
            </div>

            {showAddAlbumForm && <AddAlbumForm mutation={addAlbumMutation} onCancel={() => setShowAddAlbumForm(false)} />}

            <div className="d-flex flex-column gap-3">
                {sortedAlbums.map((album) => (
                    <Album key={album.id} id={album.id} autorise={membreData.autorise} asso_id={asso_id} />
                ))}
            </div>
        </div>
    );
}

export default AssoAudio;