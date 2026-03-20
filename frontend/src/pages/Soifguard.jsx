import "../assets/styles/soifguard.scss";
import { useState, useEffect, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import {
    getListeConsos,
    // obtenirDetteMaxi,
    encaisserAsso,
    ajouterConso,
    supprimerConso,
    toggleCotisation,
    listeOperations,
    crediterAsso,
    getPermissionsSoifguard,
    addPermissionsSoifguard,
    deletePermissionsSoifguard,
    derniersUtilisateurs,
    listeUtilisateurs,
    exportListeUtilisateurs
} from "../api/api_soifguard";
import { verifierPermission } from "../api/api_global";
import RenderPagination from "../components/elements/RenderPagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chargerUtilisateurs, obtenirDataUser, searchUsers } from "../api/api_utilisateurs";
import { Button, Form, Table, Pagination, InputGroup, FormControl, Image } from "react-bootstrap";
import { useProtected } from "../Protected";
import Select from "react-select";
import DropdownEditer from "../components/elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../api/base";

const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
};

function UserList({ id, categorie }) {
    const { data: user, isLoading } = useQuery({
        queryKey: ['donneesUtilisateurs', id],
        queryFn: () => obtenirDataUser(id)
    });

    if (isLoading) return <></>
    return <tr>
        <td>{user.prenom}</td>
        <td>{user.nom}</td>
        <td>{user.cycle}{user.promotion}</td>
        <td>
            {categorie === "octo" && `${user.solde_octo}€`}
            {categorie === "biero" && `${user.solde_biero}€`}
        </td>
    </tr>
}

