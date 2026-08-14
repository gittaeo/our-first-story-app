import React from 'react';import{createRoot}from'react-dom/client';import{HashRouter}from'react-router-dom';import{Store}from'./store';import App from'./App';import'./styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter><Store><App/></Store></HashRouter></React.StrictMode>);
