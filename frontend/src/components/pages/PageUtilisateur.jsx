import { obtenirDataUser, ajouterContenuUtilisateur, changerPhotoUtilisateur } from '../../api/api_utilisateurs';
import { useLayout } from '../../layouts/Layout';
import TabInfo from './PageUtilisateur/Info';
import TabAsso from './PageUtilisateur/Asso';
import TabQuestions from './PageUtilisateur/Question';
import { useParams, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { UPLOAD_BASE_URL } from '../../api/base';
import { Container, Row, Col, Card, Image, Nav } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import DropdownEditer from '../elements/DropdownEditer';

function PageUtilisateur() {
    const { userData } = useLayout();
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const changerPhoto = () => {
        document.getElementById('file-upload').click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (file) {
            try {
                const result = await ajouterContenuUtilisateur(id, file);
                if (result.success) {
                    await changerPhotoUtilisateur(id, result.fileName);
                    navigate(0);
                } else {
                    alert(`Erreur lors du téléversement : ${result.message}`);
                }
            } catch (error) {
                alert(`Erreur lors du téléversement : ${error.message}`);
            }
        }
    };

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
            <input
                type="file"
                id="file-upload"
                className="d-none"
                onChange={handleFileChange}
            />
            <Card className='mb-3'>
                <Card.Header
                    style={{
                        backgroundImage: `url(${UPLOAD_BASE_URL}/utilisateurs/minesvert.jpg)`,
                        height: '170px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                </Card.Header>
                <Card.Body>
                    <Row className="d-flex flex-column flex-md-row align-items-center justify-content-md-end">
                        {autoriseAModifier &&
                            <Col md="auto" className="text-center">
                                <DropdownEditer list={[
                                    { can: true, onClick: changerPhoto, name: "Changer la photo" },
                                ]} />
                            </Col>
                        }
                        <Col xs="auto" md="auto" className="order-md-last">
                            <Image
                                className="rounded-3"
                                src={`${UPLOAD_BASE_URL}/utilisateurs/${donneesUtilisateur.photo}`}
                                alt={donneesUtilisateur.nom_utilisateur}
                                rounded
                                style={{
                                    position: 'relative',
                                    top: '-170px',
                                    height: '200px',
                                    border: '2px solid white',
                                    marginBottom: '-170px'
                                }}
                            />
                        </Col>
                        <Col className="text-center text-md-end">
                            <h2>
                                {donneesUtilisateur.prenom} {donneesUtilisateur.surnom && <em>&quot;{donneesUtilisateur.surnom}&quot;</em>} {donneesUtilisateur.nom}
                                {<span style={{ fontSize: "0.7em" }}> {donneesUtilisateur.pronoms && <em>({donneesUtilisateur.pronoms})</em>}</span>}
                            </h2>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Nav variant="tabs" className="mb-3" activeKey={getActiveKey()}>
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