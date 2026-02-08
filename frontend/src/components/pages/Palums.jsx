import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { getPublicationsByTag } from '../../api/api_publications';
import PostCard from '../elements/PostCard';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout

function Palums() {
  const { data: data, isLoading, error } = useQuery({
    queryKey: ['palumsPublications'],
    queryFn: () => getPublicationsByTag("Palum", 1, 0),
  });

  if (isLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Erreur lors du chargement des publications : {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-3">Palums</h1>
      <p className="text-muted">Retrouvez ici toutes les Palums</p>
      <h2>1A</h2>
      <div className="asso-grid"> {/* Reusing the asso-grid class for styling */}
        {data.publications.filter(p => p.titre.includes("1")).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <h2>2A</h2>
      <div className="asso-grid"> {/* Reusing the asso-grid class for styling */}
        {data.publications.filter(p => p.titre.includes("2")).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <h2>3A</h2>
      <div className="asso-grid"> {/* Reusing the asso-grid class for styling */}
        {data.publications.filter(p => p.titre.includes("3")).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {data.publications.length === 0 && (
        <Alert variant="info" className="mt-4">
          Aucune publication trouvée avec le tag &quot;Palum&quot;.
        </Alert>
      )}
    </Container>
  );
}

export default Palums;