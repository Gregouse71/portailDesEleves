import { Container, Row, Col, Card, ListGroup } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { obtenirScoresSondages } from "../../../api/api_sondages";
import { useQuery } from "@tanstack/react-query";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

// Constants for styling the top ranks
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

const RECENT_FORMULA = 'S_r = \\sum_{i=1}^N w_i V_i \\quad \\text{où } w_i = e^{-\\lambda t_i} \\quad \\text{et } V_i = \\begin{cases} 1 \\quad \\text{si le vote est gagnant}\\\\ -1 \\quad \\text{sinon} \\end{cases}';
const GLOBAL_FORMULA = 'S_g = \\bar{X} \\pm z_\\alpha \\sqrt{\\frac{1 - \\bar{X}^2}{N}} \\quad \\text{où } \\begin{cases}\\bar{X} = \\frac{1}{N} \\sum_{i=1}^N V_i\\\\z_\\alpha = 1.96\\end{cases}';

// ----------------------------------------------------------------------
// Reusable Component for Rendering a Single List (Updated)
// ----------------------------------------------------------------------
function RankingList({ title, data, scoreKey, isNegative = false, isVotes = false }) {
    return (
        <Card className="mb-4 h-100">
            <Card.Header
                as="h5"
                className={`text-center fw-bold ${isNegative ? 'bg-danger text-white' : isVotes ? 'bg-info text-white' : 'bg-success text-white'}`}
            >
                {title}
            </Card.Header>
            <ListGroup variant="flush">
                {data.map((user, index) => {
                    const rank = index + 1;
                    const score = user[scoreKey] !== undefined && user[scoreKey] !== null
                        ? (isVotes ? user[scoreKey] : user[scoreKey].toFixed())
                        : "0";

                    const colorStyle = index < 3 ? { backgroundColor: RANK_COLORS[index], fontWeight: 'bold' } : {};

                    return (
                        <ListGroup.Item
                            key={user.nom_utilisateur}
                            className="d-flex justify-content-between align-items-center"
                        >
                            {/* START: Two-column layout within the list item */}
                            <Row className="w-100 align-items-center mx-0">
                                {/* COLUMN 1: Rank and Name */}
                                <Col xs={7} className="d-flex align-items-center px-0" >
                                    <span style={{ width: '30px', textAlign: 'left', marginRight: '10px' }}>
                                        <span style={colorStyle}>
                                            #{rank}
                                        </span>
                                    </span>
                                    <Link
                                        to={`/utilisateur/${user.id}`}
                                        className="text-decoration-none text-dark" // Remove default underline and keep text dark
                                    >
                                        <strong>{user.prenom} {user.nom}</strong>
                                    </Link>
                                </Col>

                                {/* COLUMN 2: Score/Value */}
                                <Col xs={5} className="text-end px-0">
                                    <span>
                                        {score} {isVotes ? 'votes' : ''}
                                    </span>
                                </Col>
                            </Row>
                            {/* END: Two-column layout */}
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
        </Card>
    );
}

// Helper function to find the current user's vote count
const getCurrentUserVoteCount = (maxVotesArray, currentUsername) => {
    const currentUserStats = maxVotesArray.find(user => user.nom_utilisateur === currentUsername);
    // Assuming the vote count key is 'max_votes' inside the user object
    return currentUserStats ? currentUserStats.nombre_votes : 0;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function ClassementSondage() {
    const { data: scores = { recent: [[], []], global: [[], []] } } = useQuery({
        queryKey: ['scoresSondages'],
        queryFn: obtenirScoresSondages,
    });

    // NOTE: Replace 'current_user_username' with the actual way you get the logged-in user's username
    const currentUsername = "PlaceholderUsername"; // <-- **REPLACE THIS**

    // Destructure data
    const { mon_score_recent, mon_score_global, max_votes = [], recent, global: globalScores } = scores;

    // Format scores for display
    const recentScore = mon_score_recent ? mon_score_recent.toFixed(3) : "0.000";
    const globalScoreCon = mon_score_global && mon_score_global[0] ? mon_score_global[0].toFixed(3) : "0.000";
    const globalScoreDiv = mon_score_global && mon_score_global[1] ? mon_score_global[1].toFixed(3) : "0.000";

    // Find participation count
    const participationCount = getCurrentUserVoteCount(max_votes, currentUsername);


    return (
        <Container className="mt-4">
            <h1 className="mb-4 text-center">Classement des Sondages</h1>

            {/* ------------------- CURRENT USER SCORE (Condensed) ------------------- */}
            <Card className="mb-5 p-3 bg-light shadow-sm">
                <Card.Title>Mon Score Actuel</Card.Title>

                {/* Score Row */}
                <Row className="fw-bold mb-2">
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                        Score Récent : <span className="text-primary">{recentScore}</span>
                    </Col>
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                        Global Convergent : <span className="text-success">{globalScoreCon}</span>
                    </Col>
                    <Col xs={12} md={4}>
                        Global Divergent : <span className="text-danger">{globalScoreDiv}</span>
                    </Col>
                </Row>

                {/* Participation Count at the bottom */}
                <Card.Text className="small text-muted border-top pt-2 mt-2">
                    Nombre de votes : <strong className="text-dark">{participationCount}</strong>
                </Card.Text>
            </Card>

            {/* ------------------- CLASSEMENT RÉCENT ------------------- */}
            <h2 className="mt-5 mb-3">Classement Récent</h2>
            <p className="text-muted">Calculé avec de coefficients en exponentielle décroissante sur les votes par date :</p>
            <BlockMath math={RECENT_FORMULA} />
            <Row>
                <Col md={6}>
                    <RankingList
                        title="Top convergent recent"
                        data={recent[0]}
                        scoreKey="score_recent"
                    />
                </Col>
                <Col md={6}>
                    <RankingList
                        title="Top divergent recent"
                        data={recent[1]}
                        scoreKey="score_recent"
                        isNegative={true}
                    />
                </Col>
            </Row>

            {/* ------------------- CLASSEMENT GLOBAL ------------------- */}
            <h2 className="mt-5 mb-3">Classement Global</h2>
            <p className="text-muted">Calculé grâce à l'intervalle de confiance à 95% d'une gaussienne.</p>
            <BlockMath math={GLOBAL_FORMULA} />
            <Row>
                <Col md={6}>
                    <RankingList
                        title="Top convegent global"
                        data={globalScores[0]}
                        scoreKey="score_global_con"
                    />
                </Col>
                <Col md={6}>
                    <RankingList
                        title="Top divergent"
                        data={globalScores[1]}
                        scoreKey="score_global_div"
                        isNegative={true}
                    />
                </Col>
            </Row>

            {/* ------------------- TOP VOTERS (MOVED TO BOTTOM) ------------------- */}
            {max_votes.length > 0 && (
                <>
                    <h2 className="mt-5 mb-3">Classement des participations</h2>
                    <p className="text-muted">Classement basé sur le nombre total de votes effectués.</p>
                    <Row className="justify-content-center">
                        <Col md={6} lg={4}>
                            <RankingList
                                title="Top participants"
                                data={max_votes}
                                scoreKey="nombre_votes"
                                isVotes={true}
                            />
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}