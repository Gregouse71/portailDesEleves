import { Link } from "react-router-dom";
import { Card, Table, Placeholder } from "react-bootstrap";
import "../../assets/styles/leaderboard.scss";

/** Affiche un leaderboard
 * @param data : liste de données à afficher
 * @param title : titre du classement
 * @param isLoading
 * @param format : [{scoreKey, formatScore}]
 */
export default function Leaderboard({ data, title = "Classement", format = [{ scoreKey: "score", formatScore: (s) => s }], titleRow, isLoading }) {
    if (isLoading || !data) {
        return (
            <Card className="overflow-hidden">
                <Card.Header className="text-center fw-bold py-2">{title}</Card.Header>
                <Table hover className="leaderboard-table mb-0 align-middle">
                    <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
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
                    </tbody>
                </Table>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <Card.Header className="text-center fw-bold py-2">{title}</Card.Header>
            <Table hover className="leaderboard-table mb-0 align-middle">
                {titleRow && (
                    <thead>
                        <tr>
                            <th className="leaderboard-rank-cell"></th>
                            <th className="leaderboard-user-info">Élève</th>
                            {format.map((elt, i) => (
                                <th className="leaderboard-score" key={i}>{elt.nom}</th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {data.map((u, index) => {
                        if (u.isSeparator) {
                            return (
                                <tr key={`sep-${index}`}>
                                    <td className="leaderboard-rank-cell">
                                        <div className="leaderboard-rank rank-separator">⋯</div>
                                    </td>
                                    <td className="leaderboard-user-info" colSpan={1 + format.length}></td>
                                </tr>
                            );
                        }

                        const rank = u.rank ?? index + 1;
                        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';

                        return (
                            <tr key={u.id || index}>
                                <td className="leaderboard-rank-cell">
                                    <div className={`leaderboard-rank ${rankClass}`}>
                                        {rank}
                                    </div>
                                </td>
                                <td className="leaderboard-user-info">
                                    <Link to={`/utilisateur/${u.id}`} className="interactive-link">
                                        <span className="text-truncate d-block">
                                            {u.prenom ? `${u.prenom} ${u.nom}` : u.nom}
                                        </span>
                                    </Link>
                                </td>
                                {format.map((elt, i) => {
                                    const scoreValue = u[elt.scoreKey] !== undefined ? u[elt.scoreKey] : u.score;
                                    return (
                                        <td className="leaderboard-score" key={i}>
                                            {elt.formatScore(scoreValue)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Card>
    );
}