function Liste({ categorie }) {
    const [perPage, setPerPage] = useState(20);
    const [page, setPage] = useState(1);
    const [orderBy, setOrderBy] = useState("promotion"); // Default order by name
    const [orderAsc, setOrderAsc] = useState(false); // Now settable
    const [query, setQuery] = useState("");

    const { data = { utilisateurs: [], count: 0 }, isLoading } = useQuery({
        queryKey: ['soifguardListe', categorie, page, perPage, query, orderAsc, orderBy],
        queryFn: () => listeUtilisateurs({ page: page, perPage, asso: categorie, query: query, orderBy, orderAsc }),
        placeholderData: (previousData) => previousData,
    });
    const { utilisateurs, count } = data;
    const totalPages = Math.ceil(count / perPage);

    const handleSort = (column) => {
        if (orderBy === column) {
            setOrderAsc(!orderAsc);
        } else {
            setOrderBy(column);
            setOrderAsc(true);
        }
        setPage(1);
    };

    const getSortIndicator = (column) => {
        if (orderBy === column) {
            return orderAsc ? ' ▲' : ' ▼';
        }
        return '';
    };

    return <div className="main-content flex-column">
        <h2>Liste des utilisateurs</h2>
        <div style={{ maxWidth: '900px', minWidth: '700px', margin: '0 auto' }}>
            <div className="d-flex flex-md-row flex-column align-items-center mb-3">
                <Form onSubmit={e => { e.preventDefault(); }} className="w-100 me-2">
                    <Form.Group>
                        <Form.Control
                            type="text"
                            name="query"
                            placeholder="Rechercher"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        />
                    </Form.Group>
                </Form>

                <Form.Select
                    className="w-auto"
                    value={perPage}
                    onChange={(e) => {
                        setPerPage(Number(e.target.value)); setPage(1);
                    }}
                    aria-label="Éléments par page"
                >
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </Form.Select>
                <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex mb-0 ms-2" />
                <Button variant="success" onClick={() => exportListeUtilisateurs({ asso: categorie, query, orderBy, orderAsc })} className="ms-2">
                    Exporter CSV
                </Button>
            </div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th style={{ width: '30%' }} onClick={() => handleSort('prenom')}>Prénom{getSortIndicator('prenom')}</th>
                        <th style={{ width: '30%' }} onClick={() => handleSort('nom')}>Nom{getSortIndicator('nom')}</th>
                        <th style={{ width: '15%' }} onClick={() => handleSort('promotion')}>Promotion{getSortIndicator('promotion')}</th>
                        <th style={{ width: '15%' }} onClick={() => handleSort('solde')}>Solde{getSortIndicator('solde')}</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && utilisateurs.length === 0 ?
                        <tr>
                            <td colSpan="4">Chargement...</td>
                        </tr>
                        :
                        utilisateurs.map(u => <UserList key={u} id={u} categorie={categorie} />)
                    }
                    {!isLoading && utilisateurs.length === 0 && (
                        <tr>
                            <td colSpan="4">Aucun utilisateur trouvé.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    </div>
}



function PermissionUser({ perm, deleteMe }) {
    return <>
        <tr>
            <td>{perm.utilisateur}</td>
            <td>{perm.permission}</td>
            <td>
                <Button size="sm" variant="danger" onClick={deleteMe}>
                    Supprimer
                </Button>
            </td>
        </tr>
    </>
}

function Permissions({ categorie }) {
    const PER_PAGE = 30;
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState();
    const [permission, setPermission] = useState("");

    const { data: allUsers = [] } = useQuery({
        queryKey: ["allUsers"],
        queryFn: () => chargerUtilisateurs(),
    });
    const options = allUsers.map(u => ({ value: u.id, label: u.nom_utilisateur }));

    const { data = { permissions: [], count: 0 } } = useQuery({
        queryKey: ["permissionsSoifguard", categorie, page, query],
        queryFn: () => getPermissionsSoifguard({ page, per_page: PER_PAGE, query, asso: categorie }),
        placeholderData: (previousData) => previousData,
    });
    const { permissions, count } = data;
    const totalPages = Math.ceil(count / PER_PAGE);


    const addMutation = useMutation({
        mutationFn: async (perm) => {
            await addPermissionsSoifguard({ user_id: selectedUser.value, permission: perm })
            return
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissionsSoifguard", categorie]);
            return
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async id => {
            await deletePermissionsSoifguard(id)
            return
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissionsSoifguard", categorie]);
        }
    });

    return <div className="main-content flex-column">
        <div className="justify-content-between align-items-center w-100 mb-3">
            <h2>Permissions</h2>
            <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex mb-0" />
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Permissions</th>
                        <th>
                            <InputGroup>
                                <FormControl
                                    placeholder="Filtre"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                />
                            </InputGroup>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><Form>
                            <Select options={options} value={selectedUser} onChange={setSelectedUser}
                                isClearable classNamePrefix="react-select"
                            />
                        </Form></td>
                        <td><Form>
                            <Form.Select
                                style={{ width: 'auto' }}
                                value={permission}
                                onChange={(e) => setPermission(e.target.value)}
                                aria-label="Permission"
                            >
                                <option value="">Sélectionner</option>
                                <option value={`${categorie}`}>Soifguard</option>
                                <option value={`admin_${categorie}`}>Admin</option>
                            </Form.Select>
                        </Form></td>
                        <td><Button variant="info" onClick={() => addMutation.mutate(permission)} disabled={!selectedUser && permission !== ""}>
                            Ajouter
                        </Button></td>
                    </tr>
                    {permissions.map((perm, i) => (
                        <PermissionUser key={i} perm={perm} deleteMe={() => deleteMutation.mutate(perm.id)} />
                    ))}
                </tbody>
            </Table>
        </div>
    </div>
}

function Operations({ categorie }) {
    const PER_PAGE = 30;
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
                        <th>Libellé</th>
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
                            <td>{elt.libelle}</td>
                            <td>{elt.solde_avant}</td>
                            <td>{elt.solde_apres}</td>
                        </tr>
                        )}
                </tbody >
            </Table>
        </div>
    </div>
}

