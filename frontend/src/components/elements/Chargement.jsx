import { Container, Spinner } from "react-bootstrap";


export default function Chargement() {
    return (
        <Container className="py-4 text-center">
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
            </Spinner>
        </Container>
    );
}