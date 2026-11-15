import { Pagination } from "react-bootstrap";

function RenderPagination({ totalPages, setPage, page, className = "d-flex justify-content-center" }) {
    if (totalPages <= 1) return <div className={className}>
        <Pagination className="mb-0">
            <Pagination.First disabled />
            <Pagination.Item disabled>1</Pagination.Item>
            <Pagination.Last disabled />
        </Pagination>
    </div>;

    const changePage = (p) => { setPage(p); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }) };

    return (
        <div className={className}>
            <Pagination className="mb-0">
                <Pagination.First disabled={page === 1} onClick={() => changePage(1)} />
                <Pagination.Prev disabled={page === 1} onClick={() => changePage(p => Math.max(1, p - 1))} />

                {Array.from({ length: 5 }, (_, i) => page - 2 + i)
                    .filter(p => p > 0 && p <= totalPages)
                    .map(p => (
                        <Pagination.Item
                            key={p}
                            active={p === page}
                            onClick={() => changePage(p)}
                        >
                            {p}
                        </Pagination.Item>
                    ))
                }

                <Pagination.Next disabled={page === totalPages} onClick={() => changePage(p => Math.min(totalPages, p + 1))} />
                <Pagination.Last disabled={page === totalPages} onClick={() => changePage(totalPages)} />
            </Pagination>
        </div>
    );
}

export default RenderPagination;