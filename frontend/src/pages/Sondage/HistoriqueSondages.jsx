import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col, Spinner, Card, ProgressBar, Alert } from "react-bootstrap";
import { obtenirHistoriqueSondages } from "../../api/api_sondages";
import PageRandom from '../../components/templates/PageRandom';

const DATES_VIDES = { dateDebut: "", dateFin: "" };

function formatDate(dateString) {
    if (!dateString) return "Date inconnue";
    const date = new Date(`${dateString}T00:00:00`); // évite le décalage de fuseau
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SondageCard({ sondage }) {
    const total = sondage.votes.reduce((sum, v) => sum + v, 0);

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Subtitle className="mb-2 text-muted">
                    {formatDate(sondage.date_publication)}
                </Card.Subtitle>
                <p className="h5 fw-bold">{sondage.question}</p>
                {sondage.reponses.map((reponse, index) => {
                    const votes = sondage.votes[index];
                    const percent = total > 0 ? (votes / total) * 100 : 0;
                    return (
                        <div key={index}>
                            <p className="mb-1">
                                <span style={{ fontWeight: sondage.mon_vote === index ? "bold" : "normal" }}>
                                    {reponse}
                                </span>
                                <span className="text-muted"> {votes} votes ({percent.toFixed(1)}%)</span>
                            </p>
                            <ProgressBar now={percent} className="mb-2" />
                        </div>
                    );
                })}
            </Card.Body>
        </Card>
    );
}

function HistoriqueSondages() {
    const [recherche, setRecherche] = useState(""); // ce que tape l'utilisateur
    const [q, setQ] = useState("");                 // mot-clé appliqué (après délai)
    const [dates, setDates] = useState(DATES_VIDES);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(30)

    // Applique le mot-clé 400 ms après la dernière frappe
    useEffect(() => {
        const t = setTimeout(() => {
            setQ(recherche.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [recherche]);

    const handleSetDates = (e) => {
        const { name, value } = e.target;
        setDates((prev) => ({ ...prev, [name]: value }));
        setPage(1);
    };
    const retirerDate = (name) => { setDates((prev) => ({ ...prev, [name]: "" })); setPage(1); };

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ["historiqueSondages", perPage, page, q, dates.dateDebut, dates.dateFin],
        queryFn: () => obtenirHistoriqueSondages({ page, parPage: perPage, q, ...dates }),
        placeholderData: (previous) => previous, // garde l'ancienne page pendant le chargement
    });

    const sondages = data?.sondages ?? [];

    return <PageRandom
        titre="Historique des sondages"
        isLoading={isLoading}
        avecRequete={true} paramsReq={{ query: recherche, placeholder: "Question ou réponse...", onChange: (e) => setRecherche(e.target.value), onClear: () => setRecherche("") }}
        avecPagination={true} paramsPag={{ page, setPage, totalPages: data?.pages ?? 0 }}
        avecDates={true} paramsDates={{ dates, onClear: { debut: () => retirerDate("dateDebut"), fin: () => retirerDate("dateFin") }, handleSetDates }}
        avecNbPP={true} paramsNbPP={{ setPerPage, perPage }}
    >
        {data && (
            <div className="text-muted mb-2">
                {data.total} sondage{data.total > 1 ? "s" : ""}{" "}
                {isFetching && <Spinner size="sm" animation="border" />}
            </div>
        )}

        {isError ? (
            <Alert variant="danger">{error.message}</Alert>
        ) : sondages.length === 0 ? (
            <Card>
                <Card.Body>
                    <Card.Text>Aucun sondage ne correspond à ta recherche.</Card.Text>
                </Card.Body>
            </Card>
        ) : (
            <Row xs={1} sm={2} lg={3} xl={4} className="g-3 mb-4">
                {sondages.map((sondage) => (
                    <Col key={sondage.id}>
                        <SondageCard sondage={sondage} />
                    </Col>
                ))}
            </Row>
        )}
    </PageRandom>;
}

export default HistoriqueSondages;