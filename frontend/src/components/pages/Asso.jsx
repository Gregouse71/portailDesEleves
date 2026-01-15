import '../../assets/styles/asso.scss';
import { chargerAsso, estUtilisateurDansAsso, ajouterContenu, changerPhoto } from './../../api/api_associations';
import AssoInfo from './PageAsso/AssoInfo';
import AssoMembres from './PageAsso/AssoMembres';
import AssoEvents from './PageAsso/AssoEvents';
import AssoPosts from './PageAsso/AssoPosts';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { UPLOAD_BASE_URL } from '../../api/base';
import { Container, Row, Col, Nav, Image, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import AssoElection from './PageAsso/AssoElection';
import DropdownEditer from "../elements/DropdownEditer";

function Asso() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const changerPhotoLogoOuBanniere = (type_photo) => {
        document.getElementById('file-upload').setAttribute("data-type", type_photo);
        document.getElementById('file-upload').click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        const type_photo = event.target.getAttribute("data-type");

        if (file) {
            try {
                const result = await ajouterContenu(id, file);
                if (result.success) {
                    await changerPhoto(id, type_photo, result.fileName);
                    navigate(0);
                } else {
                    alert(`Erreur lors du téléversement : ${result.message}`);
                }
            } catch (error) {
                alert(`Erreur lors du téléversement : ${error.message}`);
            }
        }
    };

    const { data: asso = null } = useQuery({
        queryKey: ['asso', id],
        queryFn: () => { return chargerAsso(id) },
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', id],
        queryFn: () => { return estUtilisateurDansAsso(id) },
    });

    if (asso === null || membreData.is_membre === null) return <p>Chargement...</p>;

    const bannerStyle = {
        backgroundImage: asso.banniere_path ? `url(${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.banniere_path})` : 'none',
    };

    const tabs = [
        { key: "", titre: "Infos", element: <AssoInfo id={asso.id} /> },
        { key: "events", titre: "Événements", element: <AssoEvents asso_id={asso.id} /> },
        { key: "members", titre: "Membres", element: <AssoMembres asso_id={asso.id} /> },
        { key: "posts", titre: "Publications", element: <AssoPosts asso_id={asso.id} /> },
        ...asso.elections ? [{ key: "elections", titre: "Élections", element: <AssoElection asso_id={asso.id} /> }] : []
    ]

    const currentPath = location.pathname.split('/').pop();
    const activeKey = currentPath === id ? "" : currentPath;

    return (
        <Container>
            <input
                type="file"
                id="file-upload"
                className="d-none"
                onChange={handleFileChange}
                data-type=""
            />
            <Row>
                <Col xs={12} className="p-0">
                    <div className="position-relative">
                        <div className="asso-banner rounded-top" style={bannerStyle}>
                            {membreData.autorise && (
                                <div className="position-absolute top-0 end-0 m-2">
                                    <DropdownEditer list={[
                                        { can: true, onClick: () => changerPhotoLogoOuBanniere('logo'), name: "Changer le logo" },
                                        { can: true, onClick: () => changerPhotoLogoOuBanniere('banniere'), name: "Changer la bannière" },
                                    ]}
                                    />
                                </div>)}
                        </div>
                    </div>
                </Col>
            </Row>

            <div className="asso-main-content p-3 rounded-bottom">
                <Row>
                    <Col md={3} className="text-center text-md-start">
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <Image
                                src={asso.img ? `${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}` : '/assets/icons/group.svg'}
                                alt={asso.nom}
                                className="asso-logo rounded-3"
                                style={{ backgroundColor: "white" }}
                            />
                        </div>
                    </Col>
                    <Col md={9} className="d-flex align-items-center justify-content-center justify-content-md-start mt-3 mt-md-0">
                        <h2>{asso.nom}</h2>
                        {membreData.is_membre && <Badge className="asso-member-badge ms-3">membre</Badge>}
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col xs={12}>
                        <Nav variant="tabs" className="mb-3" activeKey={activeKey}>
                            {tabs.map((elt, ind) =>
                                <Nav.Item key={ind}>
                                    <Nav.Link as={Link} eventKey={elt.key} to={`/assos/get/${id}/${elt.key}`}                                    >
                                        {elt.titre}
                                    </Nav.Link>
                                </Nav.Item>
                            )}
                        </Nav>

                        <Routes>
                            {tabs.map((elt, ind) => (
                                <Route key={elt.key} index={ind === 0}
                                    path={ind === 0 ? undefined : elt.key} element={elt.element}
                                />
                            ))}
                        </Routes>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default Asso;
