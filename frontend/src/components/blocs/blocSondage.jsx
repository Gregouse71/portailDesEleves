// src/components/blocs/BlocSondage.jsx
import { obtenirSondageDuJour, voterSondage } from '../../api/api_sondages';
import { useProtected } from './../../Protected';
import { useNavigate } from 'react-router-dom';
import { Card, Button, ProgressBar } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { verifierPermission } from '../../api/api_global';

export default function BlocSondage() {
    const queryClient = useQueryClient();
    const { userData } = useProtected();
    const navigate = useNavigate();

    const { data: sondage = { is_sondage: false } } = useQuery({
        queryKey: ['sondage_du_jour'],
        queryFn: obtenirSondageDuJour,
    });
    const { data: vpSondaj = false } = useQuery({
        queryKey: ['permSondaj'],
        queryFn: () => verifierPermission({}, "sondaj", userData.id),
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
                            <Button variant="primary" key={index} onClick={() => voterEtReload(index)}>
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
                                            <p>
                                                <span style={{ fontWeight: userData.vote_sondaj_du_jour === index ? "bold" : "normal" }}                                                >
                                                    {reponse}
                                                </span>
                                                <span className="text-muted"> {votes} votes ({percent.toFixed(1)}%)</span>
                                            </p>
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
                    Pas de sondage pour le moment...<br />
                    Propose vite un nouveau sondage !
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
            {sondage.hier && <>
                <Card.Header as="h6" className="text-center">Sondage d&apos;hier</Card.Header>
                <Card.Body>
                    <p className="h5 fw-bold">{sondage.hier.question}</p>
                    <div>
                        {(() => {
                            const totalVotes = sondage.hier.votes.reduce((sum, v) => sum + v, 0);
                            return sondage.hier.reponses.map((reponse, index) => {
                                const votes = sondage.hier.votes[index];
                                const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                                return (
                                    <div key={index}>
                                        <div className="d-flex justify-content-between">
                                            <p>
                                                {reponse}
                                                <span className="text-muted"> {votes} votes ({percent.toFixed(1)}%)</span>
                                            </p>
                                        </div>
                                        <ProgressBar now={percent} />
                                    </div>
                                );
                            });
                        })()}

                    </div>
                </Card.Body>
            </>}
            <Card.Footer className="d-flex justify-content-between">
                <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/sondage/proposer")}
                >
                    <img src="/assets/icons/plus.svg" alt="proposer un sondage" className="theme-icon" />
                </Button>
                <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/sondage/classement")}
                >
                    <img src="/assets/icons/stats.svg" alt="classement" className="theme-icon" />
                </Button>
                {vpSondaj && <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/sondage/gerer")}
                >
                    <img src="/assets/icons/manage.svg" alt="gestion" className="theme-icon" />
                </Button>}
            </Card.Footer>
        </Card>
    );


}
