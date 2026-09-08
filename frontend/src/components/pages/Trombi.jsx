import { useState } from 'react';
import {
    obtenirListeDesPromos,
    obtenirFamilleUtilisateur,
    obtenirCheminEntreUtilisateurs,
} from '../../api/api_utilisateurs';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Tab, Nav, Row, Col } from 'react-bootstrap';
import '../../assets/styles/asso.scss';
import '../../assets/styles/trombi.scss';
import { useQuery } from '@tanstack/react-query';
import Autocomplete from '../elements/Autocompletion';
import GenealogyTree from '../elements/Genealogie';
import PageRandom from '../templates/pageRandom';

/** Onglet "Afficher la famille de ..." */
function OngletFamille() {
    const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);

    const { data: famille, isFetching } = useQuery({
        queryKey: ['familleUtilisateur', utilisateurSelectionne?.id],
        queryFn: () => obtenirFamilleUtilisateur(utilisateurSelectionne.id),
        enabled: !!utilisateurSelectionne,
    });

    return (
        <div className="py-3">
            <Autocomplete
                placeholder="Rechercher un utilisateur..."
                onSelect={setUtilisateurSelectionne}
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
    const [premier, setPremier] = useState(null);
    const [second, setSecond] = useState(null);
    const memeUtilisateur = premier && second && premier.id === second.id;

    const { data: resultat, isFetching } = useQuery({
        queryKey: ['cheminUtilisateurs', premier?.id, second?.id],
        queryFn: () => obtenirCheminEntreUtilisateurs(premier.id, second.id),
        enabled: !!premier && !!second && !memeUtilisateur,
    });

    return (
        <div className="py-3">
            <Row className="g-3">
                <Col md={6}>
                    <Autocomplete
                        placeholder="Premier utilisateur..."
                        onSelect={setPremier}
                    />
                </Col>
                <Col md={6}>
                    <Autocomplete
                        placeholder="Second utilisateur..."
                        onSelect={setSecond}
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
    const [sousOnglet, setSousOnglet] = useState('famille');

    const { data: listePromos = null, isLoading } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

    return <PageRandom
        titre="Trombinoscopes"
        sousTitre="Retrouvez ici tous les trombinoscopes"
        isLoading={isLoading}
        contenu={<>
            <Tabs defaultActiveKey="promotions" className="mb-3">
                <Tab eventKey="promotions" title="Promotions">
                    {listePromos === null ? (
                        <p>Chargement...</p>
                    ) : (
                        <div className="member-grid">
                            {listePromos.map((promo, index) => (
                                <Card
                                    onClick={() => navigate(`/trombi/get/${promo}`)}
                                    key={index}
                                    className="text-center trombi-card"
                                >
                                    <Card.Body>
                                        <Card.Title>{promo}</Card.Title>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Tab>

                <Tab eventKey="recherche" title="Graphe">
                    <Nav variant="pills" activeKey={sousOnglet} onSelect={setSousOnglet} className="mb-3">
                        <Nav.Item>
                            <Nav.Link eventKey="famille">Afficher la famille</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="lien">Lier deux personnes</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    {sousOnglet === 'famille' ? <OngletFamille /> : <OngletLien />}
                </Tab>
            </Tabs></>} />;
}

export default Trombi;