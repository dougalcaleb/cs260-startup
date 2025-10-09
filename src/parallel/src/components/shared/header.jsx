import { Link, useLocation } from "react-router-dom";
import parallelLogo from "../../assets/parallel-icon.svg"
import { useEffect, useRef, useState } from "react";

export default function Header() {
	const location = useLocation();
	const atLibrary = location.pathname === '/library';
	const atNearby = location.pathname === '/nearby';
	const atSearch = location.pathname === '/search';

	const selectedClass = "bg-green-2 text-gray-1";

	const headerRef = useRef(null);
	const bigLogoRef = useRef(null);
	const smallLogoRef = useRef(null);

	let logoHeight = null;

	const [bigLogoStyle, setBigLogoStyle] = useState({top: 0});
	const [smallLogoStyle, setSmallLogoStyle] = useState({opacity: 1});

	useEffect(() => {
		if (window.innerWidth < 700) {
			const headerBound = headerRef.current?.getBoundingClientRect();
			setBigLogoStyle({ top: `${headerBound.bottom / 2 - bigLogoRef.current.getBoundingClientRect().height / 2}px` });
			setSmallLogoStyle({ opacity: 0 });
		}
	}, []);

	window.addEventListener("scroll", () => {
		if (window.innerWidth < 700) {
			const headerBound = headerRef.current?.getBoundingClientRect();
			logoHeight = bigLogoRef.current.getBoundingClientRect().height;
			const percentScrolled = (window.scrollY / (window.innerHeight / 5));

			setBigLogoStyle({ top: `${headerBound.bottom / 2 - logoHeight / 2}px`, opacity:  Math.min(1, 1 - percentScrolled * 3) });
			setSmallLogoStyle({ opacity: Math.min(1, (percentScrolled - 0.3) * 3) });
		}
	});

	return (
		<>
			<div id="pre-header" className="flex sm:hidden justify-center h-[20vh]">
				<div ref={bigLogoRef} id="pre-header-logo" className="fixed z-10 flex flex-col items-center w-full" style={bigLogoStyle}>
					<img src={parallelLogo} className="h-8" />
					<p className="font-header text-white-0 text-4xl mt-4 font-black">PARALLEL</p>
				</div>
			</div>

			<header ref={headerRef} className="sticky bg-gray-3 flex justify-between h-[7vh] w-full m-0 sm:h-[max(7vh,70px)] top-0 items-center">
				<div ref={smallLogoRef} id="header-logo-wrap" className="flex items-center" style={smallLogoStyle}>
					<img src={parallelLogo} className="h-4 ml-5 sm:h-5 sm:ml-8" />
					<p className="font-header text-white-0 ml-2.5 sm:text-2xl font-black">PARALLEL</p>
				</div>
			
				<div className="w-[30vw] mr-8 hidden sm:inline">
					<nav className="bg-gray-1 w-full h-6 rounded-4xl flex justify-between items-center">
						<Link to={!atLibrary ? '/library' : null} className={`w-1/4 h-full flex flex-col justify-center rounded-4xl ${atLibrary ? selectedClass : 'text-white-0'}`}>
							<div className="w-full font-main font-black text-center flex justify-center text-xs">YOU</div>
						</Link>
						<Link to={!atNearby ? '/nearby' : null} className={`w-1/4 h-full flex flex-col justify-center rounded-4xl ${atNearby ? selectedClass : 'text-white-0'}`}>
							<div className="w-full font-main font-black text-center flex justify-center text-xs">NEARBY</div>
						</Link>
						<Link to={!atSearch ? '/search' : null} className={`w-1/4 h-full flex flex-col justify-center rounded-4xl ${atSearch ? selectedClass : 'text-white-0'}`}>
							<div className="w-full font-main font-black text-center flex justify-center text-xs">SEARCH</div>
						</Link>
					</nav>
				</div>
			</header>
		</>
	);
}