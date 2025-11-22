import {createPortal} from "react-dom";
import Button from "./Button";
import { CSSTransition } from "react-transition-group";
import { useEffect, useRef, useState } from "react";
import { BTN_VARIANTS, POPUP_VARIANTS } from "../../mixins/constants";

export default function Popup({
	children,
	open,
	bodyStyle="h-1/2 w-4/5 sm:h-1/2 sm:w-1/3",
	headerText = "",
	header = null,
	buttons = [],
	xClicked,
	preventXReset = false,
	originalState,
	setState,
	xDisabled = false,
	variant = POPUP_VARIANTS.DEFAULT,
	layer = 0
}) {
	const bgRef = useRef(null);
	const popupRef = useRef(null);

	const [renderComp, setRenderComp] = useState(false);
	const [popupOpen, setPopupOpen] = useState(false);

	// Holds a snapshot of originalState when the popup first opens.
	const stateOnOpenRef = useRef(null);

	useEffect(() => {
		if (open) {
			// Capture the state once when opening if we haven't already this cycle
			if (stateOnOpenRef.current === null) {
				stateOnOpenRef.current = structuredClone(originalState);
			}
			setRenderComp(true);
			setTimeout(() => {
				setPopupOpen(true);
			}, 0);
		} else {
			setPopupOpen(false);
			setTimeout(() => {
				setRenderComp(false);
				// Clear snapshot after closing so the next open can capture a new one
				stateOnOpenRef.current = null;
			}, 200);
		}
	}, [open, originalState]);

	if (!renderComp) {
		return null;
	}

	const buttonClicked = (button) => {
		if ((button.variant === BTN_VARIANTS.CANCEL && !button.preventReset) || button.doReset) {
			setState?.(stateOnOpenRef.current);
		}
		button.onClick();
	};

	const closeClicked = () => {
		if (!preventXReset) {
			setState?.(stateOnOpenRef.current);
		}
		xClicked();
	};

	const bodyVariantStyle = variant === POPUP_VARIANTS.DEFAULT
		? "bg-gray-4 rounded-lg shadow-lg"
		: "backdrop-blur-sm";
	
	const headerVariantStyle = variant === POPUP_VARIANTS.DEFAULT
		? "bg-gray-5"
		: "";
	
	const footerVariantStyle = variant === POPUP_VARIANTS.DEFAULT
		? "bg-gray-3 justify-end"
		: "justify-center py-4";
	
	const buttonVariantStyle = variant === POPUP_VARIANTS.DEFAULT
		? "ml-2"
		: "";
	
	// using a map instead of calculation so Tailwind picks up the classes
	const zLayers = {
		"0": "z-50",
		"1": "z-60",
		"2": "z-70",
		"3": "z-80"
	};
	
	return createPortal(
		<>
			<CSSTransition nodeRef={bgRef} in={popupOpen} timeout={200} classNames="overlay-bg" unmountOnExit>
				<div ref={bgRef} className={`fixed top-0 bottom-0 right-0 left-0 bg-gray-1 opacity-80 h-dvh ${zLayers[layer]}`}></div>
			</CSSTransition>

			<CSSTransition nodeRef={popupRef} in={popupOpen} timeout={150} classNames="pop-in">
				<div ref={popupRef} className={`fixed top-0 bottom-0 right-0 left-0 m-auto shadow-gray-0 overflow-hidden flex flex-col ${popupOpen ? '' : 'invisible'} ${bodyVariantStyle} ${bodyStyle} ${zLayers[layer+1]}`}>
					<div className={`w-full h-12 flex justify-between items-center px-4 ${headerVariantStyle}`}>
						{header || (
							<p className="font-main text-white-0 font-bold">
								{headerText}
							</p>
						)}
						{!xDisabled && <div className="text-white-0 hover:text-red-1 h-6 w-6 cursor-pointer" onClick={closeClicked}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
								<path fill="currentColor" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
							</svg>
						</div>}
					</div>

					<div className="flex-1 overflow-y-auto">
						{children}
					</div>

					{(buttons && buttons.length || "") && <div className={`h-12 w-full flex items-center px-4 ${footerVariantStyle}`}>
						{buttons.map((btn, i) => (
							<Button key={`popup-${headerText}-btn-${i}`} className={`px-4 py-1 text-sm rounded-sm ${buttonVariantStyle}`} onClick={() => buttonClicked(btn)} variant={btn.variant}>{btn.text}</Button>
						))}
					</div>}
				</div>
			</CSSTransition>
		</>,
		document.body
	);
}