function User({ user, isSelected, select, categorie, query, perms }) {
    const queryClient = useQueryClient();
    const [isCrediting, setIsCrediting] = useState(false);
    const [somme, setSomme] = useState(0);

    const mutation = useMutation({
        mutationFn: async () => {
            await crediterAsso({ id_utilisateur: user.id, somme: somme }, categorie);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['searchResults', query]);
            queryClient.invalidateQueries(['lastUtilisateurs']);
            setIsCrediting(false);
            setSomme(0);
        }
    })

    const cotizMutation = useMutation({
        mutationFn: async ({ asso, id }) => {
            await toggleCotisation({ asso }, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['searchResults', query]);
            queryClient.invalidateQueries(['lastUtilisateurs']);
        }
    })

    return <div
        key={user.id}
        className={`soifguard-grid-item ${isSelected ? "soifguard-selected" : ""}`}
        onClick={select}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') select(); }}
        style={{ position: 'relative' }}
    >
        <div className="position-absolute top-0 end-0 m-2">
            <DropdownEditer
                list={[
                    {
                        can: true, onClick: () => cotizMutation.mutate({ id: user.id, asso: categorie }),
                        name: user[`est_cotisant_${categorie}`] ? <>Ne cotise pas</> : <>Cotise</>
                    },
                    { can: perms, onClick: () => setIsCrediting(!isCrediting), name: "Créditer le compte" },
                ]}
            />
        </div>
        <div className="d-flex align-items-center">
            <Image
                className="rounded-3"
                src={`${UPLOAD_BASE_URL}/utilisateurs/${user.photo}`}
                alt={user.nom_utilisateur}
                rounded
                style={{
                    height: '100px',
                    border: '2px solid white'
                }}
            />
            <div className="ms-3 me-5">
                <div className="fw-bold">{user.prenom} {user.nom} P{user.promotion}</div>
                <div>
                    {user[`est_cotisant_${categorie}`] ? <span className="soifguard-cotisant-badge">Cotisant</span> : null}
                    <span className="ms-2">
                        {categorie === "octo" && `${user.solde_octo}€`}
                        {categorie === "biero" && `${user.solde_biero}€`}
                    </span>
                </div>
            </div>
        </div>
        {isCrediting && <Form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); mutation.mutate(); }}>
            <Form.Group>
                <Form.Label>Somme à créditer :</Form.Label>
                <Form.Control type="text" inputMode="decimal" onChange={(e) => setSomme(e.target.value.replace(',', '.'))} onClick={(e) => e.stopPropagation()}></Form.Control>
            </Form.Group>
            <Button onClick={(e) => { e.stopPropagation(); mutation.mutate() }}>Valider</Button>
        </Form>}
    </div>
}

