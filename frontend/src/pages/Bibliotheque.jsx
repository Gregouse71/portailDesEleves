import "../assets/styles/bibliotheque.scss";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Modal, Tabs, Tab, ListGroup, Table, Badge } from "react-bootstrap";
import { ArrowLeft, PencilSquare, Trash } from "react-bootstrap-icons";

import {
    getListeLivres,
    ajouterLivre,
    modifierLivre,
    supprimerLivre,
    emprunterLivre,
    retournerLivre,
    listeEmprunts,
} from "../api/api_bibliotheque";
import Autocomplete from "../components/elements/Autocompletion";
import RenderPagination from "../components/elements/RenderPagination";

/** Formulaire de livre reutilise pour l'ajout et la modification */
function LivreFormModal({ show, onClose, title, submitLabel, initialValues, onSubmit, isPending, isError }) {
    const [form, setForm] = useState(initialValues);

    // Resynchronise le formulaire si on ouvre la modale sur un autre livre
    const [dernieresInitialValues, setDernieresInitialValues] = useState(initialValues);
    if (show && dernieresInitialValues !== initialValues) {
        setDernieresInitialValues(initialValues);
        setForm(initialValues);
    }

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
                    <Form.Group className="mb-2">
                        <Form.Label>Série *</Form.Label>
                        <Form.Control
                            required
                            value={form.serie}
                            onChange={(e) => setForm({ ...form, serie: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Tome</Form.Label>
                        <Form.Control
                            value={form.tome}
                            onChange={(e) => setForm({ ...form, tome: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Auteur</Form.Label>
                        <Form.Control
                            value={form.auteur}
                            onChange={(e) => setForm({ ...form, auteur: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Édition</Form.Label>
                        <Form.Control
                            value={form.edition}
                            onChange={(e) => setForm({ ...form, edition: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Référence</Form.Label>
                        <Form.Control
                            value={form.reference}
                            onChange={(e) => setForm({ ...form, reference: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>État</Form.Label>
                        <Form.Select
                            value={form.etat}
                            onChange={(e) => setForm({ ...form, etat: e.target.value })}
                        >
                            <option value="">—</option>
                            <option value="Neuf">Neuf</option>
                            <option value="Bon état">Bon état</option>
                            <option value="Usé">Usé</option>
                            <option value="Abîmé">Abîmé</option>
                        </Form.Select>
                    </Form.Group>
                    {isError && (
                        <p className="text-danger">Une erreur est survenue.</p>
                    )}
                    <Button type="submit" variant="success" disabled={isPending}>
                        {submitLabel}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

const LIVRE_VIDE = { serie: "", auteur: "", edition: "", tome: "", reference: "", etat: "" };

function AjouterLivreModal({ show, onClose, onAdded }) {
    const mutation = useMutation({
        mutationFn: (data) => ajouterLivre(data),
        onSuccess: () => { onAdded(); onClose(); }
    });

    return (
        <LivreFormModal
            show={show}
            onClose={onClose}
            title="Ajouter un livre"
            submitLabel={mutation.isPending ? "Ajout..." : "Ajouter"}
            initialValues={LIVRE_VIDE}
            onSubmit={(data) => mutation.mutate(data)}
            isPending={mutation.isPending}
            isError={mutation.isError}
        />
    );
}

function ModifierLivreModal({ livre, onClose, onModifie }) {
    const mutation = useMutation({
        mutationFn: (data) => modifierLivre(data, livre.id),
        onSuccess: () => { onModifie(); onClose(); }
    });

    if (!livre) return null;

    return (
        <LivreFormModal
            show={!!livre}
            onClose={onClose}
            title={`Modifier "${livre.serie}"`}
            submitLabel={mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            initialValues={{
                serie: livre.serie || "",
                auteur: livre.auteur || "",
                edition: livre.edition || "",
                tome: livre.tome || "",
                reference: livre.reference || "",
                etat: livre.etat || "",
            }}
            onSubmit={(data) => mutation.mutate(data)}
            isPending={mutation.isPending}
            isError={mutation.isError}
        />
    );
}

/** Onglet "Emprunter" : on cherche un livre disponible, puis un utilisateur */
function OngletEmprunt() {
    const queryClient = useQueryClient();
    const [bookQuery, setBookQuery] = useState("");
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const { data: livres = [], isLoading: loadingLivres } = useQuery({
        queryKey: ["rechercheLivresDispo", bookQuery],
        queryFn: () => getListeLivres({ query: bookQuery, disponible: true, per_page: 15 }).then(r => r.livres),
    });

    const emprunterMutation = useMutation({
        mutationFn: () => emprunterLivre({ livre_id: selectedBook.id, utilisateur_id: selectedUser.id }),
        onSuccess: () => {
            queryClient.invalidateQueries(["rechercheLivresDispo"]);
            setSelectedBook(null);
            setSelectedUser(null);
            setBookQuery("");
        }
    });

    if (!selectedBook) {
        return (
            <div className="biblio-tab-content">
                <Form.Control
                    autoFocus
                    placeholder="Rechercher un livre disponible (série, auteur, référence)..."
                    value={bookQuery}
                    onChange={(e) => setBookQuery(e.target.value)}
                    className="mb-3"
                />
                <ListGroup>
                    {livres.map(l => (
                        <ListGroup.Item key={l.id} action onClick={() => setSelectedBook(l)}>
                            <strong>{l.serie}</strong>{l.tome && ` — Tome ${l.tome}`}
                            {l.auteur && <span className="text-muted"> · {l.auteur}</span>}
                        </ListGroup.Item>
                    ))}
                    {!loadingLivres && livres.length === 0 && (
                        <div className="default-message">Aucun livre disponible trouvé.</div>
                    )}
                </ListGroup>
            </div>
        );
    }

    return (
        <div className="biblio-tab-content">
            <div className="biblio-selection-recap">
                <span>
                    Livre choisi : <strong>{selectedBook.serie}{selectedBook.tome ? ` — Tome ${selectedBook.tome}` : ""}</strong>
                </span>
                <Button variant="link" size="sm" onClick={() => { setSelectedBook(null); setSelectedUser(null); }}>
                    Changer de livre
                </Button>
            </div>

            {!selectedUser && (
                <Autocomplete
                    placeholder="Rechercher un utilisateur..."
                    onSelect={setSelectedUser}
                />
            )}

            {selectedUser && (
                <div className="biblio-selection-recap mt-3">
                    <span>Utilisateur : <strong>@{selectedUser.nom_utilisateur}</strong></span>
                    <Button variant="link" size="sm" onClick={() => setSelectedUser(null)}>
                        Changer d'utilisateur
                    </Button>
                </div>
            )}

            <Button
                variant="primary"
                className="mt-3"
                disabled={!selectedUser || emprunterMutation.isPending}
                onClick={() => emprunterMutation.mutate()}
            >
                {emprunterMutation.isPending ? "Emprunt en cours..." : "Emprunter"}
            </Button>
        </div>
    );
}

/** Onglet "Retourner" : on cherche un utilisateur, puis ses emprunts en cours */
function OngletRetour() {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedEmprunt, setSelectedEmprunt] = useState(null);

    const { data: empruntsData = { emprunts: [] }, isLoading: loadingEmprunts } = useQuery({
        queryKey: ["empruntsEnCours", selectedUser?.id],
        queryFn: () => listeEmprunts({ utilisateur_id: selectedUser.id, en_cours_seulement: true, per_page: 100 }),
        enabled: !!selectedUser,
    });

    const retournerMutation = useMutation({
        mutationFn: () => retournerLivre({ livre_id: selectedEmprunt.livre_id }),
        onSuccess: () => {
            queryClient.invalidateQueries(["empruntsEnCours"]);
            setSelectedEmprunt(null);
        }
    });

    if (!selectedUser) {
        return (
            <div className="biblio-tab-content">
                <Autocomplete
                    placeholder="Rechercher un utilisateur..."
                    onSelect={setSelectedUser}
                />
            </div>
        );
    }

    return (
        <div className="biblio-tab-content">
            <div className="biblio-selection-recap">
                <span>Utilisateur : <strong>@{selectedUser.nom_utilisateur}</strong></span>
                <Button
                    variant="link"
                    size="sm"
                    onClick={() => { setSelectedUser(null); setSelectedEmprunt(null); }}
                >
                    Changer d'utilisateur
                </Button>
            </div>

            <ListGroup className="mt-3">
                {empruntsData.emprunts.map(e => (
                    <ListGroup.Item
                        key={e.id}
                        action
                        active={selectedEmprunt?.id === e.id}
                        onClick={() => setSelectedEmprunt(e)}
                    >
                        {e.livre_nom} — emprunté le {new Date(e.date_emprunt).toLocaleDateString('fr-FR')}
                    </ListGroup.Item>
                ))}
                {!loadingEmprunts && empruntsData.emprunts.length === 0 && (
                    <div className="default-message">Aucun emprunt en cours pour cet utilisateur.</div>
                )}
            </ListGroup>

            <Button
                variant="success"
                className="mt-3"
                disabled={!selectedEmprunt || retournerMutation.isPending}
                onClick={() => retournerMutation.mutate()}
            >
                {retournerMutation.isPending ? "Retour en cours..." : "Rendre"}
            </Button>
        </div>
    );
}

/** Onglet "Gestion" : recherche parmi tous les livres, ajout/modification/suppression */
function OngletGestion() {
    const queryClient = useQueryClient();
    const PER_PAGE = 20;
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [showAjout, setShowAjout] = useState(false);
    const [livreAModifier, setLivreAModifier] = useState(null);

    const { data = { livres: [], count: 0 }, isLoading } = useQuery({
        queryKey: ["gestionLivres", query, page],
        queryFn: () => getListeLivres({ query, page, per_page: PER_PAGE }),
        placeholderData: (previousData) => previousData,
    });
    const totalPages = Math.ceil(data.count / PER_PAGE);

    const invalidate = () => {
        queryClient.invalidateQueries(["gestionLivres"]);
        queryClient.invalidateQueries(["rechercheLivresDispo"]);
    };

    const supprimerMutation = useMutation({
        mutationFn: (id) => supprimerLivre(id),
        onSuccess: invalidate,
        onError: () => window.alert("Impossible de supprimer ce livre (peut-être encore emprunté ?)."),
    });

    const handleSupprimer = (livre) => {
        if (window.confirm(`Supprimer "${livre.serie}${livre.tome ? " - Tome " + livre.tome : ""}" ?`)) {
            supprimerMutation.mutate(livre.id);
        }
    };

    return (
        <div className="biblio-tab-content biblio-tab-content-large">
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                <Form.Control
                    placeholder="Rechercher une série, un auteur, une référence..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    style={{ maxWidth: "400px" }}
                />
                <Button variant="success" onClick={() => setShowAjout(true)}>
                    + Ajouter un livre
                </Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Série</th>
                        <th>Tome</th>
                        <th>Auteur</th>
                        <th>Référence</th>
                        <th>État</th>
                        <th>Statut</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && (
                        <tr><td colSpan="7">Chargement...</td></tr>
                    )}
                    {!isLoading && data.livres.length === 0 && (
                        <tr><td colSpan="7" className="text-center text-muted py-3">Aucun livre trouvé.</td></tr>
                    )}
                    {data.livres.map(livre => (
                        <tr key={livre.id}>
                            <td>{livre.serie}</td>
                            <td>{livre.tome}</td>
                            <td>{livre.auteur}</td>
                            <td>{livre.reference}</td>
                            <td>{livre.etat}</td>
                            <td>
                                {livre.disponible ? (
                                    <Badge bg="success">Disponible</Badge>
                                ) : (
                                    <Badge bg="danger">Emprunté{livre.emprunt ? ` (${livre.emprunt.utilisateur})` : ""}</Badge>
                                )}
                            </td>
                            <td className="text-center">
                                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => setLivreAModifier(livre)}>
                                    <PencilSquare />
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={!livre.disponible}
                                    title={!livre.disponible ? "Impossible de supprimer un livre emprunté" : "Supprimer"}
                                    onClick={() => handleSupprimer(livre)}
                                >
                                    <Trash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex" />

            <AjouterLivreModal show={showAjout} onClose={() => setShowAjout(false)} onAdded={invalidate} />
            <ModifierLivreModal livre={livreAModifier} onClose={() => setLivreAModifier(null)} onModifie={invalidate} />
        </div>
    );
}

export default function Bibliotheque() {
    const navigate = useNavigate();

    return (
        <div className="biblio-container">
            <div className="biblio-header">
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                    <ArrowLeft className="me-1" /> Retour
                </Button>
                <h2 className="mb-0">Bibliothèque</h2>
                <div />
            </div>

            <Tabs defaultActiveKey="emprunt" className="biblio-tabs mt-3 mb-3">
                <Tab eventKey="emprunt" title="Emprunter">
                    <OngletEmprunt />
                </Tab>
                <Tab eventKey="retour" title="Retourner">
                    <OngletRetour />
                </Tab>
                <Tab eventKey="gestion" title="Gestion">
                    <OngletGestion />
                </Tab>
            </Tabs>
        </div>
    );
}