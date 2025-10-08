import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './shared/header'
import Login from './pages/login';
import Library from './pages/library';
import Nearby from './pages/nearby';
import Search from './pages/search';
import Connect from './pages/connect';
import Footer from './shared/footer';

export default function Root() {
	const location = useLocation();

	let rCorners = null;
	if (!["/", "/login"].includes(location.pathname)) {
		rCorners = (
			<div className="flex justify-between sticky top-[7vh] sm:top-[max(7vh, 70px)] -mb-8">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" class="text-gray-3 h-8 w-8">
					<path fill="currentColor" d="M500,0C223.86,0,0,223.86,0,500V0h500Z" />
				</svg>

				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" class="text-gray-3 h-8 w-8">
					<path fill="currentColor" d="M500,500C500,223.86,276.14,0,0,0h500v500Z" />
				</svg>
			</div>
		);
	}

	return (
		<>
			{!["/", "/login"].includes(location.pathname) && <Header /> }
			
			<main>

				{rCorners}

				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/login" element={<Login />} />
					<Route path="/library" element={<Library />} />
					<Route path="/nearby" element={<Nearby />} />
					<Route path="/search" element={<Search />} />
					<Route path="/connect" element={<Connect />} />
				</Routes>
				
			</main>

			{!["/", "/login"].includes(location.pathname) && <Footer /> }
		</>
	)	
}