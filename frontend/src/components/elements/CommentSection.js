import { Card, Form, Button, Spinner } from "react-bootstrap";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { creerNouveauCommentaire, modifierCommentaire, supprimerCommentaire, modifierLikeComment } from "../../api/api_publications";
import { obtenirAssosUtilisateur } from "../../api/api_utilisateurs";
import Comment from "./Comment";

export default function CommentSection({ post, userData, isGestion, showNewCommentForm, setShowNewCommentForm }) {
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
