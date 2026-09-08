import { Container, Alert, Form, Spinner, Button } from 'react-bootstrap';
import RenderPagination from '../elements/RenderPagination'
import Chargement from '../elements/Chargement';
import { useNavigate } from 'react-router-dom';

export default function PageRandom({
    titre,
    sousTitre,
    contenu,
    isLoading,
    avecPagination = false, paramsPag = {},
    avecNbPP = false, paramsNbPP = {},
    avecRequete = false, paramsReq = {},
    avecBoutonRetour = false, destRetour
}) {
    const navigate = useNavigate();

    if (isLoading) {
        return <Container className="py-4">
            {avecBoutonRetour && <Button variant="outline-secondary" onClick={() => navigate(destRetour)} className="mb-3">
                Retour
            </Button>}
            <div className="text-center text-md-start">
                <h1 className="mb-0">{titre}</h1>
                <p className="text-muted mb-0">{sousTitre}</p>
            </div>
            <Chargement />
        </Container>;
    }
    return <Container className="py-4">
        {avecBoutonRetour && <Button variant="outline-secondary" onClick={() => navigate(destRetour)} className="mb-3">
            Retour
        </Button>}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-3">
            <div className="text-center text-md-start">
                <h1 className="mb-0">{titre}</h1>
                <p className="text-muted mb-0">{sousTitre}</p>
            </div>
            {avecNbPP &&
                <Form.Select
                    style={{ width: 'auto' }}
                    value={paramsNbPP.perPage}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        paramsNbPP.setPerPage(val);
                        paramsPag?.setPage(1);
                        localStorage.setItem('nbPP', val);
                    }}
                    aria-label="Nombre de publications par page"
                >
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="120">120</option>
                </Form.Select>
            }
        </div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3">
            {avecRequete &&
                < div className="w-md-auto">
                    <Form onSubmit={e => { e.preventDefault(); }} className="w-100">
                        <Form.Group>
                            <Form.Control
                                type="text"
                                name="query"
                                placeholder="Rechercher"
                                value={paramsReq.query}
                                onChange={paramsReq.onChange}
                            />
                        </Form.Group>
                    </Form>
                </div>
            }
            {avecPagination && <RenderPagination
                className="d-flex mb-0"
                totalPages={paramsPag.totalPages}
                setPage={paramsPag.setPage}
                page={paramsPag.page}
            />}
        </div>
        {contenu}
        {
            avecPagination && <RenderPagination
                totalPages={paramsPag.totalPages}
                setPage={paramsPag.setPage}
                page={paramsPag.page}
            />
        }
        {
            1 === 0 && (
                <Alert variant="info" className="mt-4">
                    Aucune publication trouvée avec le tag &quot;Vendôme&quot;.
                </Alert>
            )
        }
    </Container >;
}
