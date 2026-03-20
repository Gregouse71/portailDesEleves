import { useNavigate } from "react-router-dom";
import { Button, Container, Collapse } from "react-bootstrap";
import { ArrowLeft, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { useState } from "react";

import PermissionsManager from "../components/pages/PermissionsManager";
import UserCreation from "../components/pages/UserCreation";
import BaptemeManager from "../components/pages/BaptemeManager";


export default function Admin() {
    const navigate = useNavigate();
    const [baptemeOpen, setBaptemeOpen] = useState(true);
    const [permissionsOpen, setPermissionsOpen] = useState(true);
    const [userCreationOpen, setUserCreationOpen] = useState(true);

    const sections = [
        { title: "Gestion du baptême", element: BaptemeManager, isOpen: baptemeOpen, trigger: setBaptemeOpen },
        { title: "Gestion des permissions", element: PermissionsManager, isOpen: permissionsOpen, trigger: setPermissionsOpen },
        { title: "Ajout d'utilisateurs", element: UserCreation, isOpen: userCreationOpen, trigger: setUserCreationOpen },
    ]

    return (
        <Container className="py-4">
            <div className="d-flex align-items-center mb-4">
                <Button variant="outline-secondary" className="me-3" onClick={() => navigate("/direction")}>
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="mb-0">Panneau Administrateur</h1>
            </div>

            {sections.map((u, i) =>
                <div key={i} className="admin-section my-4">
                <Button
                    variant="h2"
                    className="d-flex justify-content-between admin-section-header"
                    onClick={() => u.trigger(!u.isOpen)}
                    onKeyDown={() => u.trigger(!u.isOpen)}
                >
                    <h2>{u.title} {u.isOpen ? <ChevronUp /> : <ChevronDown />}</h2>
                </Button>
                    <Collapse in={u.isOpen}><div><u.element /></div></Collapse>
                </div>
            )}
        </Container>
    );
}