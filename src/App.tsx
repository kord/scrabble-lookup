import React from 'react';
import logo from './logo.svg';
import './App.css';
import WordAnalyzer from "./components/WordAnalyzer";

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
      </header> */}
      <WordAnalyzer />
    </div>
  );
}

export default App;
