import { Card, Col, Row, Image, Button, Form, Spinner, InputGroup } from "react-bootstrap";
import Select from 'react-select';
import { UPLOAD_BASE_URL } from "../../api/base";
import { useProtected } from "../../Protected";
import RichTextDisplay from "./RichTextDisplay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ajouterContenuPublication, modifierPublication, obtenirPublication, modifierLikePost, creerNouveauCommentaire, modifierCommentaire, supprimerCommentaire, modifierLikeComment } from "../../api/api_publications";
import { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { chargerAsso } from "../../api/api_associations";
import DropdownEditer from "./DropdownEditer";
import '../../assets/styles/post.scss';
import { obtenirAssosUtilisateur } from "../../api/api_utilisateurs";

const RichEditor = lazy(() => import("./RichEditor"));

import Heart from "../../assets/icons/heart.svg?react";
import HeartPlain from "../../assets/icons/heart_plain.svg?react";

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

function Comment({ comment, userData, isMembreAsso, handleLike, handleDelete, onSaveEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.contenu);
    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
        setEditContent(comment.contenu);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveEdit(comment.id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du commentaire:", error);
        }
        setIsSaving(false);
    };

    const canDelete = userData.is_superuser || isMembreAsso || comment.id_auteur === userData.id;

    return (
        <Card className="mt-1 comment-content-container">
            <Card.Body>
                {isEditing ? (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Control as="textarea" rows={3} value={editContent} placeholder="Écrivez votre commentaire ici" onChange={(e) => setEditContent(e.target.value)} />
                        </Form.Group>
                        <div className="d-flex gap-2">
                            <Button variant="success" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                            </Button>
                            <Button variant="danger" onClick={handleCancelEdit}>Annuler</Button>
                        </div>
                    </Form>
                ) : (
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3 w-100 justify-content-between">
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                            <Link to={`/utilisateur/${comment.auteur.id}`} style={{ textDecoration: "None" }}>
                                <Image
                                    src={comment.auteur.photo ? `${UPLOAD_BASE_URL}/${comment.auteur.photo}` : ''}
                                    alt={`${comment.auteur.nom_utilisateur}`}
                                    roundedCircle width={50} height={50} style={{ objectFit: 'cover' }}
                                />
                            </Link>
                            <p className="mb-0 text-break" align={"left"}>{comment.contenu}</p>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            <Button variant="outline-primary" size="sm" onClick={() => handleLike(comment.id)} className="d-flex align-items-center gap-1 p-1 px-2">
                                {comment.likes.includes(userData.id) ? <HeartPlain className="color-icon" alt="Je n'aime plus" /> : <Heart stroke="red" alt="J'aime" />}
                                <span>{comment.likes.length}</span>
                            </Button>
                            <small className="text-muted text-nowrap">{formatPublicationDate(comment.date)}</small>
                            {canDelete &&
                                <DropdownEditer list={[
                                    { can: comment.id_auteur === userData.id, onClick: handleEdit, name: "Modifier" },
                                    "divider",
                                    { can: canDelete, onClick: () => handleDelete(comment.id), name: "Supprimer" },
                                ]}
                                />
                            }
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}


function CommentSection({ post, userData, showNewCommentForm, setShowNewCommentForm }) {
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const { data: userAssos } = useQuery({
        queryKey: ['userAssos', userData.id],
        queryFn: () => obtenirAssosUtilisateur(userData.id),
        staleTime: Infinity,
        enabled: !!userData.id
    });

    const isMembreAsso = userAssos?.actuel?.some(asso => asso.asso_id === post.association.id);

    const invalidatePostQuery = () => {
        queryClient.invalidateQueries(['publications', post.id]);
        queryClient.invalidateQueries(['publicationData', post.association.id]);
    };

    const handleAddNewComment = async () => {
        setIsLoading(true);
        try {
            await creerNouveauCommentaire(post.id, newComment);
            setNewComment("");
            setShowNewCommentForm(false);
            invalidatePostQuery();
        } catch (error) {
            console.error("Erreur lors de l'ajout du commentaire:", error);
        }
        setIsLoading(false);
    };

    const handleLikeComment = async (commentId) => {
        try {
            await modifierLikeComment(commentId);
            invalidatePostQuery();
        } catch (error) {
            console.error("Erreur lors du like du commentaire:", error);
        }
    };

    const handleSaveEdit = async (commentId, content) => {
        try {
            await modifierCommentaire(commentId, { contenu: content });
            invalidatePostQuery();
        } catch (error) {
            console.error("Erreur lors de la modification du commentaire:", error);
            throw error;
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await supprimerCommentaire(commentId);
            invalidatePostQuery();
        } catch (error) {
            console.error("Erreur lors de la suppression du commentaire:", error);
        }
    };

    return (
        <>
            {showNewCommentForm && (
                <Card className="mt-3">
                    <Card.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={newComment}
                                    placeholder="Écrivez votre commentaire ici"
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button variant="success" onClick={handleAddNewComment} disabled={isLoading}>
                                    {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                                </Button>
                                <Button variant="danger" onClick={() => setShowNewCommentForm(false)}>Annuler</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {post.commentaires.map((comment) => (
                <Comment
                    key={comment.id}
                    comment={comment}
                    userData={userData}
                    isMembreAsso={isMembreAsso}
                    handleLike={handleLikeComment}
                    handleDelete={handleDeleteComment}
                    onSaveEdit={handleSaveEdit}
                />
            ))}
        </>
    );
}


export default function Post({ postId, removePost, tagOptions, autorisé }) {
    const [modifyPost, setModifyPost] = useState({
        "titre": "",
        "contenu": "",
        "is_commentable": true,
        "a_cacher_to_cycles": [],
        "a_cacher_aux_nouveaux": false,
        "is_publication_interne": false,
        "tags": [],
        "publier_maintenant": true,
        "date_publication": ""
    })
    const [isModifying, setIsModifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewCommentForm, setShowNewCommentForm] = useState(false);

    const [post, setPost] = useState(null);

    const [modifyPreviewUrl, setModifyPreviewUrl] = useState(null);
    const [modifyPostFile, setModifyPostFile] = useState(null);
    const [modifyPostMiniatureFile, setModifyPostMiniatureFile] = useState(null);
    const [modifyFileInputKey, setModifyFileInputKey] = useState(Date.now());
    const [shouldRemoveExistingAttachment, setShouldRemoveExistingAttachment] = useState(false);

    const { userData } = useProtected();
    const queryClient = useQueryClient();
    const { data: postData, isLoading, isError } = useQuery({
        queryKey: ['publications', postId],
        queryFn: () => obtenirPublication(postId),
        enabled: !!postId,
    });

    useEffect(() => {
        if (postData) { setPost(postData) }
    }, [postData]);

    const clearModifyPost = () => {
        setModifyPost({
            "titre": "",
            "contenu": "",
            "is_commentable": true,
            "a_cacher_to_cycles": [],
            "a_cacher_aux_nouveaux": false,
            "is_publication_interne": false,
            "tags": [],
            "publier_maintenant": true,
            "date_publication": ""
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

    if (isError) return <></>
    if (isLoading || !post) return <div>Loading ...</div>

    const handleSetModifyPost = (e) => {
        const { name, value, checked } = e.target;
        setModifyPost(prevState => {
            if (['is_commentable', 'is_publication_interne', 'a_cacher_aux_nouveaux', 'publier_maintenant'].includes(name)) {
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
        setIsSubmitting(true);
        try {
            let updatedModifyPost = { ...modifyPost };

            if (updatedModifyPost.publier_maintenant) {
                updatedModifyPost.date_publication = null;
            } else if (updatedModifyPost.date_publication) {
                updatedModifyPost.date_publication = new Date(updatedModifyPost.date_publication).toISOString();
            }
            delete updatedModifyPost.publier_maintenant;

            // Only trigger deletion if the user wants to remove the file and NOT replace it.
            // If replacing, the add_content endpoint will handle overwriting.
            if (shouldRemoveExistingAttachment && !modifyPostFile) {
                updatedModifyPost.fichier_joint = "";
                updatedModifyPost.miniature = "";
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
        } finally {
            setIsSubmitting(false);
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

    const startModifying = () => {
        if (!isModifying) {
            setIsModifying(true);
            clearModifyPost();
            setModifyPostFile(null);
            setModifyPostMiniatureFile(null);
            setModifyPreviewUrl(null);
            setModifyFileInputKey(Date.now()); // Reset key
            setShouldRemoveExistingAttachment(false); // Reset deletion flag
            const { titre, contenu, is_commentable, is_publication_interne, a_cacher_aux_nouveaux, a_cacher_to_cycles, fichier_joint, miniature, tags, date_publication } = post;

            setModifyPost({
                titre,
                contenu,
                is_commentable,
                is_publication_interne,
                a_cacher_aux_nouveaux,
                a_cacher_to_cycles: a_cacher_to_cycles || [],
                fichier_joint,
                miniature,
                tags: tags || [],
                publier_maintenant: false,
                date_publication: date_publication ? new Date(new Date(date_publication).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""
            });
        }
    };

    const GetAssoInfo = () => {
        const { data: asso, isLoading: isLoadingAsso } = useQuery({
            queryKey: ['asso', post.association.id],
            queryFn: () => chargerAsso(post.association.id),
            enabled: !!post.association.id
        });

        if (isLoadingAsso) {
            return <Spinner animation="border" size="sm" />;
        }

        return (<Link to={`/assos/get/${post.association.id}`}>
            <Image src={`${UPLOAD_BASE_URL}/${asso.img}`} alt={`logo de ${asso.nom}`} className="me-2 object-fit-cover" style={{ width: '50px', height: '50px' }} />
        </Link>);
    };


    return <Card className="post-container mb-2"><Card.Body className="d-flex flex-column">
        <div className="d-flex flex-column">
            {isModifying ?
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
                                <Form.Check type="checkbox" label="Cacher aux nouveaux" checked={modifyPost.a_cacher_aux_nouveaux} name='a_cacher_aux_nouveaux' onChange={handleSetModifyPost} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Check type="checkbox" label="Publier maintenant" checked={modifyPost.publier_maintenant} name='publier_maintenant' onChange={handleSetModifyPost} />
                                {!modifyPost.publier_maintenant && (
                                    <Form.Group as={Row} className="mt-2">
                                        <Form.Label column sm="3">Date de publication</Form.Label>
                                        <Col sm="9">
                                            <Form.Control
                                                type="datetime-local"
                                                name="date_publication"
                                                value={modifyPost.date_publication}
                                                onChange={handleSetModifyPost}
                                            />
                                        </Col>
                                    </Form.Group>
                                )}
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
                                        <a href={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/publications/${post.fichier_joint}`} target="_blank" rel="noopener noreferrer">
                                            <Image src={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/thumbnails/${post.miniature ? post.miniature : post.fichier_joint}`} fluid style={{ cursor: 'pointer' }} />
                                        </a>)}
                            </Col>}
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Suspense fallback={<div className="d-flex justify-content-center p-3"><Spinner animation="border" size="sm" /></div>}>
                            <RichEditor value={modifyPost.contenu}
                                onChange={(value) => setModifyPost(prevState => ({
                                    ...prevState,
                                    contenu: value,
                                }))} />
                        </Suspense>
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
                                classNamePrefix="react-select"
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
                        <Button variant="success" onClick={validateModifyPost} disabled={isSubmitting}>
                            {isSubmitting ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Valider"}
                        </Button>
                        <Button variant="danger" onClick={() => setIsModifying(false)}>Annuler</Button>
                    </div>
                </Form>
                :
                <>
                    <div className="d-flex flex-column"><div style={{ flex: 1 }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <Card.Title className="mb-0 d-flex align-items-center">
                                <GetAssoInfo />
                                <Link to={`/assos/get/${post.association.id}/posts`} className="interactive-link">
                                    {post.titre}
                                </Link>
                            </Card.Title>
                            <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                                {post.tags && post.tags.length > 0 && (
                                    <div className="d-flex gap-1">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="badge post-tag-badge">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                {autorisé && <DropdownEditer list={[
                                    { can: true, onClick: startModifying, name: "Modifier" },
                                    "divider",
                                    { can: true, onClick: removePost, name: "Supprimer" },
                                ]}
                                />}
                            </div>
                        </div>
                        <div className="post content-container">
                            {post.fichier_joint && post.association ? <Row>
                                <Col md="9">
                                    <RichTextDisplay content={post.contenu} />
                                </Col>
                                <Col md="3" className="text-center">
                                    <a href={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/publications/${post.fichier_joint}`} target="_blank" rel="noopener noreferrer">
                                        <Image src={`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/thumbnails/${post.miniature ? post.miniature : post.fichier_joint}`} fluid style={{ cursor: 'pointer' }} />
                                    </a>
                                </Col>
                            </Row> : <RichTextDisplay content={post.contenu} />}
                        </div>
                    </div></div>
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mt-auto gap-2">
                        <div className="d-flex gap-2 mt-2">
                            {!isModifying && <>
                                <Button variant="outline-primary" size="sm" onClick={() => handleChangePostLike(post.id)} className="d-flex align-items-center gap-1">
                                    {post.likes.includes(userData.id) ? <HeartPlain alt="Je n'aime plus" /> : <Heart alt="J'aime" />}
                                    <span>{post.likes.length}</span>
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setShowNewCommentForm(prev => !prev)}>Commenter</Button>
                            </>}
                        </div>
                        <small className="text-muted">{new Date(post.date_publication) > new Date() ? "Sera publié le : " : "Publié le : "}{formatPublicationDate(post.date_publication)}</small>
                    </div>
                    <div className="comments content-container">
                        {post.is_commentable && <CommentSection post={post} userData={userData} isGestion={isModifying} showNewCommentForm={showNewCommentForm} setShowNewCommentForm={setShowNewCommentForm} />}
                    </div>
                </>}
        </div>
    </Card.Body></Card>
}