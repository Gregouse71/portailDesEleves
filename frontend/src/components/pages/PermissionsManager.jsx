import { useState } from "react";
import { Table, Form, Button, InputGroup, Badge, Modal, Row, Col } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addPermission, deletePermission, getPermissions, resetMotDePasse, generateResetLinkAdmin, setPasswordAdmin } from "../../api/api_global";
import RenderPagination from "../elements/RenderPagination";
import { modifierInfos } from "../../api/api_utilisateurs";
import { PencilSquare, Person, Envelope, Mortarboard, JournalBookmark, Droplet, Link45deg, Key } from "react-bootstrap-icons";

const PER_PAGE = 15;

function UserRow({ user, onEdit }) {
    return (
        <tr>
            <td><strong>@{user.nom_utilisateur}</strong></td>
            <td>{user.prenom} {user.nom}</td>
            <td>{user.promotion}</td>
            <td>{user.cycle ? user.cycle.toUpperCase() : ""}</td>
            <td>{user.email}</td>
            <td className="text-center" title={user.est_baptise ? "Baptisé" : "Non baptisé"}>
                {user.est_baptise ? "True" : "False"}
            </td>
            <td>
                {user.permissions && user.permissions.map((p, idx) => (
                    <Badge bg="secondary" className="me-2 mb-1 p-2" key={idx}>
                        {p.permission}
                    </Badge>
                ))}
            </td>
            <td className="text-center">
                <Button variant="outline-primary" size="sm" onClick={() => onEdit(user)}>
                    <PencilSquare className="me-1" /> Éditer
                </Button>
            </td>
        </tr>
    );
}

