import { useEffect, useState, useRef, useCallback } from "react";
import { estUtilisateurDansAsso } from "../../../api/api_associations";
import { ajouterContenuPublication, creerNouvellePublication, obtenirPublicationsAsso, supprimerPublication } from "../../../api/api_publications";
import RichEditor from "../../elements/RichEditor";
import { Card, Button, Form, Row, Col, Image, InputGroup, Spinner } from "react-bootstrap";
import Select from 'react-select';
import BoutonEditer from "../../elements/BoutonEditer";
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import Post from "../../elements/Post";

const tagOptions = [
    { value: 'Vendôme', label: 'Vendôme' },
    { value: 'Palum', label: 'Palum' }
];

function AssoPosts({ asso_id }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);
    const [isNewPost, setIsNewPost] = useState(false);
    const [newPost, setNewPost] = useState({
        "titre": "",
        "contenu": "",
        "is_commentable": true,
        "a_cacher_to_cycles": [],
        "a_cacher_aux_nouveaux": false,
        "is_publication_interne": false,
        "tags": []
    })

    const [newPostFile, setNewPostFile] = useState(null);
    const [newPostMiniatureFile, setNewPostMiniatureFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(false);

    const observer = useRef();

    const clearNewPost = () => {
        setNewPost({
            "titre": "",
            "contenu": "",
            "is_commentable": true,
            "a_cacher_to_cycles": [],
            "a_cacher_aux_nouveaux": false,
            "is_publication_interne": false,
            "tags": []
        });
        setNewPostFile(null);
        setNewPostMiniatureFile(null);
    }

    const handleSetNewPost = (e) => {
        const { name, value, checked } = e.target;
        setNewPost(prevState => {
            if (['is_commentable', 'is_publication_interne', 'a_cacher_aux_nouveaux'].includes(name)) {
                return {
                    ...prevState,
                    [name]: checked
                };
            }
            if (name === 'a_cacher_to_cycles') {
                const currentCycles = newPost.a_cacher_to_cycles;
                const updatedCycles = checked ? [...currentCycles, value] : currentCycles.filter(cycle => cycle !== value);
                return {
                    ...prevState,
                    [name]: updatedCycles
                };
            }
            return {
                ...prevState,
                [name]: value
            };
        });
    };

    const handleSetNewPostTags = (selectedOptions) => {
        setNewPost(prevState => ({
            ...prevState,
            tags: selectedOptions ? selectedOptions.map(option => option.value) : []
        }));
    };

    const handleSetNewPostContent = (value) => {
        setNewPost(prevState => ({
            ...prevState,
            contenu: value,
        }))
    }


    const removePost = async (post_id) => {
        try {
            await supprimerPublication(asso_id, post_id);
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const validateNewPost = async () => {
        setIsLoading(true);
        try {
            const newPublication = await creerNouvellePublication(asso_id, newPost);
            if (newPostFile || newPostMiniatureFile) {
                try {
                    await ajouterContenuPublication(asso_id, newPublication.id_publication, newPostFile, newPostMiniatureFile);
                } catch (error) {
                    console.error("Erreur lors de l'ajout du fichier:", error);
                }
            }
            clearNewPost();
            setIsNewPost(false);
            queryClient.invalidateQueries(['publicationData', asso_id])
        } catch (erreur) {
            console.error(erreur);
        }
        setIsLoading(false);
    }

    const handleSetIsGestion = (newState) => {
        if (!newState) {
            setIsNewPost(false)
        }
        setIsGestion(newState)
    }

    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
        enabled: !!asso_id,
    });

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['publicationData', asso_id, 'publications'],
        queryFn: ({ pageParam = 0 }) => obtenirPublicationsAsso(asso_id, pageParam, 10),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 10 ? allPages.length * 10 : undefined;
        },
        enabled: !!asso_id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const lastPostRef = useCallback(node => {
        if (isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        if (node) observer.current.observe(node);
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    useEffect(() => {
        let fileForPreview = newPostMiniatureFile || newPostFile;

        if (!fileForPreview) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(fileForPreview);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);

    }, [newPostFile, newPostMiniatureFile]);

    const listePosts = data?.pages.flat() || [];

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Les publications</h2>
                {membreData.autorise && <Button
                    variant="light"
                    onClick={() => handleSetIsGestion(!isGestion)}
                >
                    <img src="/assets/icons/plus.svg" alt="ajouter" style={{ filter: "brightness(0) saturate(100%)", transition: "transform 0.2s ease" }} />
                </Button>}
            </div>
            {isGestion && !isNewPost && <div className="d-flex gap-2 mb-3">
                <Button variant="success" onClick={() => setIsNewPost(true)}>
                    <img src="/assets/icons/plus.svg" alt="Ajouter une publication" />
                    {" "}Ajouter une publication
                </Button>
            </div>}
            <div className="d-flex flex-column gap-3">

                {/* formulaire pour une nouvelle publication */}
                {isNewPost && <Card>
                    <Card.Body>
                        <Row>
                            <Col md={previewUrl ? "9" : "12"}>
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm="2">Titre</Form.Label>
                                    <Col sm="10">
                                        <Form.Control value={newPost.titre} name='titre' type='text' onChange={handleSetNewPost} />
                                    </Col>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Check type="checkbox" label="Autoriser les commentaires" checked={newPost.is_commentable} name='is_commentable' onChange={handleSetNewPost} />
                                    <Form.Check type="checkbox" label="Publication interne" checked={newPost.is_publication_interne} name='is_publication_interne' onChange={handleSetNewPost} />
                                    <Form.Check type="checkbox" label="Cacher aux 1A" checked={newPost.a_cacher_aux_nouveaux} name='a_cacher_aux_nouveaux' onChange={handleSetNewPost} />
                                </Form.Group>
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label>Cacher aux cycles</Form.Label>
                                    <Col>
                                        {["ic", "ast", "ev", "vs", "isup"].map(cycle => (
                                            <Form.Check inline key={cycle} type="checkbox" name="a_cacher_to_cycles" value={cycle} label={cycle} checked={newPost.a_cacher_to_cycles.includes(cycle)} onChange={handleSetNewPost} />
                                        ))}
                                    </Col>
                                </Form.Group>
                            </Col>
                            {previewUrl &&
                                <Col md="3" className="text-center">
                                    <Image src={previewUrl} fluid alt="La miniature automatique sera générée à l'envoi" />
                                </Col>
                            }
                        </Row>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <RichEditor value={newPost.contenu} onChange={handleSetNewPostContent} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Pièce jointe</Form.Label>
                                        <InputGroup>
                                            <Form.Control key={fileInputKey} type="file" onChange={(e) => setNewPostFile(e.target.files[0])} />
                                            {newPostFile &&
                                                <Button variant="danger" onClick={() => { setNewPostFile(null); setFileInputKey(Date.now()); }}>
                                                    <img src="/assets/icons/delete.svg" alt="Supprimer la pièce jointe" />
                                                </Button>
                                            }
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Miniature</Form.Label>
                                        <Form.Control type="file" onChange={(e) => setNewPostMiniatureFile(e.target.files[0])} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Tags</Form.Label>
                                <Col sm="10">
                                    <Select
                                        isMulti
                                        name="tags"
                                        options={tagOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        value={newPost.tags.map(tag => ({ value: tag, label: tag }))}
                                        onChange={handleSetNewPostTags}
                                        placeholder="Sélectionnez un ou plusieurs tags"
                                    />
                                </Col>
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button variant="success" onClick={validateNewPost} disabled={isLoading}>
                                    {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Ajouter"}
                                </Button>
                                <Button variant="danger" onClick={() => setIsNewPost(false)}>Annuler</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>}

                {listePosts.map((postId, index) => (
                    <div key={postId} ref={index === listePosts.length - 1 ? lastPostRef : null}>
                        <Post
                            postId={postId}
                            autorisé={membreData.autorise}
                            removePost={() => removePost(postId)}
                            tagOptions={tagOptions}
                        />
                    </div>
                ))}

                {isFetchingNextPage && <div className="text-center py-3"><Spinner animation="border" /></div>}
            </div>
        </>
    )
}

export default AssoPosts;