import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <p>© 2025; Goli, Kawaljeet, Kandra, Sangeeta, Richard</p>
    </footer>
  );
};

const styles = {
    footer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#0070f3',
      color: '#fff',
      padding: '15px 0',
      textAlign: 'center',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 100,
    },
};


export default Footer;
