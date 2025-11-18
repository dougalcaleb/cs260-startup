import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'
import Header from './shared/Header'
import Login from './pages/Login';
import Library from './pages/Library';
import Nearby from './pages/Nearby';
import Search from './pages/Search';
import Connect from './pages/Connect';
import NavFooter from './shared/NavFooter';
import { useAuth } from 'react-oidc-context';
import LogoFooter from './shared/LogoFooter';
import Button from './shared/Button';
import Spinner from './shared/Spinner';
import {ALERTS, DID_LOGIN_KEY, SKIP_SIGNIN_KEY, USER_PROFILE_KEY} from '../mixins/constants';
import { useAlert } from '../contexts/AlertContext';
import useAuthUser from '../hooks/useAuthUser';
import { authPost } from '../mixins/api';
import { useEffect } from 'react';
import { useGlobalState } from '../contexts/StateProvider';

export default function Root() {
	const location = useLocation();
	const auth = useAuth();
	const navigate = useNavigate();
	const authUser = useAuthUser();
	const { launchAlert } = useAlert();

	const { setUsername } = useGlobalState();

	useEffect(() => {
		const doReq = async () => {
			if (authUser?.uuid && !window.sessionStorage.getItem(DID_LOGIN_KEY)) {
				window.sessionStorage.setItem(DID_LOGIN_KEY, true);
				try {
					await authPost("/api/mongo/user/login", authUser.authToken, {
						uuid: authUser.uuid,
						username: authUser.username
					})
				} catch (e) {
					launchAlert(ALERTS.WARNING, "Could not finish logging in. Some features may not function. Please refresh the page.");
					console.error(e);
				}

				if (!window.sessionStorage.getItem(USER_PROFILE_KEY)) {
					window.sessionStorage.setItem(USER_PROFILE_KEY, "{}");
					try {
						const data = await authPost("/api/mongo/user/get-user", authUser.authToken, {
							uuid: authUser.uuid
						});
						window.sessionStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data));
						setUsername(data?.username || null);
					} catch (e) {
						window.sessionStorage.removeItem(USER_PROFILE_KEY);
						launchAlert(ALERTS.WARNING, "Could not get user data. Some features may not function. Please refresh the page.");
						console.error(e);
					}
				}
			} else if (window.sessionStorage.getItem(DID_LOGIN_KEY) && window.sessionStorage.getItem(USER_PROFILE_KEY)) {
				const userProfile = JSON.parse(window.sessionStorage.getItem(USER_PROFILE_KEY));
				setUsername(userProfile?.username || null);
			}
		};

		doReq();
	}, [authUser, setUsername]);

	let rCorners = null;
	if (!["/login"].includes(location.pathname)) {
		rCorners = (
			<div className="flex justify-between sticky top-[7vh] sm:top-[max(7vh,70px)] -mb-8">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className="text-gray-3 h-8 w-8">
					<path fill="currentColor" d="M500,0C223.86,0,0,223.86,0,500V0h500Z" />
				</svg>

				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className="text-gray-3 h-8 w-8">
					<path fill="currentColor" d="M500,500C500,223.86,276.14,0,0,0h500v500Z" />
				</svg>
			</div>
		);
	}

	if (auth.isLoading) {
		return (
			<>
				<div className="flex justify-center mt-20">
					<div className="flex items-center text-gray-8">
						<Spinner className="h-8"></Spinner>
						<div className="font-main font-black ml-4">LOADING, PLEASE WAIT...</div>
					</div>
				</div>

				<LogoFooter />
			</>
		);
	}

	if (auth.error) {
		const forceReload = () => {
			navigate("/library", { replace: true });
			window.location.href = `${window.location.href}`;
		}

		return (
			<div className="flex flex-col items-center">
				<p className="text-red-1 font-black text-center text-3xl mt-20 px-4">AUTHENTICATION ERROR</p>
				<div className="text-center text-sub text-gray-7 mt-8">
					<p>Sorry, that didn't work.</p>
					<p>Reload the page or try again later.</p>
				</div>
				<div className="text-center text-sub text-gray-7 mt-8">Auth error: ({auth.error.message})</div>

				<Button className="mt-8" onClick={forceReload}>Reload</Button>

				<LogoFooter />
			</div>
		);
	}

	const navAllowed = auth.isAuthenticated || window.sessionStorage.getItem(SKIP_SIGNIN_KEY); // || import.meta.env.DEV;

	return (
		<>
			{!["/login"].includes(location.pathname) && <Header />}
			
			<main>

				{rCorners}

				<Routes>
					<Route path="/" element={navAllowed ? <Library /> : <Navigate replace to="/login" />} />
					<Route path="/login" element={<Login />} />
					<Route path="/library" element={navAllowed ? <Library /> : <Navigate replace to="/login" />} />
					<Route path="/nearby" element={navAllowed ? <Nearby /> : <Navigate replace to="/login" />} />
					<Route path="/search" element={navAllowed ? <Search /> : <Navigate replace to="/login" />} />
					<Route path="/connect" element={navAllowed ? <Connect /> : <Navigate replace to="/login" />} />
					<Route path="*" element={navAllowed ? <Navigate replace to="/library" /> : <Navigate replace to="/login" />} />
				</Routes>
				
			</main>

			{!["/login"].includes(location.pathname) && <NavFooter />}
		</>
	)	
}