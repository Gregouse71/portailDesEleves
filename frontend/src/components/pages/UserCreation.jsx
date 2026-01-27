import "../../assets/styles/admin.scss";
import { useState } from "react";
import { Button, Form, Table, Row, Col, Card, Alert, InputGroup } from "react-bootstrap";
import {
    PersonPlus,
    CloudUpload,
    FileEarmarkSpreadsheet,
    Person,
    Envelope,
    Mortarboard,
    JournalBookmark,
    CheckCircle,
    ExclamationCircle
} from "react-bootstrap-icons";
import { ajouterUtilisateur, createBulk, processList } from "../../api/api_utilisateurs";
import { useMutation } from "@tanstack/react-query";

function Utilisateur({ user, setUser }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    return (
        <tr>
            <td>
                <Form.Control
                    size="sm"
                    type="text"
                    name="nom_utilisateur"
                    value={user.nom_utilisateur || ""}
                    onChange={handleChange}
                    placeholder="Nom d'utilisateur"
                />
            </td>
            <td>
                <Form.Control
                    size="sm"
                    type="text"
                    name="prenom"
                    value={user.prenom || ""}
                    onChange={handleChange}
                    placeholder="Prénom"
                />
            </td>
            <td>
                <Form.Control
                    size="sm"
                    type="text"
                    name="nom"
                    value={user.nom || ""}
                    onChange={handleChange}
                    placeholder="Nom"
                />
            </td>
            <td>
                <Form.Control
                    size="sm"
                    type="email"
                    name="email"
                    value={user.email || ""}
                    onChange={handleChange}
                    placeholder="Email"
                />
            </td>
            <td>
                <Form.Control
                    size="sm"
                    type="text"
                    name="promotion"
                    value={user.promotion || ""}
                    onChange={handleChange}
                    placeholder="Promo"
                />
            </td>
            <td>
                <Form.Control
                    size="sm"
                    type="text"
                    name="cycle"
                    value={user.cycle || ""}
                    onChange={handleChange}
                    placeholder="Cycle"
                />
            </td>
        </tr>
    );
}


