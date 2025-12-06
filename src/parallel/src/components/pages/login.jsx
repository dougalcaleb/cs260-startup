import { Link, useNavigate } from "react-router-dom";
import Input from "../shared/Input";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import LogoFooter from "../shared/LogoFooter";
import Button from "../shared/Button";
import {LOGIN_MODES, SKIP_SIGNIN_KEY} from "../../mixins/constants";
import { isMobileDevice } from "../../mixins/screen";

export default function Login() {
	const auth = useAuth();
	const navigate = useNavigate();

	const [loginMode, setLoginMode] = useState(LOGIN_MODES.LOGIN_COGNITO);

	const selectLogin = () => setLoginMode(LOGIN_MODES.LOGIN_SIMPLE);
	const selectCognito = () => setLoginMode(LOGIN_MODES.LOGIN_COGNITO);
	const skipSignIn = () => {
		window.sessionStorage.setItem(SKIP_SIGNIN_KEY, true);
		navigate("/library");
	};

	return (
		<div className="bg-gray-3 h-full w-full">
			<div className="bg-gray-3 h-max absolute top-14 sm:top-1/5 w-full">
				<div className="flex flex-col items-center">
					<p className="font-main text-gray-9 font-bold text-4xl px-4 text-center">
						Instantly connect {isMobileDevice() && <br />} with others.
					</p>
					<p className="font-main text-gray-7 font-bold text-lg mt-12 mb-4">GET STARTED</p>
					
					{loginInput(loginMode, auth)}
					
					<div className="mt-8 flex">
						{/* {loginMode === LOGIN_MODES.LOGIN_COGNITO && (<p className="text-blue-0 font-main cursor-pointer mr-4" onClick={selectLogin}>Simple sign-in</p>)} */}
						{loginMode !== LOGIN_MODES.LOGIN_COGNITO && (<p className="text-blue-0 font-main cursor-pointer mr-4" onClick={selectCognito}>Sign in</p>)}
						{/* <p className="text-blue-0 font-main cursor-pointer border-gray-6 pl-4" onClick={skipSignIn}>Skip sign-in</p> */}
					</div>
				</div>
			</div>

			<LogoFooter showCredit />

			<div className="absolute top-0 right-0 p-2">
				{window.sessionStorage.getItem(SKIP_SIGNIN_KEY) && (<div>
					<p className="text-gray-6">Skip sign-in is enabled.</p>
					<p className="text-blue-0 text-right">
						<span className="cursor-pointer" onClick={() => { window.sessionStorage.removeItem(SKIP_SIGNIN_KEY); navigate(0); }}>Disable</span>
					</p>
				</div>)}
			</div>
		</div>
	);
}

function loginInput(mode, auth) {
	switch (mode) {
		case LOGIN_MODES.LOGIN_COGNITO:
			return (
				<>
					<Button className="bg-green-1 text-gray-3 cursor-pointer py-4 px-8" onClick={() => auth.signinRedirect()}>
						<div>
							<p className="px-14 text-xl">SIGN IN</p>
							<div className="flex justify-around h-7 mt-4 text-white-0">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
									<path fill="currentColor" d="M564 325.8C564 467.3 467.1 568 324 568C186.8 568 76 457.2 76 320C76 182.8 186.8 72 324 72C390.8 72 447 96.5 490.3 136.9L422.8 201.8C334.5 116.6 170.3 180.6 170.3 320C170.3 406.5 239.4 476.6 324 476.6C422.2 476.6 459 406.2 464.8 369.7L324 369.7L324 284.4L560.1 284.4C562.4 297.1 564 309.3 564 325.8z" />
								</svg>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
									<path fill="currentColor" d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z" />
								</svg>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
									<path fill="currentColor" d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z" />
								</svg>
							</div>
							
						</div>
					</Button>
				</>
			);
		case LOGIN_MODES.LOGIN_SIMPLE:
			return (
				<>
					<Input type="text" placeholder="Username" className="mb-4"></Input>
					<Input type="password" placeholder="Password" className="mb-4"></Input>
					<Link to="/library">
						<Button className="text-gray-3 cursor-pointer px-8 py-2">GO</Button>
					</Link>
				</>
			);
		case LOGIN_MODES.REGISTER:
			return (
				<>
					<Input type="text" placeholder="Username" className="mb-4"></Input>
					<Input type="password" placeholder="Password" className="mb-4"></Input>
					<Input type="Password" placeholder="Retype password" className="mb-4"></Input>
					<Link to="/library">
						<Button className="text-gray-3 cursor-pointer p-4">SIGN UP</Button>
					</Link>
				</>
			);
	}
}
