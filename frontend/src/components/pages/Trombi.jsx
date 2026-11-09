import {
    obtenirListeDesPromos,
    obtenirFamilleUtilisateur,
    obtenirCheminEntreUtilisateurs,
} from '../../api/api_utilisateurs';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Nav, Row, Col } from 'react-bootstrap';
import '../../assets/styles/trombi.scss';
import { useQuery } from '@tanstack/react-query';
import Autocomplete from '../elements/Autocompletion';
import GenealogyTree from '../elements/Genealogie';
import PageRandom from '../templates/PageRandom';
import TabTemplate from '../templates/TabTemplate';

/** Onglet "Afficher la famille de ..." */
function OngletFamille() {
    const [searchParams, setSearchParams] = useSearchParams();
    const idUtilisateur = Number(searchParams.get('id')) || null;

    const { data: famille, isFetching } = useQuery({
        queryKey: ['familleUtilisateur', idUtilisateur],
        queryFn: () => obtenirFamilleUtilisateur(idUtilisateur),
        enabled: !!idUtilisateur,
    });

    const nomUtilisateur = famille?.noeuds?.find((n) => n.id === idUtilisateur)?.nom_complet || '';

    const handleSelect = (utilisateur) => {
        const params = new URLSearchParams(searchParams);
        params.set('id', utilisateur.id);
        setSearchParams(params);
    };

    return (
        <div className="py-3">
            <Autocomplete
                key={nomUtilisateur || 'famille'}
                placeholder="Rechercher un utilisateur..."
                valeurInitiale={nomUtilisateur}
                estSelectionInitial={true}
                onSelect={handleSelect}
            />

            {isFetching && <p className="mt-3">Chargement de l&apos;arbre généalogique...</p>}

            {!isFetching && famille && (
                <div className="mt-4">
                    <GenealogyTree noeuds={famille.noeuds} liens={famille.liens} />
                </div>
            )}
        </div>
    );
}

/** Onglet "Lier ... et ..." */
function OngletLien() {
    const [searchParams, setSearchParams] = useSearchParams();
    const idPremier = Number(searchParams.get('premier')) || null;
    const idSecond = Number(searchParams.get('second')) || null;
    const memeUtilisateur = idPremier && idSecond && idPremier === idSecond;

    const { data: resultat, isFetching } = useQuery({
        queryKey: ['cheminUtilisateurs', idPremier, idSecond],
        queryFn: () => obtenirCheminEntreUtilisateurs(idPremier, idSecond),
        enabled: !!idPremier && !!idSecond && !memeUtilisateur,
    });

    const nomPremier = resultat?.noeuds?.find((n) => n.id === idPremier)?.nom_complet || '';
    const nomSecond = resultat?.noeuds?.find((n) => n.id === idSecond)?.nom_complet || '';

    const handleSelectPremier = (utilisateur) => {
        const params = new URLSearchParams(searchParams);
        params.set('mode', 'lien');
        params.set('premier', utilisateur.id);
        setSearchParams(params);
    };

    const handleSelectSecond = (utilisateur) => {
        const params = new URLSearchParams(searchParams);
        params.set('mode', 'lien');
        params.set('second', utilisateur.id);
        setSearchParams(params);
    };

    return (
        <div className="py-3">
            <Row className="g-3">
                <Col md={6}>
                    <Autocomplete
                        key={nomPremier || 'premier'}
                        placeholder="Premier utilisateur..."
                        valeurInitiale={nomPremier}
                        estSelectionInitial={true}
                        onSelect={handleSelectPremier}
                    />
                </Col>
                <Col md={6}>
                    <Autocomplete
                        key={nomSecond || 'second'}
                        placeholder="Second utilisateur..."
                        valeurInitiale={nomSecond}
                        estSelectionInitial={true}
                        onSelect={handleSelectSecond}
                    />
                </Col>
            </Row>

            {isFetching && <p className="mt-3">Recherche du chemin le plus court...</p>}

            {!isFetching && resultat && resultat.chemin?.length === 0 && (
                <p className="mt-3 text-muted">Aucun lien trouvé entre ces deux utilisateurs.</p>
            )}

            {memeUtilisateur && (
                <p className="mt-3 text-muted">Waouh ! Mais qu&apos;est-ce que t&apos;es drôle ! S&apos;agirait de grandir un peu...</p>
            )}

            {!isFetching && resultat && resultat.chemin?.length > 0 && (
                <div className="mt-4">
                    <GenealogyTree
                        noeuds={resultat.noeuds}
                        liens={resultat.liens}
                        noeudsChemin={resultat.chemin}
                    />
                </div>
            )}
        </div>
    );
}

function Trombi() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const sousOnglet = searchParams.get('mode') === 'lien' ? 'lien' : 'famille';

    const changerSousOnglet = (nouvelOnglet) => {
        const params = new URLSearchParams(searchParams);
        params.set('mode', nouvelOnglet);
        setSearchParams(params);
    };

    const { data: listePromos = null, isLoading } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

    const getActiveKey = () => {
        if (location.pathname.includes('chemin')) return 'chemin';
        return 'promos';
    };

    return <PageRandom
        titre="Trombinoscopes"
        sousTitre="Retrouvez ici tous les trombinoscopes"
        isLoading={isLoading}
        contenu={<TabTemplate
            activeKey={getActiveKey()}
            tabs={[
                {
                    titre: "Trombis des promotions", path: `/trombi`, key: "promos", index: true,
                    element: <>{listePromos === null ? (
                        <p>Chargement...</p>
                    ) : (
                        <div className="avatars-grid">
                            {listePromos.map((promo, index) => (
                                <Card
                                    onClick={() => navigate(`/trombi/get/${promo}`)}
                                    key={index}
                                    className="text-center trombi-card interactive-card"
                                >
                                    <Card.Body>
                                        <Card.Title>{promo}</Card.Title>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}</>
                },
                {
                    titre: "Graphes des mineurs", path: `/trombi/chemin`, key: "chemin",
                    element: <>
                        <Nav variant="pills" activeKey={sousOnglet} onSelect={changerSousOnglet} className="mb-3">
                            <Nav.Item>
                                <Nav.Link eventKey="famille">Afficher la famille</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="lien">Lier deux personnes</Nav.Link>
                            </Nav.Item>
                        </Nav>

                        {sousOnglet === 'famille' ? <OngletFamille /> : <OngletLien />}
                    </>
                },
            ]}
        />} />;
}

export default Trombi;