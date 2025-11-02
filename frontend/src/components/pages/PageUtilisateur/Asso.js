import '../../../assets/styles/liste_assos.scss';
import '../../../assets/styles/asso.scss';

import { Row, Col, Container } from "react-bootstrap";
import { obtenirAssosUtilisateur } from "../../../api/api_utilisateurs";
import { useNavigate } from "react-router-dom";
import AssoCard from "../../elements/AssoCard";
import { useQuery } from "@tanstack/react-query";


export default function TabAsso({ id }) {
    const navigate = useNavigate();

    const { data: assos = {associations_actuelles: [], associations_anciennes: []}, error } = useQuery({
        queryKey: ['assosUser', id],
        queryFn: () => obtenirAssosUtilisateur(id),
    });

    return (<>
        <Container className="py-4">
            <h2>Assos actuelles</h2>
            <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 justify-content-center">
                {assos.associations_actuelles.map((asso) => (
                    <Col>
                        <AssoCard asso={asso} />
                    </Col>
                ))}
            </Row>
        </Container>
        <Container className="py-4">
            <h2>Assos anciennes</h2>
            <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 justify-content-center">
                {assos.associations_anciennes.map((asso) => (
                    <AssoCard asso={asso} />
                ))}
            </Row>
        </Container>
    </>);
}

