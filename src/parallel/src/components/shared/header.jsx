import { Link, useLocation, useNavigate } from "react-router-dom";
import parallelLogo from "../../assets/parallel-icon.svg"
import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import Popup from "./Popup";
import useAuthUser from "../../hooks/useAuthUser";
import { ALERTS, BTN_VARIANTS, URL_BASE, USER_PROFILE_KEY } from "../../mixins/constants";
import { authPost } from "../../mixins/api";
import { useAlert } from "../../contexts/AlertContext";
import Input from "./Input";
import Spinner from "./Spinner";
import { useGlobalState } from "../../contexts/StateProvider";
import ProfileImage from "../pages/ProfileImage";

export default function Header() {
	const location = useLocation();
	const authUser = useAuthUser();
	const navigate = useNavigate();
	const { launchAlert } = useAlert();

	const { username, setUsername, isComparing, setIsComparing, setConnectImages, setConnectImgMetadata, setImagesLoaded, setComparingWith } = useGlobalState();

	const atLibrary = location.pathname === `${URL_BASE}/library` || location.pathname === `${URL_BASE}/`;
	const atNearby = location.pathname === `${URL_BASE}/nearby`;
	const atSearch = location.pathname === `${URL_BASE}/search`;

	const selectedClass = "bg-green-2 text-gray-1";
	const bgGray3 = "hsl(0, 0%, 16%)";

	const headerRef = useRef(null);
	const bigLogoRef = useRef(null);

	const [profilePopupOpen, setProfilePopupOpen] = useState(false);
	const [bigLogoStyle, setBigLogoStyle] = useState({ top: 0 });
	const [smallLogoStyle, setSmallLogoStyle] = useState({ opacity: 1 });
	const [headerStyle, setHeaderStyle] = useState({ background: bgGray3 });
	const [tmpUsername, setTmpUsername] = useState("");
	const [loadingPopupOpen, setLoadingPopupOpen] = useState(false);

	useEffect(() => {
		if (window.innerWidth < 700) {
			const headerBound = headerRef.current?.getBoundingClientRect();
			setBigLogoStyle({ top: `${headerBound.bottom / 2 - bigLogoRef.current.getBoundingClientRect().height / 2}px` });
			setSmallLogoStyle({ opacity: 0 });
		}
	}, []);

	// Attach scroll handler once with cleanup to avoid stacking listeners
	useEffect(() => {
		const onScroll = () => {
			if (window.innerWidth < 700) {
				const headerBound = headerRef.current?.getBoundingClientRect();
				let logoHeight = bigLogoRef.current.getBoundingClientRect().height;
				const percentScrolled = (window.scrollY / (window.innerHeight / 5));

				setBigLogoStyle({ top: `${headerBound.bottom / 2 - logoHeight / 2}px`, opacity: Math.min(1, 1 - percentScrolled * 3) });
				setSmallLogoStyle({ opacity: Math.min(1, (percentScrolled - 0.3) * 3) });

				if (percentScrolled >= 0.98) {
					setHeaderStyle({ background: bgGray3})
				} else {
					setHeaderStyle({ background: "rgba(0,0,0,0)" });
				}
			}
		};
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const saveUsername = async () => {
		setLoadingPopupOpen(true);
		setProfilePopupOpen(false);

		try {
			await authPost("/api/user/set-username", authUser.authToken, {
				uuid: authUser.uuid,
				username: tmpUsername
			});
			setUsername(tmpUsername);
			// Persist to session storage so future opens reflect the saved name
			try {
				const stored = window.sessionStorage.getItem(USER_PROFILE_KEY);
				const data = stored ? JSON.parse(stored) : {};
				data.username = tmpUsername;
				window.sessionStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data));
			} catch { /* ignore malformed session storage */ }
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Save failed: " + (e.message || e.toString()));
		} finally {
			setLoadingPopupOpen(false);
		}
	}

	const openProfilePopup = () => {
		setProfilePopupOpen(true);
		setTmpUsername(username);
	}

	const returnToHome = () => {
		setConnectImages([]);
		setConnectImgMetadata(new Map());
		setImagesLoaded(new Set());
		setComparingWith(null);
		setIsComparing(false);
		navigate(`${URL_BASE}/library`);
	}

	return (
		<>
			<div id="pre-header" className="flex sm:hidden justify-center h-[20vh]">
				<div ref={bigLogoRef} id="pre-header-logo" className="fixed flex flex-col items-center w-full" style={bigLogoStyle}>
					<img src={parallelLogo} className="h-8" />
					<p className="font-header text-white-0 text-4xl mt-4 font-black">PARALLEL</p>
				</div>
			</div>

			<header ref={headerRef} className="sticky flex justify-between h-[7vh] w-full m-0 sm:h-[max(7vh,70px)] top-0 items-center z-10" style={headerStyle}>
				<div  className="flex items-center justify-between w-full sm:mr-8" >
					<div className="flex items-center"  style={smallLogoStyle}>
						<img src={parallelLogo} className="h-4 ml-5 sm:h-5 sm:ml-8" />
						<p className="font-header text-white-0 ml-2.5 sm:text-2xl font-black">PARALLEL</p>
					</div>
					<div className="relative z-30">
						<div className="flex items-center cursor-pointer sm:hover:bg-gray-5 px-6 py-2 rounded-md z-30" onClick={openProfilePopup}>
							<p className="font-main text-gray-7 font-bold mr-3 sm:mr-4 select-none text-right">{username || authUser.username}</p>
							<ProfileImage isSelf className="w-7 h-7 sm:h-8 sm:w-8" />
						</div>
						<Popup
							bodyStyle="h-2/3 w-full md:w-2/3 md:h-1/2 lg:w-1/2 xl:w-1/3 lg:h-2/3"
							headerText="PROFILE"
							buttons={[
								{ text: "Cancel", onClick: () => setProfilePopupOpen(false), variant: BTN_VARIANTS.CANCEL },
								{ text: "Save", onClick: saveUsername },
							]}
							open={profilePopupOpen}
							xClicked={() => setProfilePopupOpen(false)}
							originalState={tmpUsername}
							setState={setTmpUsername}
						>
							<div className="flex flex-col justify-between items-center h-full py-4 px-4">
								<div className="flex flex-col-reverse sm:flex-row">
									<Input value={tmpUsername} onChange={ (d) => setTmpUsername(d) } placeholder="Username" className="mr-4 h-max" />
									<p className="text-gray-7 font-main font-bold italic mb-2">Your username. This is how you will be displayed to others, and how they can search for you.</p>
								</div>
								<Button className="px-4 py-2 w-1/2" onClick={authUser.signOut}>Sign out</Button>
							</div>
						</Popup>

						<Popup
							bodyStyle="h-1/4 w-2/3 sm:w-90"
							headerText="SAVING"
							open={loadingPopupOpen}
							xDisabled
						>
							<div className="flex w-full h-full flex-col justify-center px-4">
								<div className="flex text-white justify-center font-main items-center">
									<Spinner className="h-8 mr-4" /> Saving, please wait...
								</div>
							</div>
						</Popup>
					</div>
				</div>
			
				{!isComparing && (
					<div className="w-[30vw] min-w-max mr-8 hidden sm:inline">
						<nav className="bg-gray-1 w-full h-6 rounded-4xl flex justify-between items-center">
							<Link to={!atLibrary ? `${URL_BASE}/library` : null} className={`w-1/4 min-w-max h-full flex flex-col justify-center rounded-4xl ${atLibrary ? selectedClass : 'text-white-0'}`}>
								<div className="w-full font-main font-black text-center flex justify-center text-xs px-6">YOU</div>
							</Link>
							<Link to={!atNearby ? `${URL_BASE}/nearby` : null} className={`w-1/4 min-w-max h-full flex flex-col justify-center rounded-4xl ${atNearby ? selectedClass : 'text-white-0'}`}>
								<div className="w-full font-main font-black text-center flex justify-center text-xs px-6">NEARBY</div>
							</Link>
							<Link to={!atSearch ? `${URL_BASE}/search` : null} className={`w-1/4 min-w-max h-full flex flex-col justify-center rounded-4xl ${atSearch ? selectedClass : 'text-white-0'}`}>
								<div className="w-full font-main font-black text-center flex justify-center text-xs px-6">SEARCH</div>
							</Link>
						</nav>
					</div>
				)}

				{isComparing && (
					<div className="pr-8 hidden sm:inline">
						<Button onClick={returnToHome}>
							<p className="text-nowrap px-4 py-2">RETURN TO HOME</p>
						</Button>
					</div>
				)}
			</header>
		</>
	);
}