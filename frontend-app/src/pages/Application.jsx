import React, { useEffect, useState } from "react";
import axios from "axios";

const VITE_URL =
  import.meta.env.VITE_APP_API_URL || "http://localhost:3000/api/applications";

const Application = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(`${VITE_URL}`);
        setApplications(response.data);
      } catch (err) {
        setError("Failed to load applications.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = applications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(applications.length / itemsPerPage);
  

  return (
   <div className="main">
      <div className="app-container">
        <h2 className="app-title">Submitted Applications</h2>

        {loading && <p className="app-message">Loading...</p>}
        {error && <p className="app-error">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <p className="app-message">No applications found.</p>
        )}

        {!loading && !error && applications.length > 0 && (
          <>
            <div className="app-table-wrapper">
              <table className="app-table">
                <thead>
                  <tr>
                    <th className="app-th envelope-col">Envelope ID</th>
                    <th className="app-th email-col">Signer Email</th>
                    <th className="app-th status-col">Status</th>
                    <th className="app-th date-col">Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {currentApplications.map((app) => (
                    <tr key={app.envelopeId}>
                      <td className="app-td envelope-col">{app.envelopeId}</td>
                      <td className="app-td email-col">{app.signerEmail}</td>
                      <td className="app-td status-col app-status">{app.status}</td>
                      <td className="app-td date-col">{new Date(app.completedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="app-pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`app-button ${currentPage === 1 ? 'disabled' : ''}`}
              >
                Previous
              </button>
              <span className="app-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`app-button ${currentPage === totalPages ? 'disabled' : ''}`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Application;
