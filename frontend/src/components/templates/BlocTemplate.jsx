import { Card } from 'react-bootstrap';

export default function BlocTemplate({
    titre,
    children
}) {

    return (
        <Card className="bloc-global mb-4">
            <Card.Header as="h5" className="bloc-header">{titre}</Card.Header>
            <Card.Body className='d-flex flex-column'>
                {children}
            </Card.Body>
        </Card>
    );
}
