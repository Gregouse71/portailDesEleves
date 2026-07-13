import { Card, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { UPLOAD_BASE_URL } from "../../api/base";
import { useNavigate } from "react-router-dom";

export default function UserCard({
    user, isGestion, isModifying, additionnalText,
    modifyingTooltipText, t1, f1, t2, f2, values, validate
}) {
    const navigate = useNavigate();

    return (
        <Card key={user.id} className="text-center">
            <div className="position-relative">
                {isGestion && <>
                    <Button variant="danger" size="sm" className="position-absolute top-0 end-0" title={t1} onClick={f1} style={{ zIndex: 1 }}>
                        <img src="/assets/icons/delete.svg" alt="suppression du membre" />
                    </Button>
                    <Button variant="primary" size="sm" className="position-absolute top-0 start-0" title={t2} onClick={f2} style={{ zIndex: 1 }}>
                        <img src="/assets/icons/edit.svg" alt="modification de rôle" />
                    </Button>
                </>}
                <Card.Img
                    variant="top"
                    src={user.photo ? `${UPLOAD_BASE_URL}/${user.photo}` : ''}
                    alt={`${user.nom_utilisateur}`}
                    onClick={() => navigate(`/utilisateur/${user.id}`)}
                    style={{ cursor: "pointer" }}
                />
            </div>
            <Card.Body className="px-2">
                <Card.Title className="h6 bold">
                    {user.prenom} {user.nom} {additionnalText}{" "}
                </Card.Title>
                {user.role ? <hr /> : null}
                {!isModifying && <Card.Text className="small">{user.role}</Card.Text>}
                {isModifying && <>
                    {values.map((elt, i) =>
                        <Form.Group key={i} className="mb-2">
                            <Form.Label>{elt.label}</Form.Label>
                            {
                                elt.type === "checkbox"
                                    ? <Form.Check checked={elt.value} onChange={elt.onChange} />
                                    : <Form.Control value={elt.value} onChange={elt.onChange} />
                            }

                        </Form.Group>
                    )}
                    <Button variant="success" onClick={validate}>Valider</Button>
                </>}
            </Card.Body>
            {isGestion && !isModifying && <Card.Footer>Position : {user.position}</Card.Footer>}
        </Card>
    );
}