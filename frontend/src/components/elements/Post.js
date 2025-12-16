import { Card, Col, Row, Image, Button, Form, Spinner, InputGroup } from "react-bootstrap";
import Select from 'react-select';
import { UPLOAD_BASE_URL } from "../../api/base";
import { useLayout } from "../../layouts/Layout";
import RichEditor, { RichTextDisplay } from "./RichEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ajouterContenuPublication, modifierPublication, obtenirPublication, supprimerCommentaire, modifierCommentaire, modifierLikeComment, modifierLikePost, creerNouveauCommentaire } from "../../api/api_publications";
import { useEffect, useState } from "react";

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


export default function Post({ postId, isGestion, removePost, tagOptions }) {
    const [modifyPost, setModifyPost] = useState({
        "titre": "",
        "contenu": "",
        "is_commentable": true,
        "a_cacher_to_cycles": [],
        "a_cacher_aux_nouveaux": false,
        "is_publication_interne": false,
        "tags": []
    })
    const [isModifying, setIsModifying] = useState(false);

    const [post, setPost] = useState(null);
    const [idModifyComment, setIdModifyComment] = useState(null);
    const [modifyComment, setModifyComment] = useState("");

    const [idNewComment, setIdNewComment] = useState(null);
    const [newComment, setNewComment] = useState("");

    const [modifyPreviewUrl, setModifyPreviewUrl] = useState(null);
    const [modifyPostFile, setModifyPostFile] = useState(null);
    const [modifyPostMiniatureFile, setModifyPostMiniatureFile] = useState(null);
    const [modifyFileInputKey, setModifyFileInputKey] = useState(Date.now());
    const [shouldRemoveExistingAttachment, setShouldRemoveExistingAttachment] = useState(false);

    const { userData } = useLayout();
    const queryClient = useQueryClient();
    const { data: postData, isLoading } = useQuery({
        queryKey: ['publications', postId],
        queryFn: () => obtenirPublication(postId),
        enabled: !!postId,
    });

    useEffect(() => {
        if (postData) { setPost(postData) };
    }, [postData]);


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

    if (isLoading || !post) return <div>Loading ...</div>

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

    const validateModifyPost = async () => {
        try {
            let updatedModifyPost = { ...modifyPost };

            if (shouldRemoveExistingAttachment) {
                updatedModifyPost.fichier_joint = null;
            }

            await modifierPublication(post.association.id, postId, updatedModifyPost);

            if (modifyPostFile || modifyPostMiniatureFile) {
                try {
                    await ajouterContenuPublication(post.association.id, postId, modifyPostFile, modifyPostMiniatureFile);
                } catch (error) {
                    console.error("Erreur lors de l'ajout du fichier:", error);
                }
            }

            clearModifyPost();
            queryClient.invalidateQueries(['publicationData', post.association.id])
            setIsModifying(false);
        } catch (erreur) {
            console.error(erreur);
            setIsModifying(true);
        }
    }


    const removeComment = async (comm_id) => {
        try {
            supprimerCommentaire(comm_id);
            queryClient.invalidateQueries(['publicationData', post.association.id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const validateModifyComment = async () => {
        try {
            modifierCommentaire(idModifyComment, { "contenu": modifyComment })
            setModifyComment("")
            setIdModifyComment(null)
            queryClient.invalidateQueries(['publicationData', post.association.id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const handleSetIdModifyComment = async (comment_id) => {
        if (idModifyComment !== comment_id) {
            const comment = post.commentaires.find(c => c.id === comment_id);
            if (comment) {
                setModifyComment(comment.contenu);
            }
            setIdModifyComment(comment_id);
        }
    }


    const handleSetIdNewComment = (comment_id) => {
        if (comment_id !== idNewComment) {
            setNewComment("");
            setIdNewComment(comment_id);
        }
    }

    const validateNewComment = async () => {
        try {
            await creerNouveauCommentaire(postId, newComment)
            setNewComment("");
            setIdNewComment(null)
            queryClient.invalidateQueries(['publicationData', post.association.id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const handleChangePostLike = async (postId) => {
        try {
            modifierLikePost(postId)
            queryClient.invalidateQueries(['publicationData', post.association.id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const handleChangeCommentLike = async (comment_id) => {
        try {
            modifierLikeComment(comment_id)
            queryClient.invalidateQueries(['publicationData', post.association.id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const startModifying = () => {
        if (!isModifying) {
            setIsModifying(true);
            clearModifyPost();
            setModifyPostFile(null);
            setModifyPostMiniatureFile(null);
            setModifyPreviewUrl(null);
            setModifyFileInputKey(Date.now()); // Reset key
            setShouldRemoveExistingAttachment(false); // Reset deletion flag
            const { titre, contenu, is_commentable, fichier_joint, miniature, tags } = post;
            setModifyPost(prevState => ({ ...prevState, titre, contenu, is_commentable, fichier_joint, miniature, tags: tags || [] }));
        }
    }


    return <Card>
        <Card.Body className="d-flex flex-column">
            {/* Les publications existantes */}
            {isModifying && isGestion ?
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
                        {(modifyPreviewUrl || (post.fichier_joint && !shouldRemoveExistingAttachment && post.association)) &&
                            <Col md="3" className="text-center">
                                {modifyPreviewUrl ?
                                    <Image src={modifyPreviewUrl} fluid alt="La miniature automatique sera générée à l'envoi" /> :
                                    (post.fichier_joint && !shouldRemoveExistingAttachment && post.association &&
                                        <a href={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/${post.fichier_joint}`} target="_blank" rel="noopener noreferrer">
                                            <Image src={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/${post.miniature ? post.miniature : post.fichier_joint}`} fluid style={{ cursor: 'pointer' }} />
                                        </a>)
                                }
                            </Col>}
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <RichEditor value={modifyPost.contenu}
                            onChange={(value) => setModifyPost(prevState => ({
                                ...prevState,
                                contenu: value,
                            }))} />
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
                                onChange={(selectedOptions) => setModifyPost(prevState => ({
                                    ...prevState,
                                    tags: selectedOptions ? selectedOptions.map(option => option.value) : []
                                }))}
                                placeholder="Sélectionnez un ou plusieurs tags"
                            />
                        </Col>
                    </Form.Group>
                    <div className="d-flex gap-2">
                        <Button variant="success" onClick={validateModifyPost} disabled={isLoading}>
                            {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                        </Button>
                        <Button variant="danger" onClick={() => setIsModifying(false)}>Annuler</Button>
                    </div>
                </Form>
                :
                <>
                    <div style={{ flex: 1 }}>
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
                        {post.fichier_joint && post.association ? <Row>
                            <Col md="9">
                                <RichTextDisplay content={post.contenu} />
                            </Col>
                            <Col md="3" className="text-center">
                                <a href={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/${post.fichier_joint}`} target="_blank" rel="noopener noreferrer">
                                    <Image src={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/${post.miniature ? post.miniature : post.fichier_joint}`} fluid style={{ cursor: 'pointer' }} />
                                </a>
                            </Col>
                        </Row> : <RichTextDisplay content={post.contenu} />}
                    </div>
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
                                <Button variant="primary" onClick={startModifying}>Éditer</Button>
                                <Button variant="danger" onClick={removePost}>Supprimer</Button>
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
        </Card.Body>
    </Card>
}