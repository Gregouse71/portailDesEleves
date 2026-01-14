import { obtenirDataUser } from '../../api/api_utilisateurs';
import { useLayout } from '../../layouts/Layout';
import TabInfo from './PageUtilisateur/Info';
import TabAsso from './PageUtilisateur/Asso';
import TabQuestions from './PageUtilisateur/Question';
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { UPLOAD_BASE_URL } from '../../api/base';
import { Container, Row, Col, Card, Image, Nav } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';

function PageUtilisateur() {
    const { userData } = useLayout();
    const { id } = useParams();
    const location = useLocation();

    const { data: donneesUtilisateur, isLoading } = useQuery({
        queryKey: ['donneesUtilisateur', id],
        queryFn: () => obtenirDataUser(id),
    });

    if (isLoading) { return (<p>Chargement...</p>); }

    const autoriseAModifier = userData.id == id || userData.is_superuser;

    // Helper to determine active tab based on URL path
    const getActiveKey = () => {
        if (location.pathname.includes('assos')) return 'assos';
        if (location.pathname.includes('questions')) return 'questions';
        return 'info';
    };

    return (
        <Container className="py-4">
            <Card>
                <Card.Header
                    style={{
                        backgroundImage: `url(${UPLOAD_BASE_URL}/utilisateurs/minesvert.jpg)`,
                        height: '170px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <Image
                        src={`${UPLOAD_BASE_URL}/utilisateurs/${donneesUtilisateur.photo}`}
                        alt={donneesUtilisateur.nom_utilisateur}
                        rounded
                        style={{
                            position: 'absolute',
                            top: 'calc(170px * 0.2)',
                            right: 'calc(170px * 0.2)',
                            width: 'calc(170px * 0.75)',
                            border: '5px solid white'
                        }}
                    />
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col>
                            <h2>
                                {donneesUtilisateur.prenom} {donneesUtilisateur.surnom && <em>&quot;{donneesUtilisateur.surnom}&quot;</em>} {donneesUtilisateur.nom}
                                {<span style={{ fontSize: "0.7em" }}> {donneesUtilisateur.pronoms && <em>({donneesUtilisateur.pronoms})</em>}</span>}
                            </h2>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Nav variant="tabs" className="my-3" activeKey={getActiveKey()}>
                <Nav.Item>
                    <Nav.Link key={1} as={Link} to={`/utilisateur/${id}`} eventKey="info">
                        Infos
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link key={2} as={Link} to={`/utilisateur/${id}/assos`} eventKey="assos">
                        Associations
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link key={3} as={Link} to={`/utilisateur/${id}/questions`} eventKey="questions">
                        Questions/Réponses
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            <Routes>
                <Route index={true} element={<TabInfo id={id} autoriseAModifier={autoriseAModifier} />} />
                <Route path="assos" element={<TabAsso id={id} />} />
                <Route path="questions" element={<TabQuestions id={id} autoriseAModifier={autoriseAModifier} />} />
            </Routes>
        </Container>
    );
}

export default PageUtilisateur;