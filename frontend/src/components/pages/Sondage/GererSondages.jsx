import { useProtected } from '../../../Protected';
import { obtenirSondagesEnAttente, validerSondage, supprimerSondage, sondageSuivant } from '../../../api/api_sondages';
import { chargerUtilisateurs, obtenirDataUser } from '../../../api/api_utilisateurs';
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Spinner, Card, ListGroup } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


function SondageCard({ sondage }) {
    const { data: user, isLoading } = useQuery({
        queryKey: ['donneesUtilisateur', sondage.propose_par_user_id],
        queryFn: () => obtenirDataUser(sondage.propose_par_user_id),
    });

    const formatDate = (dateString) => {
        if (!dateString) {
            return "No date provided";
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "Invalid date value";
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Removed hour and minute
        return date.toLocaleDateString("fr-FR", options);
    }

    const mutate_validation = useMutation({
        mutationFn: async ({ id_sondage, del }) => {
            if (del) await supprimerSondage(id_sondage)
            else await validerSondage(id_sondage)
            return id_sondage;
        },
        onMutate: async ({ id_sondage }) => {
            await queryClient.cancelQueries({ queryKey: ['sondagesEnAttente'] });
            const previousSondages = queryClient.getQueryData(['sondagesEnAttente']);

            const updatedSondages = previousSondages.sondages.filter(s => s.id !== id_sondage);
            queryClient.setQueryData(['sondagesEnAttente'], { ...previousSondages, updatedSondages });

            return { previousSondages };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sondagesEnAttente'] });
        },
        onError: (context) => {
            queryClient.setQueryData(['sondagesEnAttente'], context.previousSondages);
        }
    });

    return <Card className="h-100">
        <Card.Body>
            <Card.Subtitle>
                Proposé par {!isLoading && user.nom_utilisateur}
            </Card.Subtitle>
            <Card.Text>
                le {formatDate(sondage.date_proposition)}
            </Card.Text>
            <Card.Title>{sondage.question}</Card.Title>
            <ListGroup>
                {sondage.reponses.map((reponse, index) => (
                    <ListGroup.Item key={index}>{reponse}</ListGroup.Item>
                ))}
            </ListGroup>
        </Card.Body>
        <Card.Footer>
            <Button
                variant="success"
                onClick={() => mutate_validation.mutate({ id_sondage: sondage.id, del: false })}
                disabled={mutate_validation.isLoading}
                className="w-100 mb-2"
            >
                Valider
            </Button>
            <Button
                variant="danger"
                onClick={() => mutate_validation.mutate({ id_sondage: sondage.id, del: true })}
                disabled={mutate_validation.isLoading}
                className="w-100"
            >
                Supprimer
            </Button>
        </Card.Footer>
    </Card>
}

function GererSondages() {
    const queryClient = useQueryClient();
    const { userData } = useProtected();
    const navigate = useNavigate();


    const suivantEtReload = async () => {
        await sondageSuivant();
        queryClient.invalidateQueries({ queryKey: ['sondage_du_jour'] });
        queryClient.invalidateQueries({ queryKey: ['donneesUtilisateur', userData.id] });
    }

    const { data = { sondages: [], a_venir: 0 }, isLoading: isLoadingSondages } = useQuery({
        queryKey: ['sondagesEnAttente'],
        queryFn: () => obtenirSondagesEnAttente(),
    });


    if (isLoadingSondages) {
        return (
            <Container>
                <h1>Gestion des sondages en attente</h1>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
                <Button onClick={() => navigate("/")} variant="secondary" className="mt-3">Retour</Button>
            </Container>
        );
    }

    return (
        <Container>
            <h1>Gestion des sondages en attente</h1>
            <div className="mb-4">
                <Button variant="primary" onClick={() => suivantEtReload()} className="mt-3">Passer au sondage suivant</Button>
                <Button variant="secondary" onClick={() => navigate("/")} className="mt-3 ms-2">Retour</Button>
            </div>
            <div className='mb-2'>
                Sondages à venir : {data.a_venir}
            </div>
            {data.sondages.length === 0 ? (
                <Card>
                    <Card.Body>
                        <Card.Text>Aucun sondage en attente.</Card.Text>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    {Array.from({ length: Math.ceil(data.sondages.length / 3) }).map((_, rowIndex) => (
                        <Row key={rowIndex} xs={1} md={2} lg={3} className="g-4 mb-4">
                            {data.sondages.slice(rowIndex * 3, rowIndex * 3 + 3).map((sondage) => (
                                <Col key={sondage.id}>
                                    <SondageCard sondage={sondage} />
                                </Col>
                            ))}
                        </Row>
                    ))}
                </>
            )}
        </Container>
    );
}

export default GererSondages;