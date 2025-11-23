import { Container, Form, InputGroup } from "react-bootstrap";
import { Col, Row } from 'react-bootstrap';
import { obtenirScoresSondages } from "../../../api/api_sondages";
import UserCard from "../../elements/UserCard";
import { useQuery } from "@tanstack/react-query";


export default function ClassementSondage() {
    const { data: data = {recent: [[], []], global: [[], []]}  } = useQuery({
        queryKey: ['scoresSondages'],
        queryFn: obtenirScoresSondages,
    });

    return <>
        <Container className="mt-4">
            <h1>Classement des sondage</h1>
            <h2>Classement récent</h2>
            Calculé avec de coefficients en exponentielle décroissante sur les votes par date.
            <Col>
                {data.recent[0].map((user) => (
                    <Row key={user.nom_utilisateur}>
                        {user.nom_utilisateur} : {user.score_recent ? user.score_recent : "0"}
                    </Row>
                ))}
            </Col>
            <Col>
                {data.recent[1].map((user) => (
                    <Row key={user.nom_utilisateur}>
                        {user.nom_utilisateur} : {user.score_recent ? user.score_recent : "0"}
                    </Row>
                ))}
            </Col>
            <h2>Classement global</h2>
            Calculé grâce à l'intervalle de confiance à 95% d'une gaussienne.
            <Col>
                {data.global[0].map((user) => (
                    <Row key={user.nom_utilisateur}>
                        {user.nom_utilisateur} : {user.score_global_con ? user.score_global_con : "0"}
                    </Row>
                ))}
            </Col>
            <Col>
                {data.global[1].map((user) => (
                    <Row key={user.nom_utilisateur}>
                        {user.nom_utilisateur} : {user.score_global_div ? user.score_global_div : "0"}
                    </Row>
                ))}
            </Col>
        </Container>
    </>;
}