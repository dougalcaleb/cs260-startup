import {createPortal} from "react-dom";
import Button from "./Button";
import { CSSTransition } from "react-transition-group";
import { useEffect, useRef, useState } from "react";
import { BTN_VARIANTS } from "../../mixins/constants";

export default function Popup({
	children,
	open,
	bodyStyle="h-1/2 w-4/5 sm:h-1/2 sm:w-1/3",
	headerText = "",
	buttons = [],
	xClicked,
	preventXReset = false,
	originalState,
	setState,
}) {
	const bgRef = useRef(null);
	const popupRef = useRef(null);
	const popupHeaderRef = useRef(null);
	const popupFooterRef = useRef(null);

	const [renderComp, setRenderComp] = useState(false);
	const [popupOpen, setPopupOpen] = useState(false);
	const [popupBodyStyle, setPopupBodyStyle] = useState({});

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

	useEffect(() => {
		if (!open) return;
		
		setTimeout(() => {
			const headerBBox = popupHeaderRef.current.getBoundingClientRect();
			const footerBBox = popupFooterRef?.current?.getBoundingClientRect();
			const lowerBound = footerBBox
				? footerBBox.top
				: popupRef.current.getBoundingClientRect().bottom;
			
			const height = lowerBound - headerBBox.bottom;
			setPopupBodyStyle({ height: `${height}px` });
		}, 0);
	}, [open, popupHeaderRef, popupFooterRef, popupRef]);
	
	if (!renderComp) {
		return null;
	}

	const buttonClicked = (button) => {
		if ((button.variant === BTN_VARIANTS.CANCEL && !button.preventReset) || button.doReset) {
			setState(stateOnOpenRef.current);
		}
		button.onClick();
	};

	const closeClicked = () => {
		if (!preventXReset) {
			setState(stateOnOpenRef.current);
		}
		xClicked();
	};

	return createPortal(
		<>
			<CSSTransition nodeRef={bgRef} in={popupOpen} timeout={200} classNames="overlay-bg" unmountOnExit>
				<div ref={bgRef} className="fixed top-0 bottom-0 right-0 left-0 bg-gray-1 opacity-80 z-50 h-dvh"></div>
			</CSSTransition>

			<CSSTransition nodeRef={popupRef} in={popupOpen} timeout={150} classNames="pop-in">
				<div ref={popupRef} className={`invisible fixed bg-gray-4 rounded-lg top-0 bottom-0 right-0 left-0 m-auto shadow-lg shadow-gray-0 z-60 overflow-hidden ${bodyStyle}`}>
					<div ref={popupHeaderRef} className="bg-gray-5 w-full h-12 flex justify-between items-center px-4">
						<p className="font-main text-white-0 font-bold">
							{headerText}
						</p>
						<div className="text-white-0 hover:text-red-1 h-6 w-6 cursor-pointer" onClick={closeClicked}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
								<path fill="currentColor" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
							</svg>
						</div>
					</div>

					<div className="overflow-y-auto" style={popupBodyStyle}>
						{children}
					</div>

					{(buttons && buttons.length || "") && <div ref={popupFooterRef} className="bg-gray-3 absolute bottom-0 h-12 w-full flex items-center justify-end px-4">
						{buttons.map((btn, i) => (
							<Button key={`popup-${headerText}-btn-${i}`} className="py-1 text-sm rounded-sm ml-2" onClick={() => buttonClicked(btn)} variant={btn.variant}>{btn.text}</Button>
						))}
					</div>}
				</div>
			</CSSTransition>
			
		</>,
		document.body
	);
}