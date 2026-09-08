import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { getPublicationsByTag } from '../../api/api_publications';
import PostCard from '../elements/PostCard';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout
import PageRandom from '../templates/pageRandom';

function Palums() {
  const { data: data, isLoading, error } = useQuery({
    queryKey: ['palumsPublications'],
    queryFn: () => getPublicationsByTag("Palum", 1, 0),
  });

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Erreur lors du chargement des publications : {error.message}
        </Alert>
      </Container>
    );
  }

  return <PageRandom
    titre="Palums"
    sousTitre="Retrouvez ici toutes les Palums"
    isLoading={isLoading}
    contenu={<>
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
      )}</>} />;
}

export default Palums;