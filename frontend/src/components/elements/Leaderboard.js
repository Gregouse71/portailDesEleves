import { Link } from "react-router-dom";
import { Card, Placeholder } from "react-bootstrap";

export default function Leaderboard({ data, title = "Classement", scoreKey = "score", formatScore = (s) => s, isLoading }) {
    if (isLoading || !data) {
        return (
            <div className="leaderboard-container">
                <Card className="leaderboard-card">
                    <div className="leaderboard-header">
                        {title}
                    </div>
                    <div className="leaderboard-body">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="leaderboard-list-item">
                                <div className="leaderboard-rank rank-other">
                                    <Placeholder xs={6} />
                                </div>
                                <div className="leaderboard-user-info">
                                    <div className="bg-light"></div>
                                    <Placeholder as="span" animation="glow" className="flex-grow-1">
                                        <Placeholder xs={8} />
                                    </Placeholder>
                                </div>
                                <div className="leaderboard-score">
                                    <Placeholder xs={4} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }
    else return (
        <div className="leaderboard-container">
            <Card className="leaderboard-card">
                <div className="leaderboard-header">
                    {title}
                </div>
                <div className="leaderboard-body">
                    {data.map((u, index) => {
                        const rank = index + 1;
                        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                        const scoreValue = u[scoreKey] !== undefined ? u[scoreKey] : u.score;

                        return (
                            <div key={u.id || index} className="leaderboard-list-item">
                                <div className={`leaderboard-rank ${rankClass}`}>
                                    {rank}
                                </div>
                                <div className="leaderboard-user-info">
                                    <Link to={`/utilisateur/${u.id}`} className="d-flex align-items-center text-decoration-none text-reset flex-grow-1 overflow-hidden">
                                        <span className="leaderboard-name text-truncate">
                                            {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
                                        </span>
                                    </Link>
                                </div>
                                <div className="leaderboard-score">
                                    {formatScore(scoreValue)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}