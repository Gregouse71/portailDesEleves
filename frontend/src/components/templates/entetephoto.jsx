import { Card, Row, Col, Image } from 'react-bootstrap';
import DropdownEditer from '../elements/DropdownEditer';
import { UPLOAD_BASE_URL } from '../../api/base';

function getImageUrl(urlOrPath) {
    if (!urlOrPath) return null;
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://') || urlOrPath.startsWith('/')) {
        return urlOrPath;
    }
    return `${UPLOAD_BASE_URL}/${urlOrPath}`;
}

/**
 * Template pour les en-têtes de page avec bannière, photo/logo, titre et menu d'édition.
 * Utilisé notamment sur PageAsso (photo à gauche) et PageUtilisateur (photo à droite).
 */
export default function HeaderTemplate({
    banniere,
    image,
    imageAlt = '',
    imageHeight,
    titre,
    sousTitre,
    photoADroite = false,
    avecDropdown = false,
    contenuDropdown = [],
    logoInputRef,
    banniereInputRef,
    onLogoChange,
    onBanniereChange,
    children,
}) {
    const banniereUrl = getImageUrl(banniere);
    const imageUrl = getImageUrl(image) || '/assets/icons/group.svg';
    const isGif = typeof banniere === 'string' && banniere.toLowerCase().endsWith('.gif');

    const imgHeight = imageHeight ?? (photoADroite ? 200 : 150);
    const offset = `-${imgHeight - 30}px`;

    const headerStyle = {
        backgroundImage: banniereUrl ? `url(${banniereUrl})` : 'none',
        height: '170px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        imageRendering: isGif ? 'pixelated' : 'auto',
    };

    const imageStyle = {
        position: 'relative',
        top: offset,
        height: `${imgHeight}px`,
        border: '2px solid white',
        marginBottom: offset,
    };

    return (
        <>
            {logoInputRef && (
                <input
                    type="file"
                    ref={logoInputRef}
                    className="d-none"
                    accept="image/png, image/jpeg, image/jpg, image/gif"
                    onChange={onLogoChange}
                />
            )}
            {banniereInputRef && (
                <input
                    type="file"
                    ref={banniereInputRef}
                    className="d-none"
                    accept="image/png, image/jpeg, image/jpg, image/gif"
                    onChange={onBanniereChange}
                />
            )}
            {children}

            <Card className="mb-3">
                <Card.Header style={headerStyle} />
                <Card.Body>
                    <Row className="align-items-center flex-md-nowrap">
                        {photoADroite ? (
                            <>
                                {avecDropdown ? (
                                    <Col xs md="auto" className="order-1 order-md-1 text-start">
                                        <DropdownEditer list={contenuDropdown} />
                                    </Col>
                                ) : (
                                    <Col xs className="d-md-none order-1" />
                                )}
                                <Col xs={12} md className="order-4 order-md-2 text-center text-md-end">
                                    <h2 className="mb-0 text-break">{titre}</h2>
                                    {sousTitre && <div>{sousTitre}</div>}
                                </Col>
                                <Col xs="auto" md="auto" className="order-2 order-md-3 text-center text-md-end">
                                    <Image
                                        className="rounded-3"
                                        src={imageUrl}
                                        alt={imageAlt}
                                        rounded
                                        style={imageStyle}
                                    />
                                </Col>
                                <Col xs className="d-md-none order-3" />
                            </>
                        ) : (
                            <>
                                <Col xs className="d-md-none order-1" />
                                <Col xs="auto" md="auto" className="order-2 order-md-1 text-center text-md-start">
                                    <Image
                                        className="rounded-3"
                                        src={imageUrl}
                                        alt={imageAlt}
                                        rounded
                                        style={imageStyle}
                                    />
                                </Col>
                                <Col xs={12} md className="order-4 order-md-2 text-center text-md-start">
                                    <h2 className="mb-0 text-break">{titre}</h2>
                                    {sousTitre && <div>{sousTitre}</div>}
                                </Col>
                                {avecDropdown ? (
                                    <Col xs md="auto" className="order-3 order-md-3 text-end">
                                        <DropdownEditer list={contenuDropdown} />
                                    </Col>
                                ) : (
                                    <Col xs className="d-md-none order-3" />
                                )}
                            </>
                        )}
                    </Row>
                </Card.Body>
            </Card>
        </>
    );
}
