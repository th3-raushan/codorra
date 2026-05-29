import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import VerificationPage from './components/VerificationPage/VerificationPage';
import LandingPage from './components/LandingPage/LandingPage';


const App = () => (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/verification" element={<HomePage />} />
        <Route path="/results" element={<VerificationPage />} />
      </Routes>
    </div>
);

export default App;
