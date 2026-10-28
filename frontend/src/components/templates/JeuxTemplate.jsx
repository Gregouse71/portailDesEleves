import { Container } from "react-bootstrap";
import '../../assets/styles/jeux2048.scss';

export default function JeuxTemplate({
    titre,
    contenu,
    classeContainer = "jeux-2048-container",
    fluid = false
}) {
    return <Container fluid={fluid} className={`${classeContainer} py-2`}>
        <h1 className="mb-3">{titre}</h1>
        {contenu}
    </Container>;
}
