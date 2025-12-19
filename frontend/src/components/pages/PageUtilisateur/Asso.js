import '../../../assets/styles/liste_assos.scss';
import '../../../assets/styles/asso.scss';

import { Container } from "react-bootstrap";
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
            <h2>Associations actuelles</h2>
            <div className="asso-grid">
                {assos.actuel.map((asso) =>  (
                    <AssoCard key={asso.asso_id} asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} isEditMode={false} onEditAsso={() => {}} />
                ))}
            </div>
        </Container>
        <Container className="py-4">
            <h2>Anciennes associations</h2>
            <div className="asso-grid">
                {assos.ancien.map((asso) => (
                    <AssoCard key={asso.asso_id} asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} isEditMode={false} onEditAsso={() => {}} />
                ))}
            </div>
        </Container>
    </>);
}

