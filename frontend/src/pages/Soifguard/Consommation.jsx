import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Image } from "react-bootstrap";
import {
    getListeConsos,
    encaisserAsso,
    ajouterConso,
    supprimerConso,
    toggleCotisation,
    crediterAsso,
    derniersUtilisateurs,
} from "../../api/api_soifguard";
import { searchUsers } from "../../api/api_utilisateurs";
import DropdownEditer from "../../components/elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../../api/base";

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
    });

    const cotizMutation = useMutation({
        mutationFn: async ({ asso, id }) => {
            await toggleCotisation({ asso }, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['searchResults', query]);
            queryClient.invalidateQueries(['lastUtilisateurs']);
        }
    });

    const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const estCotisantIci = user.cotisations.some((c) => normalize(c.asso) === normalize(categorie));

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
                        name: estCotisantIci ? <>Ne cotise pas</> : <>Cotise</>
                    },
                    { can: perms, onClick: () => setIsCrediting(!isCrediting), name: "Créditer le compte" },
                ]}
            />
        </div>
        <div className="d-flex align-items-center">
            <Image
                className="rounded-3"
                src={`${UPLOAD_BASE_URL}/${user.photo}`}
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
                    {estCotisantIci && <span className="soifguard-cotisant-badge">Cotisant</span>}
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
            <Button onClick={(e) => { e.stopPropagation(); mutation.mutate(); }}>Valider</Button>
        </Form>}
    </div>;
}

export default function Consommation({ categorie, perms }) {
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nomConso, setNomConso] = useState("");
    const [prix, setPrix] = useState("");
    const [prixCotisant, setPrixCotisant] = useState("");
    const [gestionConsos, setGestionConsos] = useState(false);
    const [query, setQuery] = useState("");

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedConso, setSelectedConso] = useState(null);

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

    const jouerSon = () => {
        const audio = new Audio("/assets/sons/encaisser.mp3");
        audio.play();
    };

    useEffect(() => {
        const encaisserEtRafraichir = async () => {
            if (selectedUser && selectedConso) {
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
            queryClient.invalidateQueries(['consos']);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, asso }) => {
            await supprimerConso(id);
            return { id, asso };
        },
        onSuccess: ({ id, asso }) => {
            queryClient.setQueryData(["consos"], {
                ...consos, [asso]: consos[asso].filter(e => e.id != id)
            });
        }
    });

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        queryClient.invalidateQueries(['searchResults', e.target.value]);
    };

    let content = consos[categorie]?.length > 0 ? (
        consos[categorie].map((conso) => (
            <div
                key={conso.id}
                className={`soifguard-grid-item ${selectedConso === conso.id ? "soifguard-selected" : ""}`}
                onClick={() => setSelectedConso(selectedConso ? null : conso.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedConso(conso.id); }}
            >
                <strong>{conso.nom_conso}</strong> - {parseFloat(conso.prix).toFixed(2)}€ {conso.prix_cotisant !== null && <span> ({parseFloat(conso.prix_cotisant).toFixed(2)}€)</span>}

                {gestionConsos && (
                    <button
                        className="soifguard-btn-remove"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate({ id: conso.id, asso: categorie });
                        }}
                    >
                        Supprimer
                    </button>
                )}
            </div>
        ))
    ) : (
        <p>Aucune consommation disponible.</p>
    );

    return <>
        <div className="main-content">
            <div className="left-section">
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
    </>;
}
