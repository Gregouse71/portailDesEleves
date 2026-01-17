import { Pagination } from "react-bootstrap";

function RenderPagination({ totalPages, setPage, page, className = "d-flex justify-content-center my-3" }) {
    if (totalPages <= 1) return null;
    return (
        <div className={className}>
            <Pagination className="mb-0">
                <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} />

                {Array.from({ length: 5 }, (_, i) => page - 2 + i)
                    .filter(p => p > 0 && p <= totalPages)
                    .map(p => (
                        <Pagination.Item
                            key={p}
                            active={p === page}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </Pagination.Item>
                    ))
                }

                <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
                <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
            </Pagination>
        </div>
    );
}

export default RenderPagination;