import React, { useEffect, useState } from "react";
import { estUtilisateurDansAsso } from "../../../api/api_associations";
import { ajouterContenuPublication, creerNouveauCommentaire, creerNouvellePublication, modifierCommentaire, modifierLikeComment, modifierLikePost, modifierPublication, obtenirPublicationsAsso, supprimerCommentaire, supprimerPublication } from "../../../api/api_publications";
import { useLayout } from "../../../layouts/Layout";
import RichEditor, { RichTextDisplay } from "../../elements/RichEditor";
import { BASE_URL, UPLOAD_BASE_URL } from "../../../api/base";
import { Card, Button, Form, Row, Col, Image, InputGroup, Spinner } from "react-bootstrap";
import Select from 'react-select';
import BoutonEditer from "../../elements/BoutonEditer";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const tagOptions = [
    { value: 'Vendôme', label: 'Vendôme' },
    { value: 'Palum', label: 'Palum' }
];

function AssoPosts({ asso_id }) {
    const queryClient = useQueryClient();
    const { userData } = useLayout();
    const [isGestion, setIsGestion] = useState(false);
    const [isNewPost, setIsNewPost] = useState(false);
    const [listePosts, setListePosts] = useState([]);
    const [newPost, setNewPost] = useState({
        "titre": "",
        "contenu": "",
        "is_commentable": true,
        "a_cacher_to_cycles": [],
        "a_cacher_aux_nouveaux": false,
        "is_publication_interne": false,
        "tags": []
    })
    const [idModifyPost, setIdModifyPost] = useState(null);
    const [modifyPost, setModifyPost] = useState({
        "titre": "",
        "contenu": "",
        "is_commentable": true,
        "a_cacher_to_cycles": [],
        "a_cacher_aux_nouveaux": false,
        "is_publication_interne": false,
        "tags": []
    })
    const [idModifyComment, setIdModifyComment] = useState(null);
    const [modifyComment, setModifyComment] = useState("");
    const [idNewComment, setIdNewComment] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [newPostFile, setNewPostFile] = useState(null);
    const [newPostMiniatureFile, setNewPostMiniatureFile] = useState(null);
    const [modifyPostFile, setModifyPostFile] = useState(null);
    const [modifyPostMiniatureFile, setModifyPostMiniatureFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [modifyPreviewUrl, setModifyPreviewUrl] = useState(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [modifyFileInputKey, setModifyFileInputKey] = useState(Date.now());
    const [shouldRemoveExistingAttachment, setShouldRemoveExistingAttachment] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const clearNewPost = () => {
        setNewPost({
            "titre": "",
            "contenu": "",
            "is_commentable": true,
            "a_cacher_to_cycles": [],
            "a_cacher_aux_nouveaux": false,
            "is_publication_interne": false,
            "tags": []
        });
        setNewPostFile(null);
        setNewPostMiniatureFile(null);
    }

    const clearModifyPost = () => {
        setModifyPost({
            "titre": "",
            "contenu": "",
            "is_commentable": true,
            "a_cacher_to_cycles": [],
            "a_cacher_aux_nouveaux": false,
            "is_publication_interne": false,
            "tags": []
        })
    }

    const formatPublicationDate = (dateString) => {
        const date = new Date(dateString);
        const datePart = date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const timePart = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        return `${datePart} à ${timePart}`;
    }

    const handleSetNewPost = (e) => {
        const { name, value, checked } = e.target;
        setNewPost(prevState => {
            if (['is_commentable', 'is_publication_interne', 'a_cacher_aux_nouveaux'].includes(name)) {
                return {
                    ...prevState,
                    [name]: checked
                };
            }
            if (name === 'a_cacher_to_cycles') {
                const currentCycles = newPost.a_cacher_to_cycles;
                const updatedCycles = checked ? [...currentCycles, value] : currentCycles.filter(cycle => cycle !== value);
                return {
                    ...prevState,
                    [name]: updatedCycles
                };
            }
            return {
                ...prevState,
                [name]: value
            };
        });
    };

    const handleSetNewPostTags = (selectedOptions) => {
        setNewPost(prevState => ({
            ...prevState,
            tags: selectedOptions ? selectedOptions.map(option => option.value) : []
        }));
    };

    const handleSetNewPostContent = (value) => {
        setNewPost(prevState => ({
            ...prevState,
            contenu: value,
        }))
    }

    const handleSetModifyPost = (e) => {
        const { name, value, checked } = e.target;
        setModifyPost(prevState => {
            if (['is_commentable', 'is_publication_interne', 'a_cacher_aux_nouveaux'].includes(name)) {
                return {
                    ...prevState,
                    [name]: checked
                };
            }
            if (name === 'a_cacher_to_cycles') {
                const currentCycles = prevState.a_cacher_to_cycles;
                const updatedCycles = checked ? [...currentCycles, value] : currentCycles.filter(cycle => cycle !== value);
                return {
                    ...prevState,
                    [name]: updatedCycles
                };
            }
            return {
                ...prevState,
                [name]: value
            };
        });
    };

    const handleSetModifyPostTags = (selectedOptions) => {
        setModifyPost(prevState => ({
            ...prevState,
            tags: selectedOptions ? selectedOptions.map(option => option.value) : []
        }));
    };

    const handleSetModifyPostContent = (value) => {
        setModifyPost(prevState => ({
            ...prevState,
            contenu: value,
        }))
    }

    const removePost = async (post_id) => {
        try {
            await supprimerPublication(asso_id, post_id);
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const removeComment = async (post_id) => {
        try {
            await supprimerCommentaire(post_id);
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const validateNewPost = async () => {
        setIsLoading(true);
        try {
            const newPublication = await creerNouvellePublication(asso_id, newPost);
            if (newPostFile || newPostMiniatureFile) {
                try {
                    await ajouterContenuPublication(asso_id, newPublication.id_publication, newPostFile, newPostMiniatureFile);
                } catch (error) {
                    console.error("Erreur lors de l'ajout du fichier:", error);
                }
            }
            clearNewPost();
            setIsNewPost(false);
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
        setIsLoading(false);
    }

    const handleSetIdNewComment = (comment_id) => {
        if (comment_id !== idNewComment) {
            setNewComment("")
            setIdNewComment(comment_id)
        }
    }

    const validateNewComment = async (post_id) => {
        setIsLoading(true);
        try {
            await creerNouveauCommentaire(post_id, newComment)
            setNewComment("");
            setIdNewComment(null)
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
        setIsLoading(false);
    }

    const handleSetIdModifyPost = async (post_id) => {
        if (idModifyPost !== post_id) {
            clearModifyPost();
            setModifyPostFile(null);
            setModifyPostMiniatureFile(null);
            setModifyPreviewUrl(null);
            setModifyFileInputKey(Date.now()); // Reset key
            setShouldRemoveExistingAttachment(false); // Reset deletion flag
            const post = listePosts.find(e => e.id === post_id);
            if (post) {
                const { titre, contenu, is_commentable, fichier_joint, miniature, tags } = post;
                setModifyPost(prevState => ({ ...prevState, titre, contenu, is_commentable, fichier_joint, miniature, tags: tags || [] }));
            }
            setIdModifyPost(post_id);
        }
    }

    const handleSetIdModifyComment = async (comment_id) => {
        if (idModifyComment !== comment_id) {
            const postComments = listePosts.flatMap(post => post.commentaires);
            const comment = postComments.find(c => c.id === comment_id);
            if (comment) {
                setModifyComment(comment.contenu);
            }
            setIdModifyComment(comment_id);
        }
    }

    const validateModifyPost = async () => {
        setIsLoading(true);
        try {
            let updatedModifyPost = { ...modifyPost };

            if (shouldRemoveExistingAttachment) {
                updatedModifyPost.fichier_joint = null;
            }

            await modifierPublication(asso_id, idModifyPost, updatedModifyPost);

            if (modifyPostFile || modifyPostMiniatureFile) {
                try {
                    await ajouterContenuPublication(asso_id, idModifyPost, modifyPostFile, modifyPostMiniatureFile);
                } catch (error) {
                    console.error("Erreur lors de l'ajout du fichier:", error);
                }
            }

            clearModifyPost();
            setIdModifyPost(null);
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
        setIsLoading(false);
    }

    const validateModifyComment = async () => {
        setIsLoading(true);
        try {
            await modifierCommentaire(idModifyComment, { "contenu": modifyComment })
            setModifyComment("")
            setIdModifyComment(null)
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
        setIsLoading(false);
    }

    const handleChangePostLike = async (post_id) => {
        try {
            await modifierLikePost(post_id)
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const handleChangeCommentLike = async (comment_id) => {
        try {
            await modifierLikeComment(comment_id)
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const handleSetIsGestion = (newState) => {
        if (!newState) {
            setIsNewPost(false)
            setIdModifyPost(null)
        }
        setIsGestion(newState)
    }

    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
        enabled: !!asso_id,
    });

    const { data: postsData } = useQuery({
        queryKey: ['publicationData', asso_id],
        queryFn: () => obtenirPublicationsAsso(asso_id),
        enabled: !!asso_id,
    });

    useEffect(() => {
        if (postsData) { setListePosts(postsData.publications) };
    }, [postsData]);

    useEffect(() => {
        let fileForPreview = newPostMiniatureFile || newPostFile;

        if (!fileForPreview) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(fileForPreview);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);

    }, [newPostFile, newPostMiniatureFile]);

    useEffect(() => {
        let fileForPreview = modifyPostMiniatureFile || modifyPostFile;

        if (!fileForPreview) {
            setModifyPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(fileForPreview);
        setModifyPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);

    }, [modifyPostFile, modifyPostMiniatureFile]);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Les publications</h2>
                {membreData.autorise && <BoutonEditer onClick={() => handleSetIsGestion(!isGestion)} />}
            </div>
            {isGestion && !isNewPost && <div className="d-flex gap-2 mb-3">
                <Button variant="success" onClick={() => setIsNewPost(true)}>
                    <img src="/assets/icons/plus.svg" alt="Ajouter une publication" />
                    {" "}Ajouter une publication
                </Button>
            </div>}
            <div className="d-flex flex-column gap-3">

                {/* formulaire pour une nouvelle publication */}
                {isNewPost && <Card>
                    <Card.Body>
                        <Row>
                            <Col md={previewUrl ? "9" : "12"}>
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm="2">Titre</Form.Label>
                                    <Col sm="10">
                                        <Form.Control value={newPost.titre} name='titre' type='text' onChange={handleSetNewPost} />
                                    </Col>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Check type="checkbox" label="Autoriser les commentaires" checked={newPost.is_commentable} name='is_commentable' onChange={handleSetNewPost} />
                                    <Form.Check type="checkbox" label="Publication interne" checked={newPost.is_publication_interne} name='is_publication_interne' onChange={handleSetNewPost} />
                                    <Form.Check type="checkbox" label="Cacher aux 1A" checked={newPost.a_cacher_aux_nouveaux} name='a_cacher_aux_nouveaux' onChange={handleSetNewPost} />
                                </Form.Group>
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label>Cacher aux cycles</Form.Label>
                                    <Col>
                                        {["ic", "ast", "ev", "vs", "isup"].map(cycle => (
                                            <Form.Check inline key={cycle} type="checkbox" name="a_cacher_to_cycles" value={cycle} label={cycle} checked={newPost.a_cacher_to_cycles.includes(cycle)} onChange={handleSetNewPost} />
                                        ))}
                                    </Col>
                                </Form.Group>
                            </Col>
                            {previewUrl &&
                                <Col md="3" className="text-center">
                                    <Image src={previewUrl} fluid alt="La miniature automatique sera générée à l'envoi" />
                                </Col>
                            }
                        </Row>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <RichEditor value={newPost.contenu} onChange={handleSetNewPostContent} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Pièce jointe</Form.Label>
                                        <InputGroup>
                                            <Form.Control key={fileInputKey} type="file" onChange={(e) => setNewPostFile(e.target.files[0])} />
                                            {newPostFile &&
                                                <Button variant="danger" onClick={() => { setNewPostFile(null); setFileInputKey(Date.now()); }}>
                                                    <img src="/assets/icons/delete.svg" alt="Supprimer la pièce jointe" />
                                                </Button>
                                            }
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Miniature</Form.Label>
                                        <Form.Control type="file" onChange={(e) => setNewPostMiniatureFile(e.target.files[0])} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Tags</Form.Label>
                                <Col sm="10">
                                    <Select
                                        isMulti
                                        name="tags"
                                        options={tagOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        value={newPost.tags.map(tag => ({ value: tag, label: tag }))}
                                        onChange={handleSetNewPostTags}
                                        placeholder="Sélectionnez un ou plusieurs tags"
                                    />
                                </Col>
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button variant="success" onClick={validateNewPost} disabled={isLoading}>
                                    {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Ajouter"}
                                </Button>
                                <Button variant="danger" onClick={() => setIsNewPost(false)}>Annuler</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>}

                {listePosts.map((post) =>
                    <Card key={post.id}>
                        <Card.Body className="d-flex flex-column">
                            {/* Les publications existantes */}
                            <div style={{ flex: 1 }}>
                                {idModifyPost !== post.id && <>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Card.Title>{post.titre}</Card.Title>
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="d-flex gap-1">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="badge bg-info">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {post.fichier_joint ? <Row>
                                        <Col md="9">
                                            <RichTextDisplay content={post.contenu} />
                                        </Col>
                                        <Col md="3" className="text-center">
                                            <a href={`${BASE_URL}/${post.fichier_joint}`} target="_blank" rel="noopener noreferrer">
                                                <Image src={`${BASE_URL}/${post.miniature ? post.miniature : post.fichier_joint}`} fluid style={{ cursor: 'pointer' }} />
                                            </a>
                                        </Col>
                                    </Row> : <RichTextDisplay content={post.contenu} />}
                                </>
                                }
                            </div>
                            {idModifyPost !== post.id && <>
                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                    <div className="d-flex gap-2">
                                        {!isGestion && <>
                                            <Button variant="primary" onClick={() => handleChangePostLike(post.id)}>
                                                {post.likes.includes(userData.id) ? <img src="/assets/icons/heart_plain.svg" alt="Je n'aime plus" /> : <img src="/assets/icons/heart.svg" alt="J'aime" />}
                                                {post.likes.length}
                                            </Button>
                                            <Button variant="secondary" onClick={() => handleSetIdNewComment(post.id)}>Commenter</Button>
                                        </>}
                                        {isGestion && <>
                                            <Button variant="primary" onClick={() => handleSetIdModifyPost(post.id)}>Éditer</Button>
                                            <Button variant="danger" onClick={() => removePost(post.id)}>Supprimer</Button>
                                        </>}
                                    </div>
                                    <small className="text-muted">Publié le : {formatPublicationDate(post.date_publication)}</small>
                                </div>

                                {/* Nouveau commentaire */}
                                {idNewComment === post.id && <Card className="mt-3">
                                    <Card.Body>
                                        <Form>
                                            <Form.Group className="mb-3">
                                                <Form.Control as="textarea" rows={3} value={newComment} placeholder="Écrivez votre commentaire ici" onChange={(e) => setNewComment(e.target.value)} />
                                            </Form.Group>
                                            <div className="d-flex gap-2">
                                                <Button variant="success" onClick={() => validateNewComment(post.id)} disabled={isLoading}>
                                                    {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                                                </Button>
                                                <Button variant="danger" onClick={() => handleSetIdNewComment(null)}>Annuler</Button>
                                            </div>
                                        </Form>
                                    </Card.Body>
                                </Card>}

                                {post.commentaires.map((comment) => <Card className="mt-3" key={comment.id}>
                                    <Card.Body>
                                        {comment.id !== idModifyComment && <>
                                            <div className="d-flex align-items-center gap-3">
                                                <Image src={comment.auteur.photo ? `${UPLOAD_BASE_URL}/utilisateurs/${comment.auteur.photo}` : ''} alt={`${comment.auteur.nom_utilisateur}`} roundedCircle width={50} height={50} style={{ objectFit: 'cover' }} />
                                                <p className="mb-0">{comment.contenu}</p>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                <div className="d-flex gap-2">
                                                    <Button variant="primary" size="sm" onClick={() => handleChangeCommentLike(comment.id)}>
                                                        {comment.likes.includes(userData.id) ? <img src="/assets/icons/heart_plain.svg" alt="Je n'aime plus" /> : <img src="/assets/icons/heart.svg" alt="J'aime" />}
                                                        {comment.likes.length}
                                                    </Button>
                                                    {comment.id_auteur === userData.id && <Button variant="secondary" size="sm" onClick={() => handleSetIdModifyComment(comment.id)}>Éditer</Button>}
                                                    {(isGestion || comment.id_auteur === userData.id) && <Button variant="danger" size="sm" onClick={() => removeComment(comment.id)}>Supprimer</Button>}
                                                </div>
                                                <small className="text-muted">Publié le : {formatPublicationDate(comment.date)}</small>
                                            </div>
                                        </>}

                                        {comment.id === idModifyComment && <>
                                            <Form>
                                                <Form.Group className="mb-3">
                                                    <Form.Control as="textarea" rows={3} value={modifyComment} placeholder="Écrivez votre commentaire ici" onChange={(e) => setModifyComment(e.target.value)} />
                                                </Form.Group>
                                                <div className="d-flex gap-2">
                                                    <Button variant="success" onClick={() => validateModifyComment()} disabled={isLoading}>
                                                        {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                                                    </Button>
                                                    <Button variant="danger" onClick={() => handleSetIdModifyComment(null)}>Annuler</Button>
                                                </div>
                                            </Form>
                                        </>}
                                    </Card.Body>
                                </Card>)}
                            </>}

                            {/* Publication en cours d'édition */}
                            {idModifyPost === post.id &&
                                <Form>
                                    <Row>
                                        <Col md={(modifyPreviewUrl || (post.fichier_joint && !shouldRemoveExistingAttachment)) ? "9" : "12"}>
                                            <Form.Group as={Row} className="mb-3">
                                                <Form.Label column sm="2">Titre</Form.Label>
                                                <Col sm="10">
                                                    <Form.Control value={modifyPost.titre} name='titre' type='text' onChange={handleSetModifyPost} />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Check type="checkbox" label="Autoriser les commentaires" checked={modifyPost.is_commentable} name='is_commentable' onChange={handleSetModifyPost} />
                                                <Form.Check type="checkbox" label="Publication interne" checked={modifyPost.is_publication_interne} name='is_publication_interne' onChange={handleSetModifyPost} />
                                                <Form.Check type="checkbox" label="Cacher aux 1A" checked={modifyPost.a_cacher_aux_nouveaux} name='a_cacher_aux_nouveaux' onChange={handleSetModifyPost} />
                                            </Form.Group>
                                            <Form.Group as={Row} className="mb-3">
                                                <Form.Label>Cacher aux cycles</Form.Label>
                                                <Col>
                                                    {["ic", "ast", "ev", "vs", "isup"].map(cycle => (
                                                        <Form.Check inline key={cycle} type="checkbox" name="a_cacher_to_cycles" value={cycle} label={cycle} checked={modifyPost.a_cacher_to_cycles.includes(cycle)} onChange={handleSetModifyPost} />
                                                    ))}
                                                </Col>
                                            </Form.Group>
                                        </Col>
                                        {(modifyPreviewUrl || (post.fichier_joint && !shouldRemoveExistingAttachment)) &&
                                            <Col md="3" className="text-center">
                                                {modifyPreviewUrl ?
                                                    <Image src={modifyPreviewUrl} fluid alt="La miniature automatique sera générée à l'envoi" /> :
                                                    (post.fichier_joint && !shouldRemoveExistingAttachment &&
                                                        <a href={`${BASE_URL}/${post.fichier_joint}`} target="_blank" rel="noopener noreferrer">
                                                            <Image src={`${BASE_URL}/${post.miniature ? post.miniature : post.fichier_joint}`} fluid style={{ cursor: 'pointer' }} />
                                                        </a>)
                                                }
                                            </Col>}
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <RichEditor value={modifyPost.contenu} onChange={handleSetModifyPostContent} />
                                    </Form.Group>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Pièce jointe</Form.Label>
                                                {post.fichier_joint && !shouldRemoveExistingAttachment ? (
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="text-nowrap text-truncate" style={{ maxWidth: 'calc(100% - 50px)' }}>{post.fichier_joint.split('/').pop()}</span>
                                                        <Button variant="danger" size="sm" onClick={() => setShouldRemoveExistingAttachment(true)}>
                                                            <img src="/assets/icons/delete.svg" alt="Supprimer le fichier existant" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <InputGroup>
                                                        <Form.Control
                                                            key={modifyFileInputKey}
                                                            type="file"
                                                            onChange={(e) => {
                                                                setModifyPostFile(e.target.files[0]);
                                                            }}
                                                        />
                                                        {modifyPostFile && (
                                                            <Button variant="danger" onClick={() => { setModifyPostFile(null); setModifyFileInputKey(Date.now()); }}>
                                                                <img src="/assets/icons/delete.svg" alt="Annuler la sélection du nouveau fichier" />
                                                            </Button>
                                                        )}
                                                    </InputGroup>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Miniature</Form.Label>
                                                <Form.Control type="file" onChange={(e) => setModifyPostMiniatureFile(e.target.files[0])} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group as={Row} className="mb-3">
                                        <Form.Label column sm="2">Tags</Form.Label>
                                        <Col sm="10">
                                            <Select
                                                isMulti
                                                name="tags"
                                                options={tagOptions}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                                value={modifyPost.tags.map(tag => ({ value: tag, label: tag }))}
                                                onChange={handleSetModifyPostTags}
                                                placeholder="Sélectionnez un ou plusieurs tags"
                                            />
                                        </Col>
                                    </Form.Group>
                                    <div className="d-flex gap-2">
                                        <Button variant="success" onClick={validateModifyPost} disabled={isLoading}>
                                            {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                                        </Button>
                                        <Button variant="danger" onClick={() => setIdModifyPost(null)}>Annuler</Button>
                                    </div>
                                </Form>}
                        </Card.Body>
                    </Card>
                )}
            </div>
        </>
    )
}

export default AssoPosts;