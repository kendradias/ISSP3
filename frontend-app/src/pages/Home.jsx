import React from "react";

function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        textAlign: "center",
        fontFamily: "sans-serif",
        marginTop: "50px",
       
      }}
    >
      <h1>
            Welcome to Our Portal
        </h1>
      <p>Click the button below to open the DocuSign form:</p>
      <a
        href="https://demo.services.docusign.net/webforms-ux/v1.0/forms/3a8aade7c0708c47402ead8ba694d511"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "#fff",
          textDecoration: "bold",
          borderRadius: "4px",
          marginTop: "20px",
        }}
      >
        Open DocuSign Form
      </a>
    </div>
  );
}

export default Home;
