// src/components/blocs/BlocSondage.jsx
import { obtenirSondageDuJour, voterSondage } from '../../api/api_sondages';
import { useLayout } from './../../layouts/Layout';
import { useNavigate } from 'react-router-dom';
import { Card, Button, ProgressBar } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function BlocSondage() {
    const queryClient = useQueryClient();
    const { userData } = useLayout();
    const navigate = useNavigate();

    const { data: sondage = { is_sondage: false } } = useQuery({
        queryKey: ['sondage_du_jour'],
        queryFn: obtenirSondageDuJour,
    });

    const voterEtReload = async (id_vote) => {
        try {
            await voterSondage(id_vote);  // Attendre la fin du vote
            queryClient.invalidateQueries(['donneesUtilisateur', userData.id]);
        } catch (error) {
            console.error("Erreur lors du vote et du rechargement du sondage", error);
        }
    };

    let content;

    if (sondage.is_sondage) {
        if (userData.vote_sondaj_du_jour === null) {
            content = (
                <>
                    <p className="h3 fw-bold">{sondage.question}</p>
                    <div className="d-grid gap-2">
                        {sondage.reponses.map((reponse, index) => (
                            <Button variant="primary" key={index} onClick={() => voterEtReload(index + 1)}>
                                {reponse}
                            </Button>
                        ))}
                    </div>
                </>
            );
        } else {
            content = (
                <>
                    <p className="h3 fw-bold">{sondage.question}</p>
                    <div>
                        {(() => {
                            const totalVotes = sondage.votes.reduce((sum, v) => sum + v, 0);
                            return sondage.reponses.map((reponse, index) => {
                                const votes = sondage.votes[index];
                                const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                                return (
                                    <div key={index}>
                                        <div className="d-flex justify-content-between">
                                            <p>{reponse}</p>
                                            <p className="text-muted"> {votes} votes ({percent.toFixed(1)}%)</p>
                                        </div>
                                        <ProgressBar now={percent} />
                                    </div>
                                );
                            });
                        })()}

                    </div>
                </>
            );
        }
    } else {
        content = (
            <>
                <Card.Text className='text-center'>
                    <p>Pas de sondage pour le moment...</p>
                    <p>Propose vite un nouveau sondage !</p>
                </Card.Text>
            </>
        );
    }

    return (
        <Card className="bloc-global mb-3">
            <Card.Header as="h5" className="text-center">Sondage du jour</Card.Header>
            <Card.Body className='d-flex flex-column'>
                {content}
            </Card.Body>
            <Card.Footer className="d-flex justify-content-between">
                <Button
                    variant="light"
                    onClick={() => navigate("/sondage/proposer")}
                >
                    <img src="/assets/icons/plus.svg" alt="proposer un sondage" style={{ filter: "brightness(0) saturate(100%)", transition: "transform 0.2s ease" }} />
                </Button>
                <Button
                    variant="light"
                    onClick={() => navigate("/sondage/classement")}
                >
                    <img src="/assets/icons/stats.svg" alt="classement" style={{ filter: "brightness(0) saturate(100%)", transition: "transform 0.2s ease" }} />
                </Button>
                {userData.is_superuser && <Button
                    variant="light"
                    onClick={() => navigate("/sondage/gerer")}
                >
                    <img src="/assets/icons/manage.svg" alt="gestion" style={{ filter: "brightness(0) saturate(100%)", transition: "transform 0.2s ease" }} />
                </Button>}
            </Card.Footer>
        </Card>
    );


}
