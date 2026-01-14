import { Button } from "react-bootstrap";

export default function BoutonEditer({ onClick }) {
    return (
        <Button variant="primary" className="float-end" onClick={onClick}>
            <img src="/assets/icons/edit.svg" alt="Editer" /> Éditer
        </Button>
    );
}
