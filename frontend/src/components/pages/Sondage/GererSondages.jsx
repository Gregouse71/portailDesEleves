import { useProtected } from '../../../Protected';
import { obtenirSondagesEnAttente, validerSondage, supprimerSondage, sondageSuivant } from '../../../api/api_sondages';
import { obtenirDataUser } from '../../../api/api_utilisateurs';
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Card, ListGroup } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageRandom from '../../templates/PageRandom';


function SondageCard({ sondage }) {
    const queryClient = useQueryClient();
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
            queryClient.setQueryData(['sondagesEnAttente'], { ...previousSondages, sondages: updatedSondages });

            return { previousSondages };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sondagesEnAttente'] });
        },
        onError: (_err, _vars, context) => {
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
        <Card.Footer className="d-flex justify-content-around">
            <Button
                variant="success"
                onClick={() => mutate_validation.mutate({ id_sondage: sondage.id, del: false })}
                disabled={mutate_validation.isLoading}
            >
                Valider
            </Button>
            <Button
                variant="danger"
                onClick={() => mutate_validation.mutate({ id_sondage: sondage.id, del: true })}
                disabled={mutate_validation.isLoading}
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

    const { data = { sondages: [], a_venir: 0 }, isLoading } = useQuery({
        queryKey: ['sondagesEnAttente'],
        queryFn: () => obtenirSondagesEnAttente(),
    });

    return <PageRandom
        titre="Gestion des sondages en attente"
        sousTitre={`Sondages à venir : ${data.a_venir}`}
        isLoading={isLoading}
        contenu={<>
            <div className="mb-4">
                <Button variant="primary" onClick={() => suivantEtReload()} className="mt-3">Passer au sondage suivant</Button>
                <Button variant="secondary" onClick={() => navigate("/")} className="mt-3 ms-2">Retour</Button>
            </div>
            {data.sondages.length === 0 ? (
                <Card>
                    <Card.Body>
                        <Card.Text>Aucun sondage en attente.</Card.Text>
                    </Card.Body>
                </Card>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4 mb-4">
                    {data.sondages.map((sondage) => (
                        <Col key={sondage.id}>
                            <SondageCard sondage={sondage} />
                        </Col>
                    ))}
                </Row>
            )}
        </>}
    />;
}

export default GererSondages;