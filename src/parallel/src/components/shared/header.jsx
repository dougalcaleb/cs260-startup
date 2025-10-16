import { Link, useLocation } from "react-router-dom";
import parallelLogo from "../../assets/parallel-icon.svg"
import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import Popup from "./Popup";
import useAuthUser from "../../hooks/useAuthUser";
import { BTN_VARIANTS } from "../../mixins/constants";

export default function Header() {
	const location = useLocation();
	const authUser = useAuthUser();

	const atLibrary = location.pathname === '/library' || location.pathname === "/";
	const atNearby = location.pathname === '/nearby';
	const atSearch = location.pathname === '/search';

	const selectedClass = "bg-green-2 text-gray-1";

	const headerRef = useRef(null);
	const bigLogoRef = useRef(null);

	const [profilePopupOpen, setProfilePopupOpen] = useState(false);
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
			let logoHeight = bigLogoRef.current.getBoundingClientRect().height;
			const percentScrolled = (window.scrollY / (window.innerHeight / 5));

			setBigLogoStyle({ top: `${headerBound.bottom / 2 - logoHeight / 2}px`, opacity:  Math.min(1, 1 - percentScrolled * 3) });
			setSmallLogoStyle({ opacity: Math.min(1, (percentScrolled - 0.3) * 3) });
		}
	});

	const placeholderUser = (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-4 w-4 sm:h-5 :w-5">
			<path fill="currentColor" d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z" />
		</svg>
	);

	return (
		<>
			<div id="pre-header" className="flex sm:hidden justify-center h-[20vh]">
				<div ref={bigLogoRef} id="pre-header-logo" className="fixed z-10 flex flex-col items-center w-full" style={bigLogoStyle}>
					<img src={parallelLogo} className="h-8" />
					<p className="font-header text-white-0 text-4xl mt-4 font-black">PARALLEL</p>
				</div>
			</div>

			<header ref={headerRef} className="sticky bg-gray-3 flex justify-between h-[7vh] w-full m-0 sm:h-[max(7vh,70px)] top-0 items-center">
				<div  className="flex items-center justify-between w-full sm:mr-8" >
					<div className="flex items-center"  style={smallLogoStyle}>
						<img src={parallelLogo} className="h-4 ml-5 sm:h-5 sm:ml-8" />
						<p className="font-header text-white-0 ml-2.5 sm:text-2xl font-black">PARALLEL</p>
					</div>
					<div className="relative">
						<div className="flex items-center cursor-pointer sm:hover:bg-gray-5 px-6 py-2 rounded-md" onClick={() => setProfilePopupOpen(true)}>
							<p className="font-main text-gray-7 font-bold mr-3 sm:mr-4 select-none">{authUser.username}</p>
							<div className="text-green-2 bg-green-0 rounded-full w-7 h-7 sm:h-8 sm:w-8 flex justify-center items-center overflow-hidden">
								{authUser.picture ? (
									<img
										src={authUser.picture}
										alt="Profile"
										referrerPolicy="no-referrer"
										crossOrigin="anonymous"
										className="w-full h-full object-cover"
									/>
								) : placeholderUser}
							</div>
						</div>
						<Popup
							headerText="PROFILE"
							buttons={[
								{ text: "Cancel", onClick: () => setProfilePopupOpen(false), variant: BTN_VARIANTS.CANCEL },
								{ text: "Save", onClick: () => setProfilePopupOpen(false) },
							]}
							open={profilePopupOpen}
							xClicked={() => setProfilePopupOpen(false)}
						>
							<div className="flex justify-center pt-4">
								<Button className="px-4 py-2" onClick={authUser.signOut}>Sign out</Button>
							</div>
						</Popup>
					</div>
				</div>
			
				<div className="w-[30vw] min-w-max mr-8 hidden sm:inline">
					<nav className="bg-gray-1 w-full h-6 rounded-4xl flex justify-between items-center">
						<Link to={!atLibrary ? '/library' : null} className={`w-1/4 min-w-max h-full flex flex-col justify-center rounded-4xl ${atLibrary ? selectedClass : 'text-white-0'}`}>
							<div className="w-full font-main font-black text-center flex justify-center text-xs px-6">YOU</div>
						</Link>
						<Link to={!atNearby ? '/nearby' : null} className={`w-1/4 min-w-max h-full flex flex-col justify-center rounded-4xl ${atNearby ? selectedClass : 'text-white-0'}`}>
							<div className="w-full font-main font-black text-center flex justify-center text-xs px-6">NEARBY</div>
						</Link>
						<Link to={!atSearch ? '/search' : null} className={`w-1/4 min-w-max h-full flex flex-col justify-center rounded-4xl ${atSearch ? selectedClass : 'text-white-0'}`}>
							<div className="w-full font-main font-black text-center flex justify-center text-xs px-6">SEARCH</div>
						</Link>
					</nav>
				</div>
			</header>
		</>
	);
}