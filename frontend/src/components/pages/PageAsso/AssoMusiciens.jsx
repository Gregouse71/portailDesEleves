import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Form, ListGroup, Image, Row, Col } from "react-bootstrap";

import { getMusiciens } from "../../../api/modules/api_musiciens";
import { UPLOAD_BASE_URL } from "../../../api/base";
import "../../../assets/styles/search.scss";

/**
 * Normalise une chaîne de caractères (supprime les accents et met en minuscules).
 */
function normalizeString(str) {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export default function AssoMusiciens() {
    const [instrumentFilter, setInstrumentFilter] = useState("");
    const [sortBy, setSortBy] = useState("promo-desc");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["musiciens"],
        queryFn: () => getMusiciens(),
    });

    const musiciens = data?.musiciens || [];

    // Filtrer et trier la liste des musiciens
    const processedMusiciens = useMemo(() => {
        const normInst = normalizeString(instrumentFilter);

        // 1. Filtrage par instrument
        const filtered = musiciens.filter((m) => {
            if (!normInst) return true;
            return (m.instruments || []).some((inst) =>
                normalizeString(inst.name).includes(normInst)
            );
        });

        // 2. Tri (par défaut : Promo décroissante)
        return filtered.sort((a, b) => {
            if (sortBy === "promo-desc") {
                const promoA = parseInt(a.promotion, 10) || 0;
                const promoB = parseInt(b.promotion, 10) || 0;
                if (promoB !== promoA) return promoB - promoA;
                return (a.nom || "").localeCompare(b.nom || "");
            }

            if (sortBy === "promo-asc") {
                const promoA = parseInt(a.promotion, 10) || 0;
                const promoB = parseInt(b.promotion, 10) || 0;
                if (promoA !== promoB) return promoA - promoB;
                return (a.nom || "").localeCompare(b.nom || "");
            }

            if (sortBy === "instrument") {
                const getPrimaryInst = (user) => {
                    const insts = user.instruments || [];
                    if (normInst) {
                        const matched = insts.find((i) =>
                            normalizeString(i.name).includes(normInst)
                        );
                        if (matched) return matched.name;
                    }
                    const sorted = [...insts].sort((x, y) =>
                        (x.name || "").localeCompare(y.name || "")
                    );
                    return sorted[0]?.name || "";
                };
                const instA = getPrimaryInst(a);
                const instB = getPrimaryInst(b);
                const comp = instA.localeCompare(instB);
                if (comp !== 0) return comp;
                return (a.nom || "").localeCompare(b.nom || "");
            }

            // Tri par Nom (A-Z)
            const compNom = (a.nom || "").localeCompare(b.nom || "");
            if (compNom !== 0) return compNom;
            return (a.prenom || "").localeCompare(b.prenom || "");
        });
    }, [musiciens, instrumentFilter, sortBy]);

    return (
        <div className="search-results-container px-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">
                    Musiciens{" "}
                    {!isLoading && !isError && (
                        <small className="text-muted fs-6 fw-normal">
                            ({processedMusiciens.length})
                        </small>
                    )}
                </h2>
            </div>

            <Row className="g-2 mb-3 align-items-center">
                <Col xs={12} md={8}>
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Rechercher par instrument..."
                        value={instrumentFilter}
                        onChange={(e) => setInstrumentFilter(e.target.value)}
                    />
                </Col>
                <Col xs={12} md={4}>
                    <Form.Select
                        size="sm"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="promo-desc">Trier par : Promo (décroissante)</option>
                        <option value="promo-asc">Trier par : Promo (croissante)</option>
                        <option value="nom">Trier par : Nom (A-Z)</option>
                        <option value="instrument">Trier par : Instrument (A-Z)</option>
                    </Form.Select>
                </Col>
            </Row>

            {isLoading ? (
                <p>Chargement...</p>
            ) : isError ? (
                <p className="text-danger">Erreur lors du chargement des musiciens.</p>
            ) : processedMusiciens.length === 0 ? (
                <p className="text-muted">Aucun musicien trouvé.</p>
            ) : (
                <ListGroup>
                    {processedMusiciens.map((user) => {
                        const normInst = normalizeString(instrumentFilter);
                        return (
                            <ListGroup.Item
                                key={user.id}
                                as={Link}
                                to={`/utilisateur/${user.id}`}
                                className="d-flex align-items-center text-decoration-none p-2"
                                style={{ height: "75px" }}
                            >
                                <div className="me-3 h-100 d-flex align-items-center flex-shrink-0">
                                    <Image
                                        src={
                                            user.photo
                                                ? `${UPLOAD_BASE_URL}/${user.photo}`
                                                : "/assets/icons/group.svg"
                                        }
                                        alt={user.nom_utilisateur}
                                        className="mw-100 mh-100"
                                        onError={(e) => {
                                            e.target.src = "/assets/icons/group.svg";
                                        }}
                                    />
                                </div>

                                <div>
                                    <p className="mb-0">
                                        {user.prenom} {user.nom}{" "}
                                        <span className="text-muted">
                                            {user.cycle}
                                            {user.promotion}
                                        </span>
                                    </p>
                                    <p className="mb-0">
                                        {(user.instruments || []).map((inst, index) => {
                                            const isMatch =
                                                normInst &&
                                                normalizeString(inst.name).includes(normInst);
                                            return (
                                                <span key={index}>
                                                    <span className={"fw-bold " + (isMatch ? "text-primary" : "")}>
                                                        {inst.name}
                                                    </span>
                                                    {inst.niveau ? ` (${inst.niveau})` : ""}
                                                    {index < user.instruments.length - 1 ? ", " : ""}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            )}
        </div>
    );
}
