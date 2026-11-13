import { Button } from "react-bootstrap";
import { baptiserToutLeMonde } from "../../api/api_global";
import { useQueryClient } from "@tanstack/react-query";

export default function BaptemeManager() {
    const queryClient = useQueryClient();

    const baptiserTous = async () => {
        if (window.confirm("Voulez vous vraiment marquer tous les utilisateurs comme baptisés ?"))
            if (window.confirm("Vraiment ? Ils auront accès à la PR et au Baptême sur le portail ?"))
                if (window.confirm("Vraiment sûr ?")) {
                    await baptiserToutLeMonde();
                    queryClient.invalidateQueries(["permissions"]);
                }
    }

    return <>
        <Button variant="secondary" className="me-3" onClick={baptiserTous}>Baptiser tous les utilisateurs</Button>
    </>
}
