import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VITE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api/applications';


const Application = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const currentApplications = applications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(applications.length / itemsPerPage);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        width: "100vw",
        textAlign: "center",
        fontFamily: "sans-serif",
        paddingTop: "50px",
        paddingBottom: "100px", // prevent overlap with fixed footer
        backgroundColor: "#f4f7fa",
      }}
    >
      <h2>Submitted Applications</h2>

      {loading && <p style={{ marginTop: "20px" }}>Loading...</p>}
      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}

      {!loading && !error && applications.length === 0 && (
        <p style={{ marginTop: "20px" }}>No applications found.</p>
      )}

      {!loading && !error && applications.length > 0 && (
        <>
          <table
            style={{
              marginTop: "30px",
              borderCollapse: "collapse",
              width: "90%",
              maxWidth: "900px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#0070f3", color: "#fff" }}>
                <th style={styles.th}>Envelope ID</th>
                <th style={styles.th}>Signer Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {currentApplications.map((app) => (
                <tr key={app.envelopeId}>
                  <td style={styles.td}>{app.envelopeId}</td>
                  <td style={styles.td}>{app.signerEmail}</td>
                  <td style={styles.td}>{app.status}</td>
                  <td style={styles.td}>{new Date(app.completedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.paginationContainer}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ ...styles.button, opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ paddingTop: "6px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ ...styles.button, opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "bold",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    color: "#333",
  },
  paginationContainer: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    padding: "6px 12px",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Application;
