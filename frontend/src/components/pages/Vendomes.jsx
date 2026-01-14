import { useInfiniteQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { getPublicationsByTag } from '../../api/api_publications';
import PostCard from '../elements/PostCard';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout
import { useRef, useCallback } from 'react';

function Vendomes() {
  const observer = useRef();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['vendomesPublications'],
    queryFn: ({ pageParam = 0 }) => getPublicationsByTag("Vendôme", pageParam, 30),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
        // Assuming lastPage has the structure: { publications: [...] }
        const lastPagePublications = lastPage.publications || [];
        return lastPagePublications.length === 30 ? allPages.length * 30 : undefined;
    },
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

  if (status === 'loading') {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Erreur lors du chargement des publications : {error.message}
        </Alert>
      </Container>
    );
  }
  
  const allPublications = data?.pages.flatMap(page => page.publications) || [];

  return (
    <Container className="py-4">
      <h1 className="mb-3">Vendômes</h1>
      <p className="text-muted">Retrouvez ici tous les Vendômes</p>
      <div className="asso-grid"> {/* Reusing the asso-grid class for styling */}
        {allPublications.filter(p => p.fichier_joint).map((post, index) => {
             if (allPublications.length === index + 1) {
                 return <div ref={lastPostRef} key={post.id}><PostCard post={post} /></div>
             }
             return <div key={post.id}><PostCard post={post} /></div>
        })}
      </div>
      {allPublications.length === 0 && (
        <Alert variant="info" className="mt-4">
          Aucune publication trouvée avec le tag "Vendôme".
        </Alert>
      )}
       {isFetchingNextPage && <div className="text-center py-3"><Spinner animation="border" /></div>}
    </Container>
  );
}

export default Vendomes;
