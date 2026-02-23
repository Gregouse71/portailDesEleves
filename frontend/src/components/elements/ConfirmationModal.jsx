import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function ConfirmationModal({ show, onHide, onConfirm, title, body }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Annuler
                </Button>
                <Button variant="danger" onClick={() => {
                    onConfirm();
                    onHide();
                }}>
                    Confirmer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ConfirmationModal;
