import { Button, Row, Col, Container } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nouvellePartie, partieEnCours, faireUnCoup, leaderboardJeu } from "../../../api/api_jeux";
import { useLayout } from '../../../layouts/Layout';
import '../../../assets/styles/jeux2048.scss';
import Leaderboard from "../../elements/Leaderboard";

const JEU = "2048";

function Plateau({ arr, ...props }) {
    return (
        <div className="jeux-2048-board" {...props}>
            {arr.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                    <div key={`${rowIndex}-${colIndex}`} className={`jeux-2048-cell tile-${cell}`}>
                        {cell > 0 ? cell : ""}
                    </div>
                ))
            ))}
        </div>
    );
}

export default function Jeux2048() {
    const { userData } = useLayout();
    const queryClient = useQueryClient();
    const { data: partie, isLoading } = useQuery({
        queryKey: [JEU],
        queryFn: () => { return partieEnCours(JEU) },
    });

    const { data: fetchedData, isLoading2 } = useQuery({
        queryKey: ["leaderboard", JEU],
        queryFn: () => leaderboardJeu(JEU)
    })

    const nouvellePartieMutation = useMutation({
        mutationFn: async () => {
            await nouvellePartie({ jeu: JEU });
        },
        onSuccess: () => {
            queryClient.invalidateQueries([JEU]);
        }
    });

    const moveMutation = useMutation({
        mutationFn: async (direction) => {
            if (partie?.jeu !== JEU || partie?.terminee) return;
            const newSate = await faireUnCoup({ coup: direction, score: partie?.score }, JEU);
            return newSate
        },
        onSuccess: (newState) => {
            queryClient.setQueryData([JEU], newState);
        },
    });

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchMove = (e) => {
        setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isLeft = distanceX > minSwipeDistance;
        const isRight = distanceX < -minSwipeDistance;
        const isUp = distanceY > minSwipeDistance;
        const isDown = distanceY < -minSwipeDistance;

        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            if (isLeft) moveMutation.mutate('gauche');
            if (isRight) moveMutation.mutate('droite');
        } else {
            if (isUp) moveMutation.mutate('haut');
            if (isDown) moveMutation.mutate('bas');
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            let direction = '';
            switch (event.key) {
                case 'ArrowUp':
                    direction = 'haut';
                    break;
                case 'ArrowDown':
                    direction = 'bas';
                    break;
                case 'ArrowLeft':
                    direction = 'gauche';
                    break;
                case 'ArrowRight':
                    direction = 'droite';
                    break;
                default:
                    return;
            }
            event.preventDefault(); // Prevent default scroll behavior
            moveMutation.mutate(direction);
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [moveMutation]);

    if (isLoading) return <>Chargement...</>;

    return (
        <Container className="jeux-2048-container py-4">
            <h1 className="mb-3">2048</h1>
            <Row className="w-100 justify-content-center">
                <Col md={7} className="d-flex flex-column align-items-center">
                    <div className="score-container">
                        <div className="score-box">
                            <div className="score-label">Meilleur</div>
                            <div className="score-value">{userData.meilleur_score_2048}</div>
                        </div>
                        <div className="score-box">
                            <div className="score-label">Actuel</div>
                            <div className="score-value">{partie?.jeu === JEU ? partie.score : 0}</div>
                        </div>
                    </div>

                    <div className="mb-3 position-relative w-100 d-flex justify-content-center">
                        {partie?.jeu === JEU ? (<>
                            {partie.terminee && (
                                <div className="position-absolute top-50 start-50 translate-middle text-center p-3 rounded"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 10, backdropFilter: 'blur(5px)', border: '2px solid red' }}>
                                    <h2 className="text-danger fw-bold mb-0">Game Over</h2>
                                </div>
                            )}
                            <Plateau 
                                arr={partie.etat.plateau} 
                                onTouchStart={onTouchStart} 
                                onTouchMove={onTouchMove} 
                                onTouchEnd={onTouchEnd}
                            />
                        </>) : (
                            <div className="d-flex flex-column align-items-center justify-content-center p-5 border rounded" style={{ height: 'auto', width: '100%', maxWidth: '500px', aspectRatio: '1', backgroundColor: 'var(--card-bg)' }}>
                                <p className="mb-0 fs-5 text-muted">Commence une nouvelle partie</p>
                            </div>
                        )}
                    </div>
                    <Button size="lg" variant="primary" onClick={() => nouvellePartieMutation.mutate()} className="px-4 py-2 fw-bold shadow-sm">
                        {partie?.jeu === JEU ? "Nouvelle Partie" : "Commencer"}
                    </Button>
                    {moveMutation.isError && <p className="text-danger mt-2">Erreur lors du déplacement.</p>}
                </Col>
                <Col md={5}>
                    <Leaderboard data={fetchedData} title="Meilleures parties" isLoading={isLoading2} />
                </Col>
            </Row>
        </Container>
    );
}
