import { Card } from 'react-bootstrap';
import { obtenirProchainsAnnivs } from '../../api/api_utilisateurs';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import '../../assets/styles/anniv.scss'

export default function BlocAnniversaire() {
    const { data: annivs = [], error, isLoading } = useQuery({
        queryKey: ['prochainsAnniversaires'],
        queryFn: obtenirProchainsAnnivs,
    });

    if (isLoading) return <div>Chargement ...</div>;
    if (error) return <div>Impossible d'obtenir les anniversaires</div>;

    return <Card id="bloc-anniversaire" className="bloc-global">
        <Card.Header as="h5" className="text-center">Anniversaires</Card.Header>
        <Card.Body>
            {annivs.map(elt => {
                return (
                    <div key={elt[0]} className='mb-3'>
                        <p className='mb-0 fw-bold border-bottom pb-1 anniv-date-header'>{new Date(elt[0]).toLocaleString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}</p>
                        {elt[1].map(user => {
                            const prenom = user[0];
                            const nom = user[1];
                            const cycle = user[2];
                            const promo = user[3];
                            const id = user[4];
                            return <p className="mb-0" key={id}><Link
                                to={`/utilisateur/${id}`} className="user-link-text">
                                {prenom} {nom} <em>{cycle}{promo}</em>
                            </Link></p>
                        })}
                    </div>)
            })}
        </Card.Body>
    </Card>
}