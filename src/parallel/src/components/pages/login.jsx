import parallelLogo from "../../assets/parallel-icon.svg"
import { Link } from "react-router-dom";
import Input from "../shared/input";
import { useState } from "react";

export default function Login() {
	const [doLogin, setDoLogin] = useState(true);
	const selectedClass = "bg-green-2 text-gray-1";

	const selectLogin = () => setDoLogin(true);
	const selectRegister = () => setDoLogin(false);

	return (
		<div className="bg-gray-3 h-full w-full">
			<div className="bg-gray-3 h-max absolute top-1/4 w-full">
				<div className="flex flex-col items-center">
					<div className="font-main text-white-0 text-sm mb-4 font-black flex bg-gray-1 rounded-full w-60">
						<div className={`py-1 rounded-full cursor-pointer w-1/2 text-center ${doLogin ? selectedClass : ''}`} onClick={selectLogin}>LOGIN</div>
						<div className={`py-1 rounded-full cursor-pointer w-1/2 text-center ${doLogin ? '' : selectedClass}`} onClick={selectRegister}>REGISTER</div>
					</div>
					<Input type="text" placeholder="Username" className="mb-4"></Input>
					<Input type="password" placeholder="Password" className="mb-4"></Input>
					{!doLogin && <Input type="Password" placeholder="Retype password" className="mb-4"></Input>}
					<Link to="/library">
						<button className="bg-green-2 text-gray-3 cursor-pointer">GO</button>
					</Link>
				</div>
			</div>

			<footer className="fixed w-full bottom-0 h-1/3 flex flex-col justify-around items-center">
				<div className="z-10 flex flex-col items-center w-full">
					<img src={parallelLogo} className="parallel-icon h-8" />
					<p className="font-main text-white-0 text-[2rem] font-black mt-4">PARALLEL</p>
				</div>
				<div id="credit" className="font-main text-gray-6 flex font-black">
					BUILT BY CALEB DOUGAL
					<a href="https://github.com/dougalcaleb/cs260-startup" target="_blank" className="text-green-2">
						<div className="flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 ml-2.5 mr-1.5"><title>github</title><path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" /></svg>
							GitHub
						</div>
					</a>
				</div>
			</footer>
		</div>
	);
}