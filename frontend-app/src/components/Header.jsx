import React from "react";
import { Link } from "react-router-dom";
import logo from "/public/logo.png";

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div>
          <img src={logo} alt="" className="logo" />
        </div>
        <ul className="nav">
          <li className="link">
            <Link to="/" >
              Home
            </Link>
          </li>
          <li className="link">
            <Link to="/applications">
              Applications
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
