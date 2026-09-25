import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Row, Col, Card, Table, Button, Form, Alert, Badge } from "react-bootstrap";
import { listerCles, creerCle, revoquerCle } from "../../../api/api_cles";

// Onglet « Clé API » de son propre profil : gestion des clés d'API personnelles
// (brique annuaire). Réservé aux 2A+ côté serveur ; la valeur en clair n'est
// affichée qu'UNE fois à la création (seul son sha256 est conservé).

export default function TabCleApi({ autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [nouveauNom, setNouveauNom] = useState("");
    const [valeurCreee, setValeurCreee] = useState(null);
    const [erreur, setErreur] = useState(null);

    const { data: donneesCles, isPending } = useQuery({
        queryKey: ['cles'],
        queryFn: () => listerCles({}),
    });

    const creation = useMutation({
        mutationFn: (nom) => creerCle({ nom }),
        onSuccess: (data) => {
            setValeurCreee(data.valeur);
            setNouveauNom("");
            setErreur(null);
            queryClient.invalidateQueries({ queryKey: ['cles'] });
        },
        onError: (e) => setErreur(e.message),
    });

    const revocation = useMutation({
        mutationFn: (id) => revoquerCle({}, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cles'] }),
        onError: (e) => setErreur(e.message),
    });

    if (!autoriseAModifier) return null;
    if (isPending) return <p>Chargement...</p>;

    const cles = donneesCles?.cles ?? [];
    const eligible = donneesCles?.eligible ?? false;

    const copier = async () => {
        try {
            await navigator.clipboard.writeText(valeurCreee);
        } catch (_) { /* clipboard indisponible : la clé reste affichée */ }
    };

    return (
        <Row>
            <Col md={{ span: 10, offset: 1 }}>
                <Card className="mb-3">
                    <Card.Header><b>Ma clé API</b> — accès à l&apos;annuaire des élèves</Card.Header>
                    <Card.Body>
                        <p className="text-muted small">
                            Une clé personnelle permet aux outils des élèves (equipaps, Pain de Mine...)
                            de récupérer la base élèves depuis le portail : identifiant, login, prénom,
                            nom, email, promotion. La clé est affichée <b>une seule fois</b> à la création,
                            garde-la précieusement, et révoque-la si elle fuit.
                        </p>

                        {!eligible && (
                            <Alert variant="info" className="mb-0">
                                Les clés API sont disponibles à partir de la deuxième année. Reviens en 2A !
                            </Alert>
                        )}

                        {eligible && valeurCreee && (
                            <Alert variant="success">
                                <Alert.Heading>Clé créée — copie-la maintenant !</Alert.Heading>
                                <p className="mb-2">
                                    Elle ne sera <b>plus jamais affichée</b> :
                                    <code className="ms-2 user-select-all">{valeurCreee}</code>
                                </p>
                                <Button size="sm" onClick={copier}>Copier</Button>
                                <Button size="sm" variant="outline-secondary" className="ms-2"
                                    onClick={() => setValeurCreee(null)}>J&apos;ai copié ma clé</Button>
                            </Alert>
                        )}

                        {erreur && <Alert variant="danger" onClose={() => setErreur(null)} dismissible>{erreur}</Alert>}

                        {eligible && (
                            <Form className="d-flex gap-2 mb-3" onSubmit={(e) => {
                                e.preventDefault();
                                creation.mutate(nouveauNom);
                            }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Nom de la clé (ex : equipaps prod)"
                                    value={nouveauNom}
                                    onChange={(e) => setNouveauNom(e.target.value)}
                                    maxLength={100}
                                />
                                <Button type="submit" disabled={creation.isPending}>
                                    {creation.isPending ? "Création..." : "Créer une clé"}
                                </Button>
                            </Form>
                        )}

                        {eligible && (
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Créée le</th>
                                        <th>Dernière utilisation</th>
                                        <th>Appels</th>
                                        <th>Statut</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cles.map((cle) => (
                                        <tr key={cle.id} className={cle.revoked ? "text-muted" : ""}>
                                            <td>{cle.nom}</td>
                                            <td>{cle.created_at?.slice(0, 10)}</td>
                                            <td>{cle.last_used_at?.slice(0, 10) ?? "jamais"}</td>
                                            <td>{cle.use_count ?? 0}</td>
                                            <td>
                                                {cle.revoked
                                                    ? <Badge bg="secondary">révoquée</Badge>
                                                    : <Badge bg="success">active</Badge>}
                                            </td>
                                            <td>
                                                {!cle.revoked && (
                                                    <Button size="sm" variant="outline-danger"
                                                        disabled={revocation.isPending}
                                                        onClick={() => revocation.mutate(cle.id)}>
                                                        Révoquer
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {cles.length === 0 && (
                                        <tr><td colSpan={6} className="text-center text-muted">Aucune clé pour l&apos;instant.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}
