import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlbums, addAlbum, addAudio, removeAudio, updateAlbum, deleteAlbum, updateAudio, getAlbum } from '../../../api/modules/api_audio';
import { estUtilisateurDansAsso } from '../../../api/api_associations';
import { UPLOAD_BASE_URL } from '../../../api/base';
import { Button, Form, Card, ListGroup, Spinner, Col, Row } from 'react-bootstrap';
import DropdownEditer from '../../elements/DropdownEditer';
import ConfirmationModal from '../../elements/ConfirmationModal';

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
                        <Form.Label>Nom de l&apos;album</Form.Label>
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

const Audio = ({ album, audio, asso_id, isEditing, onLocalChange }) => {
    const [localName, setLocalName] = useState(audio.nom);
    const [localPos, setLocalPos] = useState(audio.position);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        onLocalChange(audio.id, { nom: localName, position: localPos });
    }, [localName, localPos, audio.id, onLocalChange]);

    const queryClient = useQueryClient();
    const removeMutation = useMutation({
        mutationFn: () => removeAudio(asso_id, audio.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audioAlbum', album.id] })
    });

    if (!isEditing) {
        return (
            <Row className="py-2 border-bottom">
                <Col md={3}>{audio.nom}</Col>
                <Col><audio controls src={`${UPLOAD_BASE_URL}/${audio.file_path}`} className="w-100" ><track kind="captions" /></audio></Col>
            </Row>
        );
    }

    return (
        <>
            <Form className="w-100 py-2 border-bottom">
                <Row className="align-items-end">
                    <Col>
                        <Form.Control
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            placeholder="Nom du son"
                        />
                    </Col>
                    <Col md={2}>
                        <Form.Control
                            type="number"
                            value={localPos}
                            onChange={(e) => setLocalPos(parseInt(e.target.value) || 0)}
                        />
                    </Col>
                    <Col md="auto">
                        <Button variant="outline-danger" size="sm" onClick={() => setShowConfirm(true)}>✕</Button>
                    </Col>
                </Row>
            </Form>
            <ConfirmationModal
                show={showConfirm}
                onHide={() => setShowConfirm(false)}
                onConfirm={removeMutation.mutate}
                title="Supprimer le son"
                body={`Êtes-vous sûr de vouloir supprimer "${audio.nom}" ?`}
            />
        </>
    );
};

const Album = ({ id, autorise, asso_id }) => {
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [isAddingSong, setIsAddingSong] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [pendingChanges, setPendingChanges] = useState({});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const { data: album, isLoading } = useQuery({
        queryKey: ['audioAlbum', id],
        queryFn: () => getAlbum({}, id),
    });

    const handleAudioChange = useCallback((audioId, data) => {
        setPendingChanges(prev => ({ ...prev, [audioId]: data }));
    }, []);

    const updateAllMutation = useMutation({
        mutationFn: async () => {
            await updateAlbum(asso_id, album.id, editingAlbum.name, editingAlbum.position);
            const audioUpdates = Object.entries(pendingChanges).map(([audioId, data]) =>
                updateAudio(asso_id, audioId, data.nom, data.position)
            );
            return Promise.all(audioUpdates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioAlbum', id] });
            setIsEditing(false);
            setPendingChanges({});
        }
    });
    const deleteAlbumMutation = useMutation({
        mutationFn: () => deleteAlbum(asso_id, album.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audioAlbums', asso_id] })
    });
    const addAudioMutation = useMutation({
        mutationFn: async ({ assoId, formData }) => await addAudio(assoId, album.id, formData),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audioAlbum', id] }),
    });

    const sortedAudios = useMemo(() => {
        if (!album?.audios) return [];
        return [...album.audios].sort((a, b) => b.position - a.position);
    }, [album]);

    if (isLoading) return <Spinner animation="border" size="sm" />;

    return <>
        <Card className="mb-4">
            <Card.Header>
                {isEditing ? (
                    <Row>
                        <Col><Form.Control value={editingAlbum.name} onChange={e => setEditingAlbum({ ...editingAlbum, name: e.target.value })} /></Col>
                        <Col md={2}><Form.Control type="number" value={editingAlbum.position} onChange={e => setEditingAlbum({ ...editingAlbum, position: e.target.value })} /></Col>
                        <Col md="auto" className="d-flex gap-2">
                            <Button variant="success" onClick={() => updateAllMutation.mutate()} disabled={updateAllMutation.isPending}>
                                {updateAllMutation.isPending ? 'Enregistrement...' : 'Valider'}
                            </Button>
                            <Button variant="primary" onClick={() => setIsAddingSong(!isAddingSong)}>Ajouter un son</Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>Annuler</Button>
                        </Col>
                    </Row>
                ) : (
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 mb-0">{album.name}</span>
                        {autorise && (
                            <DropdownEditer list={[
                                { can: true, name: "Modifier", onClick: () => { setEditingAlbum(album); setIsEditing(true); } },
                                { can: true, name: "Supprimer", onClick: () => setShowConfirmDelete(true) }
                            ]} />
                        )}
                    </div>
                )}
            </Card.Header>
            <Card.Body>
                {isAddingSong && (
                    <AddSongForm
                        mutation={addAudioMutation}
                        assoId={asso_id}
                        albumId={album.id}
                        onCancel={() => setIsAddingSong(false)}
                    />
                )}
                <ListGroup variant="flush">
                    {sortedAudios.map(audio => (
                        <Audio key={audio.id} album={album} audio={audio} asso_id={asso_id} isEditing={isEditing}
                            onLocalChange={handleAudioChange}
                        />
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
        <ConfirmationModal
            show={showConfirmDelete}
            onHide={() => setShowConfirmDelete(false)}
            onConfirm={deleteAlbumMutation.mutate}
            title="Supprimer l'album"
            body={`Êtes-vous sûr de vouloir supprimer l'album "${album?.name}" et tous les sons qu'il contient ?`}
        />
    </>
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