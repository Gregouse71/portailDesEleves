import { useNavigate } from "react-router-dom";
import { Button, Container, Collapse } from "react-bootstrap";
import { ArrowLeft, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { useState } from "react";

import PermissionsManager from "../components/pages/PermissionsManager";
import UserCreation from "../components/pages/UserCreation";


export default function Admin() {
    const navigate = useNavigate();
    const [permissionsOpen, setPermissionsOpen] = useState(true);
    const [userCreationOpen, setUserCreationOpen] = useState(true);

    return (
        <Container className="py-4">
            <div className="d-flex align-items-center mb-4">
                <Button variant="outline-secondary" className="me-3" onClick={() => navigate("/direction")}>
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="mb-0">Panneau Administrateur</h1>
            </div>

            <div className="admin-section my-4">
                <h2 className="d-flex justify-content-between" onClick={() => setPermissionsOpen(!permissionsOpen)} style={{ cursor: "pointer" }}>
                    Gestion des permissions {permissionsOpen ? <ChevronUp /> : <ChevronDown />}
                </h2>
                <Collapse in={permissionsOpen}><div><PermissionsManager /></div></Collapse>
            </div>

            <div className="admin-section my-4">
                <h2 className="d-flex justify-content-between" onClick={() => setUserCreationOpen(!userCreationOpen)} style={{ cursor: "pointer" }}>
                    Ajout d'utilisateurs {userCreationOpen ? <ChevronUp /> : <ChevronDown />}
                </h2>
                <Collapse in={userCreationOpen}><div><UserCreation /></div></Collapse>
            </div>
        </Container>
    );
}