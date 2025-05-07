import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Application from './pages/Application';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className='appContainer'>
        <Header />
        <div className='content'>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/applications" element={<Application />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}


export default App;
