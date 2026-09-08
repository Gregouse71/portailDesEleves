import { Container } from "react-bootstrap";
import '../../assets/styles/jeux2048.scss';

export default function JeuxTemplate({
    titre,
    contenu
}) {
    return <Container className="jeux-2048-container py-4">
        <h1 className="mb-3">{titre}</h1>
        {contenu}
    </Container>;
}
