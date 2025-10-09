import { Link, useLocation } from "react-router-dom";

export default function Footer() {
	const location = useLocation();
	const atLibrary = location.pathname === '/library';
	const atNearby = location.pathname === '/nearby';
	const atSearch = location.pathname === '/search';

	const selectedClass = "bg-green-2 text-gray-1";

	// -mb-4 only to fix weird bottom bar thing, may not be necessary on built version (to test)

	return (
		<div className="fixed rounded-tr-4xl rounded-tl-4xl h-20 w-full bottom-0 left-0 flex justify-center items-center bg-gray-3 sm:hidden -mb-4">
			<nav className="bg-gray-1 w-[80%] h-6 rounded-4xl flex justify-between items-center">
				<Link to={!atLibrary ? '/library' : null} className={`w-[30%] h-full flex flex-col justify-center rounded-4xl ${atLibrary ? selectedClass : 'text-white-0'}`}>
					<div className="w-full font-main font-black text-center flex justify-center text-xs">YOU</div>
				</Link>
				<Link to={!atNearby ? '/nearby' : null} className={`w-[30%] h-full flex flex-col justify-center rounded-4xl ${atNearby ? selectedClass : 'text-white-0'}`}>
					<div className="w-full font-main font-black text-center flex justify-center text-xs">NEARBY</div>
				</Link>
				<Link to={!atSearch ? '/search' : null} className={`w-[30%] h-full flex flex-col justify-center rounded-4xl ${atSearch ? selectedClass : 'text-white-0'}`}>
					<div className="w-full font-main font-black text-center flex justify-center text-xs">SEARCH</div>
				</Link>
			</nav>
		</div>
	)
}