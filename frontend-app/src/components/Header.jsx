import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo}>Quality Horticulture</div>
        <nav style={styles.nav}>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/applications" style={styles.link}>Applications</Link>
        </nav>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#0070f3',
    padding: '15px 0',
    fontFamily: 'sans-serif',
    color: 'white',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  container: {
    width: '90%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  nav: {
    display: 'flex',
    gap: '20px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
  },
};

export default Header;
