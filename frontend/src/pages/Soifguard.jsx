import "../assets/styles/soifguard.scss";
import { useState, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import {
    getListeConsos,
    obtenirDetteMaxi,
    verifierPermission,
    encaisserAsso,
    ajouterConso,
    supprimerConso,
    toggleCotisation,
    listeOperations,
    crediterAsso
} from "../api/api_soifguard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { searchUsers } from "../api/api_utilisateurs";
import { Button, Dropdown, Form, Table, Pagination } from "react-bootstrap";

const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
};

const PER_PAGE = 20;

function Operations({ categorie }) {
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState("")
    const { data = { operations: [], count: 0 }, isLoading } = useQuery({
        queryKey: ['operations', categorie, page, query],
        queryFn: () => listeOperations({ page: page, per: PER_PAGE, asso: categorie, query: query }),
        placeholderData: (previousData) => previousData,
    });
    const { operations, count } = data;
    const totalPages = Math.ceil(count / PER_PAGE);

    return <div className="main-content flex-column">
        <div className="d-flex justify-content-between align-items-center w-100 mb-3">
            <h2>Dernières opérations</h2>
            <Form onSubmit={e => { e.preventDefault(); }}>
                <Form.Group>
                    <Form.Control type="text" name="query" placeholder="Rechercher"
                        value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
                </Form.Group>
            </Form>
            {totalPages > 1 && (
                <Pagination className="mb-0">
                    <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                    <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} />

                    {page > 3 && <Pagination.Ellipsis disabled />}

                    {Array.from({ length: 5 }, (_, i) => page - 2 + i)
                        .filter(p => p > 0 && p <= totalPages)
                        .map(p => (
                            <Pagination.Item
                                key={p}
                                active={p === page}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </Pagination.Item>
                        ))
                    }

                    {page < totalPages - 2 && <Pagination.Ellipsis disabled />}

                    <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
                    <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
                </Pagination>
            )}
        </div>
        <div>
            <Table responsive hover >
                <thead key="header">
                    <tr className="fw-bold align-items-center">
                        <th>Date</th>
                        <th>Utilisateur</th>
                        <th>Auteur</th>
                        <th>Somme</th>
                        <th>Solde avant</th>
                        <th>Solde après</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && operations.length === 0 ?
                        <tr>
                            <td colSpan="3">Chargement...</td>
                        </tr>
                        :
                        operations.map((elt, i) => <tr key={i} className="align-items-start">
                            <td>{formatDate(elt.date)}</td>
                            <td>{elt.utilisateur}</td>
                            <td>{elt.auteur}</td>
                            <td>{elt.somme}</td>
                            <td>{elt.solde_avant}</td>
                            <td>{elt.solde_apres}</td>
                        </tr>
                        )}
                </tbody >
            </Table>
        </div>
    </div>
}

function User({ user, isSelected, select, categorie, query }) {
    const queryClient = useQueryClient();
    const [isCrediting, setIsCrediting] = useState(false);
    const [somme, setSomme] = useState(0);

    const mutation = useMutation({
        mutationFn: async () => {
            await crediterAsso({ id_utilisateur: user.id, somme: parseFloat(somme) }, categorie);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['searchResults', query]);
            setIsCrediting(false);
            setSomme(0);
        }
    })

    const cotizMutation = useMutation({
        mutationFn: async ({ asso, id }) => {
            await toggleCotisation({ asso }, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['searchResults', query])
        }
    })

    return <div
        key={user.id}
        className={`soifguard-grid-item ${isSelected ? "soifguard-selected" : ""}`}  // Appliquer la classe de surbrillance
        onClick={select}  // Clic pour sélectionner/désélectionner
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') select(); }}
    >
        <div className="d-flex justify-content-between align-items-center">
            <strong>{user.prenom} {user.nom}</strong>
            <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0">
                <Dropdown align="end" onClick={(e) => { e.stopPropagation(); }}>
                    <Dropdown.Toggle as="div" className="no-caret p-0 border-0 bg-transparent" style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
                        ⋮
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item key="cotiz" onClick={() => cotizMutation.mutate({ id: user.id, asso: categorie })}>
                            {user[`est_cotisant_${categorie}`] ? <>Ne cotise pas</> : <>Cotise</>}
                        </Dropdown.Item>
                        <Dropdown.Item key="credit" onClick={() => setIsCrediting(!isCrediting)}>
                            Créditer le compte
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>

        <br />
        {isCrediting && <Form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); mutation.mutate(); }}>
            <Form.Group>
                <Form.Label>Somme à créditer :</Form.Label>
                <Form.Control type="number" onChange={(e) => setSomme(e.target.value)} onClick={(e) => e.stopPropagation()}></Form.Control>
            </Form.Group>
            <Button onClick={(e) => { e.stopPropagation(); mutation.mutate() }}>Valider</Button>
        </Form>}
        {categorie === "octo" && <span>Solde Octo : {user.solde_octo}€</span>}
        {categorie === "biero" && <span>Solde Biero : {user.solde_biero}€</span>}
        {user[`est_cotisant_${categorie}`] ? <span className="soifguard-cotisant-badge">Cotisant</span> : null}
    </div>
}

