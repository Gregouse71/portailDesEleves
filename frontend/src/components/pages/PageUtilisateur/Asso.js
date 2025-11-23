import '../../../assets/styles/liste_assos.scss';
import '../../../assets/styles/asso.scss';

import { Row, Col, Container } from "react-bootstrap";
import { obtenirAssosUtilisateur } from "../../../api/api_utilisateurs";
import AssoCard from "../../elements/AssoCard";
import { useQuery } from "@tanstack/react-query";


export default function TabAsso({ id }) {
    const { data: assos = {actuel: [], ancien: []} } = useQuery({
        queryKey: ['assosUser', id],
        queryFn: () => obtenirAssosUtilisateur(id).then(a => a),
    });

    return (<>
        <Container className="py-4">
            <h2>Assos actuelles</h2>
            <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 justify-content-center">
                {assos.actuel.map((asso) =>  (
                    <Col>
                        <AssoCard asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} />
                    </Col>
                ))}
            </Row>
        </Container>
        <Container className="py-4">
            <h2>Assos anciennes</h2>
            <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 justify-content-center">
                {assos.ancien.map((asso) => (
                    <Col>
                        <AssoCard asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} />
                    </Col>
                ))}
            </Row>
        </Container>
    </>);
}

