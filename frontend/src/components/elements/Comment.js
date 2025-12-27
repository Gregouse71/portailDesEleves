import { Card, Image, Button, Form, Spinner } from "react-bootstrap";
import { useState } from "react";
import { UPLOAD_BASE_URL } from "../../api/base";
import { Link } from "react-router-dom";
import DropdownEditer from "./DropdownEditer";

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

export default function Comment({ comment, userData, isMembreAsso, handleLike, handleDelete, onSaveEdit }) {
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
        <Card className="mt-3">
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
                    <>
                        <div className="d-flex align-items-center gap-3 w-100">
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                                <Link to={`/utilisateur/${comment.auteur.id}`} style={{ textDecoration: "None" }}>
                                    <Image
                                        src={comment.auteur.photo ? `${UPLOAD_BASE_URL}/utilisateurs/${comment.auteur.photo}` : ''}
                                        alt={`${comment.auteur.nom_utilisateur}`}
                                        roundedCircle width={50} height={50} style={{ objectFit: 'cover' }}
                                    />
                                </Link>
                                <p className="mb-0 text-break">{comment.contenu}</p>
                            </div>
                            {comment.id_auteur === userData.id &&
                                <DropdownEditer as="div" className="ms-auto flex-shrink-0"
                                    canModify={comment.id_auteur === userData.id} modify={handleEdit}
                                    canRemove={canDelete} remove={() => handleDelete(comment.id)}
                                />
                            }
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="d-flex gap-2">
                                <Button variant="primary" size="sm" onClick={() => handleLike(comment.id)}>
                                    {comment.likes.includes(userData.id) ? <img src="/assets/icons/heart_plain.svg" alt="Je n'aime plus" /> : <img src="/assets/icons/heart.svg" alt="J'aime" />}
                                    {comment.likes.length}
                                </Button>
                            </div>
                            <small className="text-muted">Publié le : {formatPublicationDate(comment.date)}</small>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}
