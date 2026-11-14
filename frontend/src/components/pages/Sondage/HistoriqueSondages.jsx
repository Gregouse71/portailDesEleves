import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {Container, Row, Col, Spinner, Card, ProgressBar,Form, Pagination, Alert, CloseButton, InputGroup} from "react-bootstrap";
import { obtenirHistoriqueSondages } from "../../../api/api_sondages";

const PAR_PAGE = 12;
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

// Libellé et champ sur la même ligne, avec une petite croix dans le champ si celui-ci est rempli
function ChampAvecCroix({ label, valeur, onClear, decalage = "0.75rem", children }) {
    return (
        <InputGroup>
            <InputGroup.Text>{label}</InputGroup.Text>
            {children}
            {valeur !== "" && (
                <CloseButton
                    onClick={onClear}
                    aria-label={`Effacer : ${label}`}
                    className="position-absolute top-50 translate-middle-y"
                    style={{ right: decalage, fontSize: "0.7rem", zIndex: 6 }}
                />
            )}
        </InputGroup>
    );
}

function PaginationFenetre({ page, pages, onChange }) {
    if (pages <= 1) return null;

    // La page courante, 2 avant et 2 après (moins près du début ou de la fin)
    const debut = Math.max(1, page - 2);
    const fin = Math.min(pages, page + 2);
    const numeros = [];
    for (let i = debut; i <= fin; i++) numeros.push(i);

    return (
        <div className="d-flex justify-content-center mb-4">
            <Pagination>
                <Pagination.First disabled={page <= 1} onClick={() => onChange(1)} />
                <Pagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1)} />
                {numeros.map((n) => (
                    <Pagination.Item key={n} active={n === page} onClick={() => onChange(n)}>
                        {n}
                    </Pagination.Item>
                ))}
                <Pagination.Next disabled={page >= pages} onClick={() => onChange(page + 1)} />
                <Pagination.Last disabled={page >= pages} onClick={() => onChange(pages)} />
            </Pagination>
        </div>
    );
}

function HistoriqueSondages() {
    const [recherche, setRecherche] = useState(""); // ce que tape l'utilisateur
    const [q, setQ] = useState("");                 // mot-clé appliqué (après délai)
    const [dates, setDates] = useState(DATES_VIDES);
    const [page, setPage] = useState(1);

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

    const retirerMotCle = () => { setRecherche(""); setQ(""); setPage(1); };
    const retirerDate = (name) => { setDates((prev) => ({ ...prev, [name]: "" })); setPage(1); };

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ["historiqueSondages", page, q, dates.dateDebut, dates.dateFin],
        queryFn: () => obtenirHistoriqueSondages({ page, parPage: PAR_PAGE, q, ...dates }),
        placeholderData: (previous) => previous, // garde l'ancienne page pendant le chargement
    });

    const sondages = data?.sondages ?? [];
    const pages = data?.pages ?? 0;

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="m-0 text-left">Historique des sondages</h1>
            </div>

            <Row className="g-2 mb-3">
                <Col xs={12} md={6}>
                    <ChampAvecCroix label="Mot-clé" valeur={recherche} onClear={retirerMotCle}>
                        <Form.Control
                            type="text"
                            className="rounded-end"
                            placeholder="Question ou réponse..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            style={{ paddingRight: "2.25rem" }}
                        />
                    </ChampAvecCroix>
                </Col>
                <Col xs={6} md={3}>
                    {/* décalage plus grand : la croix se place à gauche de l'icône calendrier */}
                    <ChampAvecCroix label="Du" valeur={dates.dateDebut} onClear={() => retirerDate("dateDebut")} decalage="2.5rem">
                        <Form.Control
                            type="date"
                            className="rounded-end"
                            name="dateDebut"
                            value={dates.dateDebut}
                            max={dates.dateFin || undefined}
                            onChange={handleSetDates}
                        />
                    </ChampAvecCroix>
                </Col>
                <Col xs={6} md={3}>
                    <ChampAvecCroix label="Au" valeur={dates.dateFin} onClear={() => retirerDate("dateFin")} decalage="2.5rem">
                        <Form.Control
                            type="date"
                            className="rounded-end"
                            name="dateFin"
                            value={dates.dateFin}
                            min={dates.dateDebut || undefined}
                            onChange={handleSetDates}
                        />
                    </ChampAvecCroix>
                </Col>
            </Row>

            <div className="d-flex align-items-center mb-2">
                {data && (
                    <span className="text-muted">
                        {data.total} sondage{data.total > 1 ? "s" : ""}{" "}
                        {isFetching && <Spinner size="sm" animation="border" />}
                    </span>
                )}
            </div>

            {isLoading ? (
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
            ) : isError ? (
                <Alert variant="danger">{error.message}</Alert>
            ) : sondages.length === 0 ? (
                <Card>
                    <Card.Body>
                        <Card.Text>Aucun sondage ne correspond à ta recherche.</Card.Text>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <Row xs={1} sm={2} lg={3} xl={4} className="g-3 mb-4">
                        {sondages.map((sondage) => (
                            <Col key={sondage.id}>
                                <SondageCard sondage={sondage} />
                            </Col>
                        ))}
                    </Row>
                    <PaginationFenetre page={page} pages={pages} onChange={setPage} />
                </>
            )}
        </Container>
    );
}

export default HistoriqueSondages;