function Consommation({ categorie }) {
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nomConso, setNomConso] = useState("");
    const [prix, setPrix] = useState("");
    const [prixCotisant, setPrixCotisant] = useState("");
    const [gestionConsos, setGestionConsos] = useState(false);
    const [query, setQuery] = useState("")

    // Encaissement
    // Etat pour l'utilisateur sélectionné
    const [selectedUser, setSelectedUser] = useState(null);
    // pour la conso
    const [selectedConso, setSelectedConso] = useState(null); // Etat pour la consommation sélectionnée


    const { data: consos = { "octo": [], "biero": [] } } = useQuery({
        queryKey: ['consos'],
        queryFn: () => getListeConsos(),
    });
    const { data: utilisateurs = [] } = useQuery({
        queryKey: ['searchResults', query],
        queryFn: () => searchUsers({ query, limit: 30 }),
        enabled: !!query
    });


    // Fonction pour jouer le son
    const jouerSon = () => {
        const audio = new Audio("/assets/sons/encaisser.mp3");
        audio.play();
    };

    useEffect(() => {
        // Vérifie si un utilisateur et une conso sont sélectionnés
        const encaisserEtRafraichir = async () => {
            if (selectedUser && selectedConso) {
                // Encaissement
                await encaisserAsso({ id_utilisateur: selectedUser, id_conso: selectedConso }, categorie);
                jouerSon();

                setSelectedUser(null);
                setSelectedConso(null);
                queryClient.invalidateQueries(['searchResults', query])
            }
        };

        encaisserEtRafraichir();
    }, [selectedUser, selectedConso, categorie, query, queryClient]);

    const addMutation = useMutation({
        mutationFn: async ({ nom_conso, prix, prix_cotisant, asso }) => {
            const prixCotisantValue = prix_cotisant === "" ? null : parseFloat(prixCotisant);
            const prixValue = parseFloat(prix);

            await ajouterConso({ nom_conso, prix: prixValue, prix_cotisant: prixCotisantValue, asso });

            setIsModalOpen(false);
            setNomConso("");
            setPrix("");
            setPrixCotisant("");
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['consos'])
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, asso }) => {
            await supprimerConso(id);
            return { id, asso }
        },
        onSuccess: ({ id, asso }) => {
            queryClient.setQueryData(["consos"], {
                ...consos, [asso]: consos[asso].filter(e => e.id != id)
            })
        }
    });

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        queryClient.invalidateQueries(['searchResults', e.target.value])
    }

    let content = consos[categorie]?.length > 0 ? (
        consos[categorie].map((conso) => (
            <div
                key={conso.id}
                className={`soifguard-grid-item ${selectedConso === conso.id ? "soifguard-selected" : ""}`}  // Appliquer la classe de surbrillance
                onClick={() => setSelectedConso(conso.id)}  // Clic pour sélectionner/désélectionner
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedConso(conso.id); }}
            >
                <strong>{conso.nom_conso}</strong> - {parseFloat(conso.prix).toFixed(2)}€
                {conso.prix_cotisant !== null && <span> ({parseFloat(conso.prix_cotisant).toFixed(2)}€ cotisant)</span>}

                {/* Affichage des boutons de modification et suppression */}
                {gestionConsos && (
                    <>
                        <button
                            className="soifguard-btn-remove"
                            onClick={(e) => {
                                e.stopPropagation();  // Empêcher le clic sur le bouton de sélectionner la conso
                                deleteMutation.mutate({ id: conso.id, asso: categorie });
                            }}
                        >
                            Supprimer
                        </button>
                    </>
                )}
            </div>
        ))
    ) : (
        <p>Aucune consommation disponible.</p>
    )

    return <>
        <div className="main-content">
            {/* SECTION GAUCHE - Utilisateurs */}
            <div className="left-section">
                {/* Sous-header du bloc utilisateurs */}
                <div className="soifguard-user-header">
                    <h2>Utilisateurs</h2>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <Form.Group>
                            <Form.Control type="text" name="query" placeholder="Rechercher"
                                value={query} onChange={handleQueryChange} />
                        </Form.Group>
                    </Form>
                </div>
                {utilisateurs.length > 0 ?
                    <div className="soifguard-grid-container">
                        {utilisateurs.map((user) => (<User key={user.id} isSelected={user.id === selectedUser} user={user} select={() => setSelectedUser(user.id)} categorie={categorie} query={query} />))}
                    </div>
                    : (
                        <p>Aucun utilisateur ne correspond à la recherche.</p>
                    )}
            </div>

            <div className={`right-section ${categorie}`}>
                <h2>Consos {categorie && `(${categorie})`}</h2>
                {/* HEADER POUR GÉRER LES CONSOS */}
                {categorie && (
                    <div className="consos-header">
                        <button onClick={() => setGestionConsos(!gestionConsos)}>
                            {gestionConsos ? "Sauvegarder et quitter" : "Gérer les consos"}
                        </button>
                    </div>
                )}
                {categorie === "" ? (
                    <p className="default-message">Veuillez sélectionner Octo ou Biero</p>
                ) : (
                    <div className="soifguard-grid-container">
                        {content}
                        <div className="soifguard-grid-item soifguard-add-item" onClick={() => setIsModalOpen(true)}>
                            + Ajouter
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* MODAL D'AJOUT DE CONSO */}
        {isModalOpen && (
            <Form className="soifguard-modal">
                <div className="soifguard-modal-content">
                    <button className="soifguard-close-btn" onClick={() => setIsModalOpen(false)}>X</button>
                    <h2>Ajouter une consommation</h2>
                    <Form.Group>
                        <Form.Label>Nom de la conso :</Form.Label>
                        <Form.Control type="text" value={nomConso} onChange={(e) => setNomConso(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Prix :</Form.Label>
                        <Form.Control type="number" value={nomConso} onChange={(e) => setPrix(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Prix cotisant (optionnel) :</Form.Label>
                        <Form.Control type="number" value={nomConso} onChange={(e) => setPrixCotisant(e.target.value)}></Form.Control>
                    </Form.Group>

                    <Button variant="success" disabled={!prix || !nomConso} onClick={() => addMutation.mutate({
                        nom_conso: nomConso, prix: prix, prix_cotisant: prixCotisant, asso: categorie
                    })}
                    >Ajouter</Button>
                </div>
            </Form>
        )}
    </>
}

export default function SoifGuard() {
    const navigate = useNavigate();
    const [categorie, setCategorie] = useState("");
    const [mode, setMode] = useState("conso");

    // pour les permissions de lancer octo ou biero
    const { data: octoPermission = false } = useQuery({
        queryKey: ['permOcto'],
        queryFn: () => verifierPermission("octo"),
    });
    const { data: bieroPermission = false } = useQuery({
        queryKey: ['permBiero'],
        queryFn: () => verifierPermission("biero"),
    });
    const { data: detteMaxiOcto = false } = useQuery({
        queryKey: ['detteOcto'],
        queryFn: () => obtenirDetteMaxi("octo"),
    });
    const { data: detteMaxiBiero = false } = useQuery({
        queryKey: ['detteBiero'],
        queryFn: () => obtenirDetteMaxi("biero"),
    });

    const toggleMode = () => {
        setMode(mode === "conso" ? "operations" : "conso");
        navigate(mode === "conso" ? "/soifguard/operations" : "/soifguard")
    }


    return (
        <div className="soifguard-container">
            {/* HEADER */}
            <div className="header">
                <button onClick={() => navigate("/direction")}>Retour au portail</button>
                <h1>SoifGuard</h1>

                {mode === "conso" && <>
                    {categorie === "octo" &&
                        (detteMaxiOcto !== null ? (
                            <p>Dette maximale autorisée : {detteMaxiOcto}€</p>
                        ) : (
                            <p>Aucun plafond de dette</p>
                        ))
                    }
                    {categorie === "biero" &&
                        (detteMaxiBiero !== null ? (
                            <p>Dette maximale autorisée : {detteMaxiBiero}€</p>
                        ) : (
                            <p>Aucun plafond de dette</p>
                        ))
                    }
                </>
                }

                <Button onClick={toggleMode}>
                    {mode === "conso" ? "Opérations" : "Consommation"}
                </Button>

                <div className="header-buttons">
                    {/* Bouton Octo : affiché seulement si l'utilisateur a la permission */}
                    {octoPermission && (
                        <button
                            onClick={() => setCategorie("octo")}
                            className={categorie === "octo" ? "octo-active" : ""}
                        >
                            Octo
                        </button>
                    )}

                    {/* Bouton Biero : affiché seulement si l'utilisateur a la permission */}
                    {bieroPermission && (
                        <button
                            onClick={() => setCategorie("biero")}
                            className={categorie === "biero" ? "biero-active" : ""}
                        >
                            Biero
                        </button>
                    )}
                </div>
            </div>
            <Routes>
                <Route index element={<Consommation categorie={categorie} />} />
                <Route path="operations" element={<Operations categorie={categorie} />} />
            </Routes>
        </div>
    );
}
