import { useState } from "react";
import { Container, Row, Col, Card, Button, Collapse } from "react-bootstrap";
import { obtenirScoresSondages } from "../../../api/api_sondages";
import { useQuery } from "@tanstack/react-query";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { useProtected } from "../../../Protected";
import '../../../assets/styles/classement_sondage.scss';
import Leaderboard from "../../elements/Leaderboard";

const RECENT_FORMULA = 'S_r = 100\\sum_{i=1}^N V_i \\exp\\left(-\\frac{\\text{age}}{14 \\text{jours}}\\right) \\quad \\quad \\text{où } V_i = \\begin{cases} 1 \\quad \\text{si le vote est gagnant}\\\\ -1 \\quad \\text{sinon} \\end{cases}';
const GLOBAL_FORMULA = 'S_g = \\frac{100}{1 + \\frac{z_\\alpha^2}{N}} \\left[\\hat X + \\frac{z_\\alpha^2}{2N} - z_\\alpha\\sqrt{\\frac{\\hat X(1-\\hat X) + \\frac{z_\\alpha^2}{4N}}{N}}\\right] \\text{où } \\begin{cases}\\hat{X} = \\frac{1}{N} \\sum_{i \\in {\\text{gagants}} \\;\\text{ou}\\; i \\in {\\text{perdants}}} V_i\\\\z_\\alpha = 1.96\\end{cases}';

