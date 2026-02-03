import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlbums, addAlbum, addAudio, removeAudio, updateAlbum, deleteAlbum, updateAudio } from '../../../api/modules/api_audio';
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

function AssoAudio({ asso_id }) {
    const queryClient = useQueryClient();
    const [showAddAlbumForm, setShowAddAlbumForm] = useState(false);
    const [addSongState, setAddSongState] = useState({ show: false, albumId: null });
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [editingAudio, setEditingAudio] = useState(null);

    const { data: albums = [], isLoading } = useQuery({
        queryKey: ['audioAlbums', asso_id],
        queryFn: () => getAlbums(asso_id),
    });

    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
    });
    
    // Mutations
    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['audioAlbums', asso_id] });

    const addAlbumMutation = useMutation({ mutationFn: (name) => addAlbum(asso_id, name), onSuccess: invalidateQueries });
    const addAudioMutation = useMutation({ mutationFn: ({ assoId, albumId, formData }) => addAudio(assoId, albumId, formData), onSuccess: invalidateQueries });
    const removeAudioMutation = useMutation({ mutationFn: ({ audioId }) => removeAudio(asso_id, audioId), onSuccess: invalidateQueries });
    const updateAlbumMutation = useMutation({ mutationFn: ({ albumId, name, position }) => updateAlbum(asso_id, albumId, name, position), onSuccess: invalidateQueries });
    const deleteAlbumMutation = useMutation({ mutationFn: (albumId) => deleteAlbum(asso_id, albumId), onSuccess: invalidateQueries });
    const updateAudioMutation = useMutation({ mutationFn: ({ audioId, nom, position }) => updateAudio(asso_id, audioId, nom, position), onSuccess: invalidateQueries });

    const sortedAlbums = useMemo(() => {
        if (!albums) return [];
        return [...albums].sort((a, b) => b.position - a.position);
    }, [albums]);

    const handleRemoveAudio = (audioId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce son ?")) {
            removeAudioMutation.mutate({ audioId });
        }
    };
    
    const handleEditAlbum = (album) => {
        setEditingAlbum({ ...album });
    };

    const handleCancelEdit = () => {
        setEditingAlbum(null);
    };

    const handleSaveAlbum = () => {
        if (editingAlbum) {
            updateAlbumMutation.mutate({
                albumId: editingAlbum.id,
                name: editingAlbum.name,
                position: editingAlbum.position
            }, {
                onSuccess: () => setEditingAlbum(null)
            });
        }
    };
    
    const handleDeleteAlbum = (albumId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet album et tous les sons qu'il contient ?")) {
            deleteAlbumMutation.mutate(albumId);
        }
    };

    const handleEditAudio = (audio) => {
        setEditingAudio({ ...audio });
    };

    const handleCancelEditAudio = () => {
        setEditingAudio(null);
    };

    const handleSaveAudio = () => {
        if (editingAudio) {
            updateAudioMutation.mutate({
                audioId: editingAudio.id,
                nom: editingAudio.nom,
                position: editingAudio.position
            }, {
                onSuccess: () => setEditingAudio(null)
            });
        }
    };

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
                    <Card key={album.id}>
                        <Card.Header>
                            {editingAlbum && editingAlbum.id === album.id ? (
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
                                            <Button variant="success" onClick={handleSaveAlbum}>Valider</Button>
                                            <Button variant="secondary" onClick={handleCancelEdit}>Annuler</Button>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <span className="h5 mb-0">{album.name}</span>
                                    {membreData.autorise && (
                                        <DropdownEditer list={[
                                            { can: true, name: "Ajouter un son", onClick: () => setAddSongState({ show: !addSongState.show, albumId: album.id }) },
                                            { can: true, name: "Modifier", onClick: () => handleEditAlbum(album) },
                                            { can: true, name: "Supprimer", onClick: () => handleDeleteAlbum(album.id) }
                                        ]} />
                                    )}
                                </div>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {addSongState.show && addSongState.albumId === album.id && (
                                <AddSongForm 
                                    mutation={addAudioMutation}
                                    assoId={asso_id}
                                    albumId={album.id}
                                    onCancel={() => setAddSongState({ show: false, albumId: null })}
                                />
                            )}
                            <ListGroup variant="flush">
                                {[...album.audios].sort((a,b) => b.position - a.position).map(audio => (
                                    <ListGroup.Item key={audio.id}>
                                        {editingAudio && editingAudio.id === audio.id ? (
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
                                                        <Button variant="success" size="sm" onClick={handleSaveAudio}>Valider</Button>
                                                        <Button variant="secondary" size="sm" onClick={handleCancelEditAudio}>Annuler</Button>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        ) : (
                                            <>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5>{audio.nom} {editingAlbum && editingAlbum.id === album.id && 
                                                    <span className='small'>(Priorité: {audio.position})</span>}</h5>
                                                    {membreData.autorise && editingAlbum && editingAlbum.id === album.id && (
                                                        <DropdownEditer list={[
                                                            { can: true, name: "Modifier", onClick: () => handleEditAudio(audio) },
                                                            { can: true, name: "Supprimer", onClick: () => handleRemoveAudio(audio.id) }
                                                        ]} />
                                                    )}
                                                </div>
                                                <audio controls src={`${UPLOAD_BASE_URL}/${audio.file_path}`} style={{ width: '100%' }}>
                                                    Votre navigateur ne supporte pas l'élément audio.
                                                </audio>
                                            </>
                                        )}
                                    </ListGroup.Item>
                                ))}
                                {album.audios.length === 0 && !(addSongState.show && addSongState.albumId === album.id) && <p className="text-muted">Cet album est vide.</p>}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default AssoAudio;