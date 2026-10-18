// src/components/blocs/BlocSondage.jsx
import { Card } from 'react-bootstrap';

export default function BlocTemplate({
    titre,
    contenu
}) {

    return (
        <Card className="bloc-global mb-3">
            <Card.Header as="h5" className="text-center">{titre}</Card.Header>
            <Card.Body className='d-flex flex-column'>
                {contenu}
            </Card.Body>
        </Card>
    );


}
