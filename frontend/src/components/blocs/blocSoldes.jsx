import { useProtected } from '../../Protected';
import { Link } from 'react-router-dom';
import { Button, Row, Col, Image } from 'react-bootstrap';
import BlocTemplate from '../templates/bloc';

const URL_OCTO = "https://www.helloasso.com/associations/union-des-eleves-de-l-ecole-de-mines-paris/evenements/octo";
const URL_BIERO = "https://collecte.io/dettes-biero-740792/fr"

const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    trailingZeroDisplay: 'stripIfInteger'
});

export default function BlocSoldes() {
    const { userData } = useProtected();

    return <BlocTemplate
        titre="Soldes éthylo-associatifs"
        contenu={<>
            <Row className='mb-2'>
                <Col className="d-flex align-items-center">
                    <Image
                        src={userData.solde_octo >= 0 ? "/assets/gif/octo-belus-content1.gif" : "/assets/gif/octo-belus-pas-content1.gif"}
                        alt="GIF"
                        style={{ width: '75px', height: '75px', objectFit: 'cover' }}
                    />
                </Col>
                <Col className="d-flex align-items-center">
                    <Image
                        src={userData.solde_biero >= 0 ? "/assets/gif/biero-p17-positif1.gif" : "/assets/gif/biero-p17-negatif1.gif"}
                        alt="GIF"
                        style={{ width: '75px', height: '75px', objectFit: 'cover' }}
                    />
                </Col>
            </Row>
            <Row className="mb-2">
                <Col >
                    <span className="text-nowrap" style={{ color: userData.solde_octo >= 0 ? "green" : "red" }}>
                        Octo : {formatter.format(userData.solde_octo)}
                    </span>
                </Col>
                <Col className="d-flex justify-content-end">
                    <Button as={Link} to={URL_OCTO} variant="primary" size='sm'>€</Button>
                </Col>
            </Row>
            <Row>
                <Col >
                    <span className="text-nowrap" style={{ color: userData.solde_biero >= 0 ? "green" : "red" }}>
                        Biéro : {formatter.format(userData.solde_biero)}
                    </span>
                </Col>
                <Col className="d-flex justify-content-end">
                    <Button as={Link} to={URL_BIERO} variant="primary" size='sm'>€</Button>
                </Col>
            </Row>

        </>} />;


}