function Consommation({ categorie, reset, perms }) {
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
        queryFn: () => getListeConsos({}),
    });
    const { data: chercheUtilisateurs = [] } = useQuery({
        queryKey: ['searchResults', query],
        queryFn: () => searchUsers({ query, limit: 30 }),
        enabled: !!query
    });
    const { data: lastUtilisateurs = [] } = useQuery({
        queryKey: ['lastUtilisateurs'],
        queryFn: () => derniersUtilisateurs({ limit: 10, asso: categorie }),
        enabled: !query
    });

    const utilisateurs = chercheUtilisateurs.length > 0 ? chercheUtilisateurs : lastUtilisateurs;

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
                queryClient.invalidateQueries(['searchResults', query]);
                queryClient.invalidateQueries(['lastUtilisateurs']);
            }
        };

        encaisserEtRafraichir();
    }, [selectedUser, selectedConso, categorie, query, queryClient]);

    useEffect(() => {
        if (selectedUser !== null || selectedConso !== null) {
            setTimeout(() => {
                setSelectedUser(null);
                setSelectedConso(null);
            }, 0);
        }
    }, [reset, selectedUser, selectedConso])

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
                onClick={() => setSelectedConso(selectedConso ? null : conso.id)}  // Clic pour sélectionner/désélectionner
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedConso(conso.id); }}
            >
                <strong>{conso.nom_conso}</strong> - {parseFloat(conso.prix).toFixed(2)}€ {conso.prix_cotisant !== null && <span> ({parseFloat(conso.prix_cotisant).toFixed(2)}€)</span>}

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
                        {utilisateurs.map((user) => (
                            <User key={user.id} isSelected={user.id === selectedUser} user={user}
                                select={() => setSelectedUser(selectedUser ? null : user.id)} categorie={categorie}
                                query={query} perms={perms} />)
                        )}
                    </div>
                    : (
                        <p>Aucun utilisateur ne correspond à la recherche.</p>
                    )}
            </div>

            <div className={`right-section ${categorie}`}>
                <div className="soifguard-user-header">
                    <h2>Consos</h2>
                    {categorie && <p><strong>Nom</strong> - Prix (Prix cotisant)</p>}
                    {perms && <DropdownEditer list={[
                        { can: true, onClick: () => setGestionConsos(!gestionConsos), name: "Modifier" },
                    ]}
                    />}
                </div>
                {categorie === "" ? (
                    <p className="default-message">Veuillez sélectionner Octo ou Biero</p>
                ) : (
                    <div className="soifguard-grid-container">
                        {content}
                        {gestionConsos && perms && <div role="button" tabIndex={0} className="soifguard-grid-item soifguard-add-item" onClick={() => setIsModalOpen(true)} onKeyDown={() => setIsModalOpen(true)}>
                            + Ajouter
                        </div>}
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
                        <Form.Control type="number" value={prix} onChange={(e) => setPrix(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Prix cotisant (optionnel) :</Form.Label>
                        <Form.Control type="number" value={prixCotisant} onChange={(e) => setPrixCotisant(e.target.value)}></Form.Control>
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
    const { userData } = useProtected();
    const navigate = useNavigate();
    const [categorie, setCategorie] = useState();
    const initializedRef = useRef(false);
    const [mode, setMode] = useState("conso");
    const [reset, setReset] = useState(false);

    // pour les permissions de lancer octo ou biero
    const { data: octoPermission = false } = useQuery({
        queryKey: ['permOcto'],
        queryFn: () => verifierPermission({}, "octo", userData.id),
    });
    const { data: bieroPermission = false } = useQuery({
        queryKey: ['permBiero'],
        queryFn: () => verifierPermission({}, "biero", userData.id),
    });
    const { data: octoAdminPermission = false } = useQuery({
        queryKey: ['permAdminOcto'],
        queryFn: () => verifierPermission({}, "admin_octo", userData.id),
    });
    const { data: bieroAdminPermission = false } = useQuery({
        queryKey: ['permAdminBiero'],
        queryFn: () => verifierPermission({}, "admin_biero", userData.id),
    });

    useEffect(() => {
        if (initializedRef.current) return;

        if ((octoPermission || octoAdminPermission) && !(bieroPermission || bieroAdminPermission)) {
            setTimeout(() => {
                setCategorie("octo");
                initializedRef.current = true;
            }, 0);
        } else if ((bieroPermission || bieroAdminPermission) && !(octoPermission || octoAdminPermission)) {
            setTimeout(() => {
                setCategorie("biero");
                initializedRef.current = true;
            }, 0);
        }
    }, [octoPermission, octoAdminPermission, bieroPermission, bieroAdminPermission]);

    const changeMode = (e) => {
        const newMode = e.target.value;
        if (!["conso", "operations", "permissions", "liste"].includes(newMode)) return

        setMode(newMode);
        switch (newMode) {
            case "conso": navigate("/soifguard"); break;
            case "liste": navigate("/soifguard/liste"); break;
            case "operations": navigate("/soifguard/operations"); break;
            case "permissions": navigate("/soifguard/permissions"); break;
            default: return;
        }
    }

    const changeCategorie = (cat) => {
        setCategorie(cat);
        setReset(!reset)
    }

    return (
        <div className="soifguard-container">
            {/* HEADER */}
            <div className="header">
                <Button variant="secondary" onClick={() => navigate("/direction")} className="center">Retour</Button>
                <h1>SoifGuard {categorie && `(${categorie})`}</h1>

                {/* {mode === "conso" && <>
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
                } */}

                {((categorie === "biero" && bieroAdminPermission) || (categorie === "octo" && octoAdminPermission))
                    &&
                    <Form.Select
                        style={{ width: 'auto' }}
                        value={mode}
                        onChange={changeMode}
                        aria-label="Mode"
                    >
                        <option value="conso">Consommation</option>
                        <option value="liste">Liste</option>
                        <option value="operations">Historique</option>
                        <option value="permissions">Permissions</option>
                    </Form.Select>}

                <div className="header-buttons">
                    {/* Bouton Octo : affiché seulement si l'utilisateur a la permission */}
                    {(octoPermission || octoAdminPermission) && (
                        <Button
                            onClick={() => changeCategorie("octo")}
                            variant={categorie === "octo" ? "primary" : "secondary"}
                        >
                            Octo
                        </Button>
                    )}

                    {/* Bouton Biero : affiché seulement si l'utilisateur a la permission */}
                    {(bieroPermission || bieroAdminPermission) && (
                        <Button
                            onClick={() => changeCategorie("biero")}
                            variant={categorie === "biero" ? "warning" : "secondary"}
                        >
                            Biero
                        </Button>
                    )}
                </div>
            </div>
            <Routes>
                <Route index element={
                    <Consommation categorie={categorie} reset={reset}
                        perms={(categorie === "octo" && octoAdminPermission) || (categorie === "biero" && bieroAdminPermission)}
                    />} />
                <Route path="liste" element={categorie ? <Liste categorie={categorie} /> : <></>} />
                <Route path="operations" element={categorie ? <Operations categorie={categorie} /> : <></>} />
                <Route path="permissions" element={categorie ? <Permissions categorie={categorie} /> : <></>} />
            </Routes>
        </div>
    );
}
