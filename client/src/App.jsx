import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import VerificationResult from './components/VerificationResult/VerificationResult';
import LandingPage from './components/LandingPage/LandingPage';
import SignUp from './components/SignUp/SignUp';
import SignIn from './components/SignIn/SignIn';
import Dashboard from './components/Dashboard/Dashboard';

const App = () => (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/verification" element={<HomePage />} />
        <Route path="/results" element={<VerificationResult />} />
        <Route path='/signin' element={<SignIn/>} />
        <Route path='/signup' element={<SignUp/>} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
);

export default App;
