import { Container, Row, Col, Card } from "react-bootstrap";
import { obtenirScoresSondages } from "../../../api/api_sondages";
import { useQuery } from "@tanstack/react-query";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { useLayout } from "../../../layouts/Layout";
import '../../../assets/styles/classement_sondage.scss';
import Leaderboard from "../../elements/Leaderboard";

const RECENT_FORMULA = 'S_r = \\100sum_{i=1}^N w_i V_i \\quad \\text{où } w_i = e^{-\\lambda t_i} \\quad \\text{et } V_i = \\begin{cases} 1 \\quad \\text{si le vote est gagnant}\\\\ -1 \\quad \\text{sinon} \\end{cases}';
const GLOBAL_FORMULA = 'S_g = \\frac{100}{1 + \\frac{z_\\alpha^2}{N}} \\left[\\hat X + \\frac{z_\\alpha^2}{2N} - z_\\alpha\\sqrt{\\frac{\\hat X(1-\\hat X) + \\frac{z_\\alpha^2}{4N}}{N}}\\right] \\text{où } \\begin{cases}\\hat{X} = \\frac{1}{N} \\sum_{i \\in {gagants} \\;\\text{ou}\\; i \\in {perdants}} V_i\\\\z_\\alpha = 1.96\\end{cases}';

export default function ClassementSondage() {
    const { userData } = useLayout();
    const { data: scores = { recent: [[], []], global: [[], []] }, isLoading } = useQuery({
        queryKey: ['scoresSondages'],
        queryFn: obtenirScoresSondages,
    });

    // Destructure data
    const { mon_score_recent, mon_score_global, max_votes = [], recent, global: globalScores } = scores;

    // Format scores for display
    const recentScore = mon_score_recent ? mon_score_recent.toFixed(3) : "0.000";
    const globalScoreCon = mon_score_global && mon_score_global[0] ? mon_score_global[0].toFixed(3) : "0.000";
    const globalScoreDiv = mon_score_global && mon_score_global[1] ? mon_score_global[1].toFixed(3) : "0.000";

    const formatFloatScore = (s) => s !== undefined && s !== null ? s.toFixed() : "0";
    const formatIntScore = (s) => s !== undefined && s !== null ? `${s} votes` : "0 votes";

    return (
        <Container className="mt-4">
            <h1 className="mb-4 text-center">Classement des Sondages</h1>

            <Card className="mb-5 p-3 classement-bg-light">
                <Card.Title>Mes Scores Actuels</Card.Title>

                <Row className="fw-bold mb-2">
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                        Score Récent : <span className="classement-text-primary">{recentScore}</span>
                    </Col>
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                        Global Convergent : <span className="classement-text-success">{globalScoreCon}</span>
                    </Col>
                    <Col xs={12} md={4}>
                        Global Divergent : <span className="classement-text-danger">{globalScoreDiv}</span>
                    </Col>
                </Row>

                <Card.Text className="small text-muted border-top pt-2 mt-2">
                    Nombre de votes : <strong className="classement-text-dark">{userData.nombre_votes}</strong>
                </Card.Text>
            </Card>

            <h2 className="mt-5 mb-3">Classement Récent</h2>
            <p className="text-muted">Calculé avec des coefficients en exponentielle décroissante sur les votes par date :</p>
            <BlockMath math={RECENT_FORMULA} />
            <Row>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top convergent recent" data={recent[0]} scoreKey="score_recent" formatScore={formatFloatScore} isLoading={isLoading} />
                </Col>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top divergent recent" data={recent[1]} scoreKey="score_recent" formatScore={formatFloatScore} isLoading={isLoading} />
                </Col>
            </Row>

            <h2 className="mt-5 mb-3">Classement Global</h2>
            <p className="text-muted">Calculé grâce à la formule de Wilson.</p>
            <BlockMath math={GLOBAL_FORMULA} />
            <Row>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top convergent global" data={globalScores[0]} scoreKey="score_global_con" formatScore={formatFloatScore} isLoading={isLoading} />
                </Col>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top divergent global" data={globalScores[1]} scoreKey="score_global_div" formatScore={formatFloatScore} isLoading={isLoading} />
                </Col>
            </Row>

            {max_votes.length > 0 && (
                <>
                    <h2 className="mt-5 mb-3">Classement des participations</h2>
                    <p className="text-muted">Classement basé sur le nombre total de votes effectués.</p>
                    <Row className="justify-content-center">
                        <Col md={6} className="mb-4">
                            <Leaderboard title="Top participants" data={max_votes} scoreKey="nombre_votes" formatScore={formatIntScore} isLoading={isLoading} />
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}