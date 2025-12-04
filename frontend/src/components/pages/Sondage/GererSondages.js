import { useEffect } from "react";
import { useLayout } from '../../../layouts/Layout';
import { obtenirSondagesEnAttente, validerSondage, supprimerSondage, sondageSuivant } from '../../../api/api_sondages';
import { useNavigate } from "react-router-dom";
import { Container, Table, Button, Spinner, Card, ListGroup } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function GererSondages() {
    const queryClient = useQueryClient();
    const { userData } = useLayout();
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        if (!dateString || dateString.length !== 12) {
            return "Invalid date";
        }
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const hour = dateString.substring(8, 10);
        const minute = dateString.substring(10, 12);

        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options);
    }

    const suivantEtReload = async () => {
        await sondageSuivant();
        queryClient.invalidateQueries({ queryKey: ['sondage_du_jour'] });
        queryClient.invalidateQueries({ queryKey: ['donneesUtilisateur', userData.id] });
    }

    const { data: sondagesEnAttente = [], isLoading } = useQuery({
        queryKey: ['sondagesEnAttente'],
        queryFn: () => obtenirSondagesEnAttente().then(r => r.sondages),
    });

    const mutate_validation = useMutation({
        mutationFn: async ({ id_sondage, del }) => {
            if (del) await supprimerSondage(id_sondage)
            else await validerSondage(id_sondage)
            return id_sondage;
        },
        onMutate: async ({ id_sondage }) => {
            await queryClient.cancelQueries({ queryKey: ['sondagesEnAttente'] });
            const previousSondages = queryClient.getQueryData(['sondagesEnAttente']);

            const updatedSondages = previousSondages.filter(s => s.id !== id_sondage);
            queryClient.setQueryData(['sondagesEnAttente'], updatedSondages);

            return { previousSondages };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sondagesEnAttente'] });
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['sondagesEnAttente'], context.previousSondages);
        }
    });

    if (isLoading) {
        return (
            <Container>
                <h1>Gestion des sondages en attente</h1>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement des sondages...</span>
                </Spinner>
                <Button onClick={() => navigate("/")} variant="secondary" className="mt-3">Retour</Button>
            </Container>
        );
    }

    return (
        <Container>
            <h1>Gestion des sondages en attente</h1>
            {sondagesEnAttente.length === 0 ? (
                <Card>
                    <Card.Body>
                        <Card.Text>Aucun sondage en attente.</Card.Text>
                    </Card.Body>
                </Card>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Question</th>
                            <th>Réponses</th>
                            <th>Proposé par</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sondagesEnAttente.map((sondage) => (
                            <tr key={sondage.id}>
                                <td>{sondage.id}</td>
                                <td>{sondage.question}</td>
                                <td>
                                    <ListGroup>
                                        {sondage.reponses.map((reponse, index) => (
                                            <ListGroup.Item key={index}>{reponse}</ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </td>
                                <td>{sondage.propose_par_user_id}</td>
                                <td>{formatDate(sondage.date_proposition)}</td>
                                <td>
                                    <Button
                                        variant="success"
                                        onClick={() => mutate_validation.mutate({ id_sondage: sondage.id, del: false })}
                                        disabled={mutate_validation.isLoading} // Optional: disable buttons during mutation
                                    >
                                        Valider
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => mutate_validation.mutate({ id_sondage: sondage.id, del: true })}
                                        className="ms-2"
                                        disabled={mutate_validation.isLoading}
                                    >
                                        Supprimer
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            <Button variant="primary" onClick={() => suivantEtReload()} className="mt-3">Passer au sondage suivant</Button>
            <Button variant="secondary" onClick={() => navigate("/")} className="mt-3 ms-2">Retour</Button>
        </Container>
    );
}

export default GererSondages;