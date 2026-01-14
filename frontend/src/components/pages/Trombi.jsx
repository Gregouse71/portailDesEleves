import { obtenirListeDesPromos } from '../../api/api_utilisateurs';
import { useNavigate } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';
import '../../assets/styles/asso.scss';
import '../../assets/styles/trombi.scss';
import { useQuery } from '@tanstack/react-query';

function Trombi() {
    const navigate = useNavigate();

    const { data: listePromos = null } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });


    if (listePromos === null) {
        return <p>Chargement...</p>;
    }

    return (
        <Container className="py-4">
            <h1>Trombinoscopes</h1>
            <div className="member-grid">
                {listePromos.map((promo, index) => (
                    <Card onClick={() => navigate(`/trombi/get/${promo}`)} key={index} className="text-center trombi-card">
                        <Card.Body>
                            <Card.Title>{promo}</Card.Title>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </Container>
    );
}

export default Trombi;