export default function ClassementSondage() {
    const { userData } = useProtected();
    const [openRecent, setOpenRecent] = useState(false);
    const [openGlobal, setOpenGlobal] = useState(false);

    const { data: scores = { recent: [[], []], global: [[], []] }, isLoading } = useQuery({
        queryKey: ['scoresSondages'],
        queryFn: obtenirScoresSondages,
    });

    // Destructure data
    const { mon_score_recent, mon_score_global, max_votes, recent, global: globalScores } = scores;

    // Format scores for display
    const recentScore = mon_score_recent ? mon_score_recent.toFixed(3) : "0.000";
    const globalScoreCon = mon_score_global && mon_score_global[0] ? mon_score_global[0].toFixed(3) : "0.000";
    const globalScoreDiv = mon_score_global && mon_score_global[1] ? mon_score_global[1].toFixed(3) : "0.000";

    const formatFloatScore = (s) => s !== undefined && s !== null ? s.toFixed() : "0";
    const formatIntScore = (s) => s !== undefined && s !== null ? s : "0";
    const formatIntScoreVotes = (s) => s !== undefined && s !== null ? `${s} votes` : "0 votes";

    return (
        <Container className="mt-4">
            <h1 className="mb-4 text-left">Classement des Sondages</h1>

            <Card className="mb-3 p-3 classement-bg-light">
                <Card.Title>Mes Scores Actuels</Card.Title>

                <Row className="fw-bold mb-2">
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                        Score récent : <span className="classement-text-primary">{recentScore}</span>
                    </Col>
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                        Global consensuel : <span className="classement-text-success">{globalScoreCon}</span>
                    </Col>
                    <Col xs={12} md={4}>
                        Global libre penseur : <span className="classement-text-danger">{globalScoreDiv}</span>
                    </Col>
                </Row>
                <Row className="border-top fw-bold pt-2 mt-2">
                    <Col xs={12} md={4} className="mb-2 mb-md-0 fw-normal">
                        Nombre de votes : {userData.nombre_votes}
                    </Col>
                    <Col xs={12} md={4} className="mb-2 mb-md-0 fw-normal">
                        Nombre de victoires : {userData.victoires}
                    </Col>
                    <Col xs={12} md={4} className="mb-2 mb-md-0 fw-normal">
                        Nombre de défaites : {userData.defaites}
                    </Col>
                </Row>
            </Card>

            <div className="d-flex align-items-center mb-1">
                <h3 className="m-0">Classement Récent</h3>
                <Button
                    variant="link"
                    size="sm"
                    className="text-decoration-none p-0 ms-2"
                    onClick={() => setOpenRecent(!openRecent)}
                    aria-controls="recent-explanation"
                    aria-expanded={openRecent}
                >
                    Détails du calcul
                </Button>
            </div>
            <Collapse in={openRecent}>
                <div id="recent-explanation">
                    <p className="text-muted mt-2">
                        En classant les consensuels et les libres penseurs uniquement sur leurs participations globales, on désavantage les 1A par rapport aux 3A et le classement évolue peu au cours du temps. Pour premettre aux 1A d'apparaître dans le classement sans avoir à voter pendant des années, on donne plus de poids aux votes les plus récents, selon une exponentielle avec un temps caractéristique de 14 jours :
                    </p>
                    <BlockMath math={RECENT_FORMULA} />
                </div>
            </Collapse>
            <Row>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top consensuels recent" data={recent[0]} format={[{ scoreKey: "score_recent", formatScore: formatFloatScore }]} isLoading={isLoading} />
                </Col>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top libres penseurs recent" data={recent[1]} format={[{ scoreKey: "score_recent", formatScore: formatFloatScore }]} isLoading={isLoading} />
                </Col>
            </Row>

            <div className="d-flex align-items-center mb-1">
                <h3 className="m-0">Classement Global</h3>
                <Button
                    variant="link"
                    size="sm"
                    className="text-decoration-none p-0 ms-2"
                    onClick={() => setOpenGlobal(!openGlobal)}
                    aria-controls="global-explanation"
                    aria-expanded={openGlobal}
                >
                    Détails du calcul
                </Button>
            </div>
            <Collapse in={openGlobal}>
                <div id="global-explanation">
                    <p className="text-muted mt-2">
                        La première méthode de classement qui vient à l'esprit serait de classer par nombres de victoires et nombres de défaites. Mais cela ne serait pas logique : une personne avec 50 victoires sur 100 participations serait mieux classée qu'une persone avec 49 victoires sur 50 participations.<br /><br />

                        On peut donc penser à classer selon les pourcentages de victoires et de défaites. Mais cela ne convient pas non plus : une personne avec 1 victoire sur 1 seule participation (score de 100%) est classée devant une personne avec 90% de victoires sur 100 participations. Même en mettant un seuil de partications minimales, ce système favorise ceux qui votent peu par rapport à ceux qui votent beaucoup.<br /><br />

                        Il faut donc garder cette idée de pourcentage, mais en la corrigeant pour tenir compte de l'incertitude due au petit nombre de votes. On se demande donc "A quelle valeur est-on sûr à 95% que le vrai pourcentage de victoires est supérieur ?". Ceux qui allaient aux amphi de stat en 2013 sauront que la réponse a été donnée par Edwin B. Wilson en 1927 : la borne inférieure de l'intervalle de confiance de Wilson pour une loi de Bernoulli, dont la formule est :<br /><br />
                    </p>
                    <BlockMath math={GLOBAL_FORMULA} />
                </div>
            </Collapse>
            <Row>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top consensuels global" data={globalScores[0].map((elt => { return { ...elt, "ratio": `${elt.victoires} / ${elt.nombre_votes}` } }))}
                        format={[
                            { scoreKey: "score_global_con", formatScore: formatFloatScore, nom: "Note" },
                            { scoreKey: "ratio", formatScore: formatIntScore, nom: "Victoires / Participations" },
                        ]}
                        isLoading={isLoading}
                        titleRow={true} />
                </Col>
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top libres penseurs global"
                        data={globalScores[1].map((elt => { return { ...elt, "ratio": `${elt.defaites} / ${elt.nombre_votes}` } }))}
                        format={[
                            { scoreKey: "score_global_div", formatScore: formatFloatScore, nom: "Note" },
                            { scoreKey: "ratio", formatScore: formatIntScore, nom: "Défaites / Participations" },
                        ]}
                        isLoading={isLoading}
                        titleRow={true} />
                </Col>
            </Row>

            <h3 className="mt-1 mb-1">Classement des participations</h3>
            <p className="text-muted">Classement basé sur le nombre total de votes effectués.</p>
            <Row className="justify-content-center">
                <Col md={6} className="mb-4">
                    <Leaderboard title="Top participants" data={max_votes}
                        format={[{ scoreKey: "nombre_votes", formatScore: formatIntScoreVotes }]}
                        isLoading={isLoading} />
                </Col>
            </Row>
        </Container>
    );
}