import { Card } from "react-bootstrap"
import { UPLOAD_BASE_URL } from "../../api/base";

export default function PostCard({ post }) {

    // Function to determine if the file is an image or PDF
    const isImage = (filePath) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = (filePath.substring(filePath.lastIndexOf('.'))).toLowerCase();
        return imageExtensions.includes(ext);
    };

    const handleCardClick = () => {
        if (post.fichier_joint) {
            // Open the file in a new tab
            window.open(`${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/publications/${post.fichier_joint}`, '_blank');
        } else {
            // If no file, navigate to a detail page if one exists (or do nothing)
            console.log("No file attached to this post.");
            // navigate(`/publications/${post.id}`); // Example: navigate to a detail page
        }
    };

    // Determine the image source for the card
    let imgSrc = '';
    if (post.miniature) {
        imgSrc = `${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/thumbnails/${post.miniature}`;
    } else if (post.fichier_joint && isImage(post.fichier_joint)) {
        imgSrc = `${UPLOAD_BASE_URL}/associations/${post.association.nom_dossier}/publications/${post.fichier_joint}`;
    } else {
        // Default image if no miniature or image file is available
        imgSrc = '/assets/icons/default-post-image.svg'; // You might want to create a default image
    }


    return (
        <Card
            className="h-100 text-center post-card"
            onClick={handleCardClick}
            style={{ cursor: 'pointer' }}
        >
            <Card.Img
                variant="top"
                src={imgSrc}
                alt={post.titre}
                style={{ objectFit: 'contain' }}
            />
            <Card.Body>
                <Card.Title>{post.titre}</Card.Title>
                <Card.Text><em>{new Date(post.date_publication).toLocaleDateString()}</em></Card.Text>
            </Card.Body>
        </Card>
    );
}