export default function PermissionsManager() {
    const [page, setPage] = useState(1);
    
    // Filters state
    const [filters, setFilters] = useState({
        pseudo: "",
        identite: "",
        email: "",
        promo: "",
        cycle: "",
        est_baptise: "",
        permission: "avec"
    });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [newPermission, setNewPermission] = useState("");
    const [resetMsg, setResetMsg] = useState(null);
    const [magicLink, setMagicLink] = useState(null);
    const [passwordMsg, setPasswordMsg] = useState(null);

    const queryClient = useQueryClient();

    const { data = { permissions: [], count: 0 }, isLoading, isError } = useQuery({
        queryKey: ["permissions", page, filters],
        queryFn: () => getPermissions({ page, per_page: PER_PAGE, ...filters }),
        placeholderData: (previousData) => previousData,
    });
    
    const { permissions: users, count } = data;
    const totalPages = Math.ceil(count / PER_PAGE);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    // Save User Infos Mutation
    const saveMutation = useMutation({
        mutationFn: async (updatedData) => {
            await modifierInfos(editUser.id, updatedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissions"]);
            setShowModal(false);
        }
    });

    // Permission Mutations
    const addPermMutation = useMutation({
        mutationFn: async (perm) => {
            await addPermission({ user_id: editUser.id, permission: perm });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissions"]);
            setNewPermission("");
            setEditUser(prev => ({
                ...prev, 
                permissions: [...(prev.permissions||[]), { id: Date.now(), permission: newPermission }]
            }));
        }
    });

    const deletePermMutation = useMutation({
        mutationFn: async (permId) => {
            await deletePermission(permId);
        },
        onSuccess: (_, permId) => {
            queryClient.invalidateQueries(["permissions"]);
            setEditUser(prev => ({
                ...prev, 
                permissions: prev.permissions.filter(p => p.id !== permId)
            }));
        }
    });

    const handleEditClick = (user) => {
        setEditUser({ ...user });
        setNewPermission("");
        setResetMsg(null);
        setMagicLink(null);
        setPasswordMsg(null);
        setShowModal(true);
    };

    const handleResetPassword = async () => {
        try {
            await resetMotDePasse(editUser.nom_utilisateur);
            setResetMsg({ type: "success", text: "Requête envoyée au serveur !" });
        } catch (e) {
            setResetMsg({ type: "danger", text: "Erreur lors de l'envoi." });
        }
    };

    const handleGenerateLink = async () => {
        try {
            const data = await generateResetLinkAdmin({ user_id: editUser.id });
            const link = `${window.location.origin}/reset/${data.token}`;
            setMagicLink(link);
            setResetMsg({ type: "success", text: "Lien magique généré avec succès !" });
        } catch (e) {
            setResetMsg({ type: "danger", text: "Erreur lors de la génération du lien." });
        }
    };

    const handleSetPasswordPrompt = async () => {
        const pass1 = window.prompt("Veuillez entrer le nouveau mot de passe pour cet utilisateur :");
        if (!pass1) return;

        const pass2 = window.prompt("Veuillez confirmer le nouveau mot de passe en le retapant :");
        if (pass1 !== pass2) {
            window.alert("Les mots de passe ne correspondent pas. Opération annulée.");
            return;
        }

        if (window.confirm(`Vous êtes sur le point de forcer le mot de passe de @${editUser.nom_utilisateur}. Êtes-vous sûr ?`)) {
            if (window.confirm("Vraiment sûr ? Cette action est immédiate et irréversible.")) {
                try {
                    await setPasswordAdmin({ user_id: editUser.id, password: pass1 });
                    setPasswordMsg({ type: "success", text: "Mot de passe modifié avec succès !" });
                    setResetMsg(null);
                    setMagicLink(null);
                } catch (e) {
                    setPasswordMsg({ type: "danger", text: "Erreur lors de la modification." });
                }
            }
        }
    };

    const handleEditChange = (e) => {
        setEditUser({ ...editUser, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (editUser) {
            saveMutation.mutate({
                prenom: editUser.prenom,
                nom: editUser.nom,
                nom_utilisateur: editUser.nom_utilisateur,
                email: editUser.email,
                promotion: editUser.promotion,
                cycle: editUser.cycle,
                est_baptise: editUser.est_baptise,
            });
        }
    };

    if (isLoading) return <div>Chargement...</div>;
    if (isError) return <div>Erreur lors du chargement des données.</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="mb-0" />
            </div>

            <Table striped bordered hover responsive className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th style={{ width: '15%' }}>Pseudo</th>
                        <th style={{ width: '20%' }}>Identité</th>
                        <th style={{ width: '10%' }}>Promo</th>
                        <th style={{ width: '10%' }}>Cycle</th>
                        <th style={{ width: '15%' }}>Email</th>
                        <th style={{ width: '5%' }}>Baptême</th>
                        <th style={{ width: '15%' }}>Permissions</th>
                        <th className="text-center" style={{ width: '10%' }}>Action</th>
                    </tr>
                    <tr className="bg-light align-middle">
                        <th>
                            <Form.Control size="sm" name="pseudo" placeholder="Filtrer pseudo..." value={filters.pseudo} onChange={handleFilterChange} />
                        </th>
                        <th>
                            <Form.Control size="sm" name="identite" placeholder="Filtrer identité..." value={filters.identite} onChange={handleFilterChange} />
                        </th>
                        <th>
                            <Form.Control size="sm" name="promo" placeholder="Promo..." value={filters.promo} onChange={handleFilterChange} />
                        </th>
                        <th>
                            <Form.Select size="sm" name="cycle" value={filters.cycle} onChange={handleFilterChange}>
                                <option value="">Tous</option>
                                <option value="ic">IC</option>
                                <option value="ast">AST</option>
                                <option value="vs">VS</option>
                                <option value="ev">EV</option>
                                <option value="isup">ISUP</option>
                                <option value="de">DE</option>
                            </Form.Select>
                        </th>
                        <th>
                            <Form.Control size="sm" name="email" placeholder="Filtrer email..." value={filters.email} onChange={handleFilterChange} />
                        </th>
                        <th>
                            <Form.Select size="sm" name="est_baptise" value={filters.est_baptise} onChange={handleFilterChange}>
                                <option value="">Tous</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </Form.Select>
                        </th>
                        <th>
                            <Form.Select size="sm" name="permission" value={filters.permission} onChange={handleFilterChange}>
                                <option value="avec">Avec (Par défaut)</option>
                                <option value="">Toutes</option>
                                <option value="admin_octo">admin_octo</option>
                                <option value="admin_biero">admin_biero</option>
                                <option value="admin_rezal">admin_rezal</option>
                                <option value="octo">octo</option>
                                <option value="biero">biero</option>
                                <option value="admin_soifguard">admin_soifguard</option>
                            </Form.Select>
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user, i) => (
                            <UserRow key={i} user={user} onEdit={handleEditClick} />
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center py-4 text-muted">
                                Aucun utilisateur trouvé correspondant à ces critères.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {/* Modal d'édition */}
            {editUser && (
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                    <Modal.Header closeButton className="bg-primary text-white">
                        <Modal.Title><PencilSquare className="me-2" /> Édition de @{editUser.nom_utilisateur}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <h5 className="mb-3 border-bottom pb-2">Identité</h5>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label>Prénom</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><Person /></InputGroup.Text>
                                    <Form.Control name="prenom" value={editUser.prenom || ""} onChange={handleEditChange} />
                                </InputGroup>
                            </Col>
                            <Col md={6}>
                                <Form.Label>Nom</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><Person /></InputGroup.Text>
                                    <Form.Control name="nom" value={editUser.nom || ""} onChange={handleEditChange} />
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Label>Pseudo</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>@</InputGroup.Text>
                                    <Form.Control name="nom_utilisateur" value={editUser.nom_utilisateur || ""} onChange={handleEditChange} />
                                </InputGroup>
                            </Col>
                            <Col md={6}>
                                <Form.Label>Email</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><Envelope /></InputGroup.Text>
                                    <Form.Control name="email" value={editUser.email || ""} onChange={handleEditChange} />
                                </InputGroup>
                            </Col>
                        </Row>

                        <h5 className="mb-3 border-bottom pb-2">Cursus</h5>
                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Label>Promotion</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><Mortarboard /></InputGroup.Text>
                                    <Form.Control type="number" name="promotion" value={editUser.promotion || ""} onChange={handleEditChange} />
                                </InputGroup>
                            </Col>
                            <Col md={6}>
                                <Form.Label>Cycle</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><JournalBookmark /></InputGroup.Text>
                                    <Form.Select name="cycle" value={editUser.cycle || ""} onChange={handleEditChange}>
                                        <option value="">Sélectionner...</option>
                                        <option value="ic">IC</option>
                                        <option value="ast">AST</option>
                                        <option value="vs">VS</option>
                                        <option value="ev">EV</option>
                                        <option value="isup">ISUP</option>
                                        <option value="de">DE</option>
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                        </Row>
                        
                        <Row className="mb-4">
                            <Col md={12}>
                                <Form.Label>Baptême</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><Droplet /></InputGroup.Text>
                                    <Form.Select 
                                        name="est_baptise" 
                                        value={editUser.est_baptise ? "true" : "false"}
                                        onChange={(e) => setEditUser({ ...editUser, est_baptise: e.target.value === "true" })}
                                    >
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                        </Row>

                        <h5 className="mb-3 border-bottom pb-2">Gestion du mot de passe</h5>
                        <Row className="mb-4">
                            <Col md={12}>
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    <Button variant="outline-warning" onClick={handleResetPassword}>
                                        <Envelope className="me-2" /> Envoyer un mail
                                    </Button>
                                    <Button variant="outline-info" onClick={handleGenerateLink}>
                                        <Link45deg className="me-2" /> Générer un lien
                                    </Button>
                                    <Button variant="outline-danger" onClick={handleSetPasswordPrompt}>
                                        <Key className="me-2" /> Forcer le mot de passe
                                    </Button>
                                </div>
                                
                                {resetMsg && (
                                    <div className={`text-${resetMsg.type} mb-2 small`}>
                                        {resetMsg.text}
                                    </div>
                                )}
                                {passwordMsg && (
                                    <div className={`text-${passwordMsg.type} mb-2 small`}>
                                        {passwordMsg.text}
                                    </div>
                                )}
                                
                                {magicLink && (
                                    <div className="mb-3">
                                        <Form.Label>Lien magique :</Form.Label>
                                        <InputGroup size="sm">
                                            <Form.Control readOnly value={magicLink} />
                                            <Button variant="outline-secondary" onClick={() => navigator.clipboard.writeText(magicLink)}>Copier</Button>
                                        </InputGroup>
                                    </div>
                                )}
                            </Col>
                        </Row>

                        <h5 className="mb-3 border-bottom pb-2">Permissions</h5>
                        <div className="mb-3">
                            {editUser.permissions && editUser.permissions.length > 0 ? (
                                editUser.permissions.map((p, idx) => (
                                    <Badge bg="secondary" className="me-2 mb-2 p-2 fs-6" key={idx}>
                                        {p.permission}
                                        <span 
                                            style={{ cursor: "pointer", marginLeft: "8px", fontWeight: "bold" }} 
                                            onClick={() => deletePermMutation.mutate(p.id)}
                                            title="Supprimer"
                                        >
                                            &times;
                                        </span>
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-muted fst-italic">Aucune permission pour cet utilisateur.</p>
                            )}
                        </div>
                        
                        <InputGroup className="mt-2">
                            <Form.Select 
                                value={newPermission}
                                onChange={(e) => setNewPermission(e.target.value)}
                            >
                                <option value="">Sélectionner une permission existante...</option>
                                <option value="admin_octo">admin_octo</option>
                                <option value="admin_biero">admin_biero</option>
                                <option value="admin_rezal">admin_rezal</option>
                                <option value="octo">octo</option>
                                <option value="biero">biero</option>
                                <option value="admin_soifguard">admin_soifguard</option>
                            </Form.Select>
                            <Button 
                                variant="info" 
                                disabled={!newPermission || addPermMutation.isPending}
                                onClick={() => addPermMutation.mutate(newPermission)}
                            >
                                {addPermMutation.isPending ? "Ajout..." : "Ajouter"}
                            </Button>
                        </InputGroup>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Annuler
                        </Button>
                        <Button variant="success" onClick={handleSave} disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
}
