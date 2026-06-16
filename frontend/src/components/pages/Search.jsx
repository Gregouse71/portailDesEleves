import { useSearchParams, Link } from 'react-router-dom';
import { ListGroup, Image } from 'react-bootstrap';
import { searchUsers } from '../../api/api_utilisateurs';
import { UPLOAD_BASE_URL } from '../../api/base';
import { useQuery } from '@tanstack/react-query';
import '../../assets/styles/search.scss';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  const { data: searchResults = [] } = useQuery({
    queryKey: ['searchResults', query],
    queryFn: () => searchUsers({ query }),
  });

  return (
    <div className="search-results-container">
      <h1>Résultats de recherche pour &quot;{query}&quot;</h1>
      {searchResults.length > 0 ? (
        <ListGroup>
          {searchResults.sort((a, b) => b.promotion - a.promotion).map(user => (
            <ListGroup.Item key={user.id} as={Link} to={`/utilisateur/${user.id}`} className="d-flex align-items-center">
              <div style={{ height: '100px' }} className='me-3'>
                <Image src={user.photo ? `${UPLOAD_BASE_URL}/${user.photo}` : ''} alt="user" className="mw-100 mh-100" />
              </div>
              <div>
                <p className="mb-0">{user.prenom} {user.nom}</p>
                <p className="mb-0 text-muted">Promo : {user.promotion}</p>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>No results found</p>
      )}
    </div>
  );
}
