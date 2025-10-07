import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './components/pages/login'
import Library from './components/pages/library'
import Nearby from './components/pages/nearby'
import Search from './components/pages/search'
import Connect from './components/pages/connect'
import './index.css'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/login" element={<Login />} />
				<Route path="/library" element={<Library />} />
				<Route path="/nearby" element={<Nearby />} />
				<Route path="/search" element={<Search />} />
				<Route path="/connect" element={<Connect />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>,
)
