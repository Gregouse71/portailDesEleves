import { Link } from "react-router-dom";
import { Card, Placeholder } from "react-bootstrap";
import "../../assets/styles/leaderboard.scss"

/** Affiche un leaderboard
 * @param data : liste de données à afficher
 * @param title : titre du classement
 * @param isLoading
 * @param format : [{scoreKey, formatScore}]
 */
export default function Leaderboard({ data, title = "Classement", format = [{ scoreKey: "score", formatScore: (s) => s }], titleRow, isLoading }) {
    if (isLoading || !data) {
        return (
            <div className="leaderboard-container">
                <Card className="leaderboard-card">
                    <div className="leaderboard-header">
                        {title}
                    </div>
                    <table className="leaderboard-body">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="leaderboard-list-item">
                                <td className="leaderboard-rank-cell">
                                    <div className="leaderboard-rank rank-other">
                                        <Placeholder xs={6} />
                                    </div>
                                </td>
                                <td className="leaderboard-user-info">
                                    <Placeholder as="span" animation="glow" className="flex-grow-1">
                                        <Placeholder xs={8} />
                                    </Placeholder>
                                </td>
                                {format.map((_, idx) => (
                                    <td key={idx} className="leaderboard-score">
                                        <Placeholder xs={4} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </table>
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
                <table className="leaderboard-body">
                    {titleRow && <tr className="leaderboard-list-item">
                        <td className="leaderboard-rank-cell"></td>
                        <td className="leaderboard-user-info">
                            Élève
                        </td>
                        {format.map((elt, i) => {
                            return <td className="leaderboard-score" key={i}>{elt.nom}</td>
                        })
                        }
                    </tr>}
                    {data.map((u, index) => {
                        const rank = index + 1;
                        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';

                        return (
                            <tr key={u.id || index} className="leaderboard-list-item">
                                <td className="leaderboard-rank-cell">
                                    <div className={`leaderboard-rank ${rankClass}`}>
                                        {rank}
                                    </div>
                                </td>
                                <td className="leaderboard-user-info">
                                    <Link to={`/utilisateur/${u.id}`} className="text-decoration-none text-reset">
                                        <span className="leaderboard-name text-truncate">
                                            {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
                                        </span>
                                    </Link>
                                </td>
                                {format.map((elt, i) => {
                                    const scoreValue = u[elt.scoreKey] !== undefined ? u[elt.scoreKey] : u.score;
                                    return <td className="leaderboard-score" key={i}>
                                        {elt.formatScore(scoreValue)}
                                    </td>
                                })
                                }
                            </tr>
                        );
                    })}
                </table>
            </Card>
        </div>
    );
}