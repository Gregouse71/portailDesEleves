import { Container, Alert, Form } from 'react-bootstrap';
import RenderPagination from '../elements/RenderPagination'

export default function PageRandom({
    titre,
    sousTitre,
    contenu,
    avecPagination = false, paramsPag = {},
    avecNbPP = false, paramsNbPP = {},
    avecRequete = false, paramsReq = {}
}) {
    return <Container className="py-4">
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