export default function UserCreation() {

    // State for CSV Upload
    const [file, setFile] = useState();
    const [verifList, setVerifList] = useState([]);

    const processMutation = useMutation({
        mutationFn: async () => {
            const data = { file };
            return await processList(data);
        },
        onSuccess: (list) => {
            setVerifList(list);
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            return await createBulk({ list: verifList });
        },
        onSuccess: (list) => {
            console.log("success")
        }
    });

    // State for Single User Add
    const [ajoutUtilisateurForm, setAjoutUtilisateurForm] = useState({
        nomUtilisateur: "",
        email: "",
        nom: "",
        prenom: "",
        promotion: "",
        cycle: ""
    });
    const [utilisateurPhoto, setUtilisateurPhoto] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleAjoutUtilisateurChange = (e) => {
        setAjoutUtilisateurForm({
            ...ajoutUtilisateurForm,
            [e.target.name]: e.target.value,
        });
    };

    const handleAjoutUtilisateurPhotoChange = (e) => {
        setUtilisateurPhoto(e.target.files[0]);
    };

    const handleAjoutUtilisateurSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
            const res = await ajouterUtilisateur(
                ajoutUtilisateurForm.nomUtilisateur,
                ajoutUtilisateurForm.email,
                ajoutUtilisateurForm.prenom,
                ajoutUtilisateurForm.nom,
                ajoutUtilisateurForm.cycle,
                ajoutUtilisateurForm.promotion,
                utilisateurPhoto
            );
            if (res.ok) {
                setSuccessMessage("Utilisateur ajouté avec succès !");
                // Reset form
                setAjoutUtilisateurForm({
                    nomUtilisateur: "",
                    email: "",
                    nom: "",
                    prenom: "",
                    promotion: "",
                    cycle: ""
                });
                setUtilisateurPhoto(null);
            } else {
                // Handle non-ok responses if the API doesn't throw
                setErrorMessage("Erreur lors de l'ajout (code " + res.status + ")");
            }
        } catch (err) {
            setErrorMessage(err.message || "Une erreur est survenue.");
        }
    };


    return <Row className="g-4">
        {/* Column 1: Import CSV */}
        <Col md={12} lg={6}>
            <Card className="h-100 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0 d-flex align-items-center">
                        <FileEarmarkSpreadsheet className="me-2" /> Import de masse (CSV)
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Card.Text className="text-muted">
                        Importez une liste d&apos;utilisateurs via un fichier CSV pour les traiter en lot.
                    </Card.Text>
                    <Form onSubmit={(e) => { e.preventDefault(); processMutation.mutate(); }}>
                        <Form.Group className="mb-3">
                            <Form.Label>Fichier CSV</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                        </Form.Group>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={!file || processMutation.isPending}
                            className="w-100"
                        >
                            {processMutation.isPending ? 'Traitement...' : <><CloudUpload className="me-2" /> Importer et Vérifier</>}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Col>

        {/* Column 2: Add Single User */}
        <Col md={12} lg={6}>
            <Card className="h-100 shadow-sm">
                <Card.Header className="bg-success text-white">
                    <h5 className="mb-0 d-flex align-items-center">
                        <PersonPlus className="me-2" /> Ajout manuel d&apos;utilisateur
                    </h5>
                </Card.Header>
                <Card.Body>
                    {successMessage && (
                        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                            <CheckCircle className="me-2" /> {successMessage}
                        </Alert>
                    )}
                    {errorMessage && (
                        <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>
                            <ExclamationCircle className="me-2" /> {errorMessage}
                        </Alert>
                    )}

                    <Form onSubmit={handleAjoutUtilisateurSubmit} encType="multipart/form-data">
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Prénom</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Person /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="prenom"
                                            value={ajoutUtilisateurForm.prenom}
                                            onChange={handleAjoutUtilisateurChange}
                                            required
                                            placeholder="Prénom"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Person /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="nom"
                                            value={ajoutUtilisateurForm.nom}
                                            onChange={handleAjoutUtilisateurChange}
                                            required
                                            placeholder="Nom"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Nom d&apos;utilisateur</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>@</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    name="nomUtilisateur"
                                    value={ajoutUtilisateurForm.nomUtilisateur}
                                    onChange={handleAjoutUtilisateurChange}
                                    required
                                    placeholder="login"
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <InputGroup>
                                <InputGroup.Text><Envelope /></InputGroup.Text>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={ajoutUtilisateurForm.email}
                                    onChange={handleAjoutUtilisateurChange}
                                    required
                                    placeholder="email@exemple.com"
                                />
                            </InputGroup>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Promotion</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Mortarboard /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="promotion"
                                            value={ajoutUtilisateurForm.promotion}
                                            onChange={handleAjoutUtilisateurChange}
                                            required
                                            placeholder="Ex: 24"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cycle</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><JournalBookmark /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="cycle"
                                            value={ajoutUtilisateurForm.cycle}
                                            onChange={handleAjoutUtilisateurChange}
                                            required
                                            placeholder="Ex: IC"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Photo de profil</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleAjoutUtilisateurPhotoChange}
                                required
                            />
                        </Form.Group>

                        <Button variant="success" type="submit" className="w-100">
                            <PersonPlus className="me-2" /> Ajouter l&apos;utilisateur
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Col>

        {/* Section: Verification Table */}
        {verifList.length > 0 && (
            <Col md={12}>
                <Card className="shadow-sm">
                    <Card.Header className="bg-warning text-dark">
                        <h5 className="mb-0">Vérification des utilisateurs importés</h5>
                    </Card.Header>
                    <Card.Body>
                        <Table responsive hover striped bordered className="mb-0">
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Promo</th>
                                    <th>Cycle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...verifList]
                                    .sort((a, b) => (a.nom_utilisateur || "").localeCompare(b.nom_utilisateur || ""))
                                    .map((u, i) => (
                                        <Utilisateur
                                            key={i}
                                            user={u}
                                            setUser={(updatedUser) => setVerifList(prev => prev.map((e, j) => j === i ? updatedUser : e))}
                                        />
                                    ))}
                            </tbody>
                        </Table>
                        <div className="mt-3 text-end">
                            {/* Placeholder for future bulk action if needed */}
                            <Button variant="primary" onClick={createMutation.mutate}>Confirmer</Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        )}
    </Row>
}