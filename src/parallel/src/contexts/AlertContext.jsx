import { createContext, useContext, useState, createRef } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { ALERTS } from "../mixins/constants";

const AlertContext = createContext();

export function useAlert() {
	const context = useContext(AlertContext);
	if (!context) {
		throw new Error("useAlert must be used within an AlertProvider");
	}
	return context;
}

export function AlertProvider({ children }) {
	const [alerts, setAlerts] = useState([]);

	const removeAlert = (index) => {
		setAlerts(prev => {
			const newAlerts = [...prev];
			newAlerts.splice(index, 1);
			return newAlerts;
		});
	};

	const launchAlert = (type, message, autoDismiss = 5000) => {
		const newAlert = { 
			type, 
			message, 
			id: Date.now() + Math.random() 
		};

		if (autoDismiss) {
			setTimeout(() => {
				const idx = alerts.findIndex(a => a.id === newAlert.id);
				removeAlert(idx);
			}, autoDismiss);
		}

		setAlerts(prev => [...prev, newAlert]);
	};

	const typeStyle = {
		[ALERTS.INFO]: "bg-blue-2 border-3 border-blue-1 text-white-1",
		[ALERTS.WARNING]: "bg-yellow-2 border-3 border-yellow-1 text-white-1",
		[ALERTS.ERROR]: "bg-red-2 border-3 border-red-1 text-white-1",
		[ALERTS.SUCCESS]: "bg-green-1 border-3 border-green-0 text-white-1",
	};

	return (
		<AlertContext.Provider value={{ launchAlert }}>
			{children}
			<div className="fixed top-0 left-0 right-0 m-auto z-100 flex flex-col items-center w-full mt-2 px-2">
				<TransitionGroup component={null}>
					{alerts.map((a, i) => {
						const nodeRef = createRef();
						return (
							<CSSTransition 
								key={a.id} 
								timeout={150} 
								classNames="pop-in" 
								nodeRef={nodeRef}
							>
								<div 
									ref={nodeRef}
									className={`${typeStyle[a.type]} p-2 rounded-md font-main font-bold w-full sm:w-1/2 mb-2 shadow-lg shadow-gray-0 text-gray-2 flex justify-between`} 
								>
									<p>{a.message}</p>
									<div className="min-w-6">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6 cursor-pointer" onClick={() => removeAlert(i)}>
											<path fill="currentColor" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
										</svg>
									</div>
								</div>
							</CSSTransition>
						);
					})}
				</TransitionGroup>
			</div>
		</AlertContext.Provider>
	);
}
