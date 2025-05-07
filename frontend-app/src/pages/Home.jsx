import React from "react";
import { Link } from "react-router-dom";
import homeImg from "/public/homeImg.png"

function Home() {
  return (
    <div className="homeContainer">
      <div className="homeInnerContainer">
        <div className="homeContent">
          <h1 className="homeHeading">Welcome to Our Portal</h1>
          <p className="homeText">
            Click the button below to open the DocuSign form
          </p>
          <Link to="https://demo.services.docusign.net/webforms-ux/v1.0/forms/3a8aade7c0708c47402ead8ba694d511">
            <button className="btn-start">Open DocuSign Form</button>
          </Link>
        </div>
        <div className="homeImg">
          <img src={homeImg} alt=""/>
        </div>
      </div>
    </div>
  );
}

export default Home;
