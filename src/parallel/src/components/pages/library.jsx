import { useState, useRef, useEffect, useCallback } from "react";
import { CSSTransition } from 'react-transition-group'
import Button from "../shared/Button";
import { isMobileScreen, isMobileDevice } from "../../mixins/screen";
import Popup from "../shared/Popup";
import { ALERTS, BTN_VARIANTS, PAGES, POPUP_VARIANTS, WS_ADD_LOC_OPEN, WS_ADD_LOC_UPDATE, WS_GEOCODE_UPDATE, WS_UPLOAD_OPEN } from "../../mixins/constants";
import Input from "../shared/Input";
import FilePicker from "../shared/FilePicker";
import { authGet, authPost, openWS } from "../../mixins/api";
import useAuthUser from "../../hooks/useAuthUser";
import { useAlert } from "../../contexts/AlertContext";
import Spinner from "../shared/Spinner";
import { useGlobalState } from "../../contexts/StateProvider";
import ImageDisplay from "../shared/ImageDisplay";
import LocationPicker from "../shared/LocationPicker";
import { getRandomLocation, getRandomTimestamp, pickByChance } from "../../mixins/randomData";
import { formatDate } from "../../mixins/format";

const placeholderImages = Object.entries(import.meta.glob("../../assets/images/ph-*.jpg", { eager: true, import: "default" }))
	.map(([path, src]) => ({ src, index: Number(path.match(/ph-(\d+)\.jpg/)?.[1] ?? 0) }))
	.sort((a, b) => a.index - b.index)
	.map(({ src, index }) => ({ url: src, key: `ph-image-${index}` }));

export default function Library() {
	/**===========================================================
	 * STATE
	 =============================================================*/
	
	// Hooks
	const authUser = useAuthUser();
	const { launchAlert } = useAlert();
	const { libImages, setLibImages, setImagesLoaded, setLibImgMetadata, nearbySocket, setNearbySocket, setConnectedToNearby, setConnectingToNearby, setSelfSummary } = useGlobalState();

	// State
	const [menuOpen, setMenuOpen] = useState(false);
	const [locBtnShow, setLocBtnShow] = useState(false);
	const [imgBtnShow, setImgBtnShow] = useState(false);
	const [uploadLocPopupOpen, setLocPopupOpen] = useState(false);
	const [uploadImgPopupOpen, setImgPopupOpen] = useState(false);
	const [loadingPopupOpen, setLoadingPopupOpen] = useState(false);
	const [locPickerOpen, setLocPickerOpen] = useState(false);
	const [locations, setLocations] = useState([""]);
	const [pendingLocations, setPendingLocations] = useState([]);
	const [imagesToUpload, setImagesToUpload] = useState([]);

	// Refs
	const imageBtnRef = useRef(null);
	const locationBtnRef = useRef(null);
	const nodeRefBG = useRef(null);

	// State-setting helpers
	const toggleOpen = () => {
		if (menuOpen) {
			setImgBtnShow(false);
			setTimeout(() => {
				setLocBtnShow(false);
			}, 50);
		} else {
			setLocBtnShow(true);
			setTimeout(() => {
				setImgBtnShow(true);
			}, 50);
		}
		setMenuOpen(!menuOpen);
	};

	const openLocationPopup = () => {
		toggleOpen();
		setLocPopupOpen(true);
	};

	const openImagePopup = () => {
		toggleOpen();
		setImgPopupOpen(true);
	};

	const addLocation = (value = "") => {
		setLocations(prevLocations => [...prevLocations, value]);
	};

	const addPendingLocation = () => {
		setPendingLocations([...pendingLocations, {}]);
		setLocPickerOpen(true);
	};

	const removePendingLocation = (index) => {
		const newLocations = [...pendingLocations];
		newLocations.splice(index, 1);
		setPendingLocations(newLocations);
	}

	const setLastPendingLocation = (value) => {
		const newLocations = [...pendingLocations];
		newLocations[newLocations.length - 1] = value;
		setPendingLocations(newLocations);
	};

	const setLocation = (index, value) => {
		const newLocations = [...locations];
		newLocations[index] = value;
		setLocations(newLocations);
	};

	const setLastLocation = (value) => {
		setLocation(locations.length - 1, value);
	}

	const cancelLocPicker = () => {
		const newLocations = pendingLocations.slice(0, -1);
		setPendingLocations(newLocations);
		setLocPickerOpen(false);
	}

	const removeLocation = (index) => {
		const newLocations = [...locations];
		newLocations.splice(index, 1);
		setLocations(newLocations);
	};

	const saveLocations = async () => {
		setLocPopupOpen(false);
		await authPost("/api/user/set-locations", authUser.authToken, { locations });
	}

	const processLocation = async () => {
		const processingLoc = pendingLocations[pendingLocations.length - 1];
		setLocPickerOpen(false);
		// const processWS = openWS(WS_ADD_LOC_OPEN, authUser.uuid);
		// processWS.onmessage = (evt) => {
		// 	const message = JSON.parse(evt.data);
				
			// if (message.type === WS_ADD_LOC_UPDATE) {
				removePendingLocation(pendingLocations.findIndex(l => l === processingLoc));
				// if (message.updates) {
					// message.updates.forEach(update => {
						addLocation(getRandomLocation());
					// });
				// }
			// }
		// }

		// await authPost("/api/user/add-location", authUser.authToken, processingLoc);
	}

	/**===========================================================
	 * MINI-COMPONENTS
	 =============================================================*/
	
	const imgButton = (
		<CSSTransition nodeRef={imageBtnRef} in={imgBtnShow} timeout={150} classNames="pop-in" key="img-btn" unmountOnExit>
			<div ref={imageBtnRef} className="invisible">
				<Button className="rounded-2xl my-2 shadow-gray-0 shadow-lg sm:z-10 relative p-4" onClick={openImagePopup}>IMAGES</Button>
			</div>
		</CSSTransition>
	);

	const locButton = (
		<CSSTransition nodeRef={locationBtnRef} in={locBtnShow} timeout={150} classNames="pop-in" key="loc-btn" unmountOnExit>
			<div ref={locationBtnRef} className="invisible">
				<Button className="rounded-2xl shadow-gray-0 shadow-lg z-10 sm:z-0 relative p-4" onClick={openLocationPopup}>LOCATIONS</Button>
			</div>
		</CSSTransition>
	);

	/**===========================================================
	 * BACKEND LINK
	 =============================================================*/

	const refreshLibrary = useCallback(async () => {
		try {
			// const list = await authGet("/api/image/get-user-images", authUser.authToken);
			// if (list?.length) {
			const list = placeholderImages;
			setLibImages(list);
			setLibImgMetadata(new Map(list.map(i => [i.key, {
				location: { lat: 0.0, lng: 0.0 },
				timestamp: pickByChance(0.7, getRandomTimestamp(), null),
				readableLocation: pickByChance(0.7, getRandomLocation(), null),
			} ])));
			// } else {
			// 	setLibImages(null);
			// }
			setImagesLoaded(new Set());
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Failed to retrieve user image library: " + (e.message || e.toString()));
		}
	}, [authUser.authToken, setLibImages, setImagesLoaded]);

	const getSelfSummary = useCallback(async () => {
		try {
			// const data = await authGet("/api/user/get-user-summary", authUser.authToken);
			const parsed = {
				dates: new Set(Array.from({length: 14}).map(_ => formatDate(getRandomTimestamp()))),
				locations: new Set(Array.from({length: 8}).map(_ => getRandomLocation())),
			};
			setSelfSummary(parsed);
			setLocations(Array.from(parsed.locations));
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Failed to get own user data summary: " + (e.message || e.toString()));
		}
	}, [authUser.authToken, setSelfSummary]);

	const uploadImages = async () => {
		const imageArray = Array.from(imagesToUpload);

		if (!imageArray || imageArray.length === 0) {
			launchAlert(ALERTS.WARNING, "No images selected for upload");
			return;
		}

		if (imageArray.length > 25) {
			launchAlert(ALERTS.WARNING, "A max of 25 images can be uploaded at one time. Please upload your images in batches.");
			return;
		}

		try {
			let endpoint = imageArray.length > 1 ? "/upload-multiple" : "/upload-single";
			const formKey = imageArray.length > 1 ? "images" : "image";
			const data = new FormData();

			imageArray.forEach(img => data.append(formKey, img));

			setImgPopupOpen(false);
			setLoadingPopupOpen(true);
			setImagesToUpload([]);

			// Because we use a queue for geolocation fetching, it almost always hasn't populated by the time we call to re-fetch the user library
			// So we silently update the metadata in the background over WebSocket, so that the metadata populates without a refresh
			const uploadSocket = openWS(WS_UPLOAD_OPEN, authUser.uuid);
			uploadSocket.onmessage = (evt) => {
				// console.log("Received geocode update", evt);
				const message = JSON.parse(evt.data);
				
				// Expecting: { type: 'geocode-update', updates: [{ key: '...', readableLocation: '...' }, ...] }
				if (message.type === WS_GEOCODE_UPDATE && Array.isArray(message.updates)) {
					setLibImgMetadata(prevMetadata => {
						let hasChanges = false;
						const newMetadata = new Map(prevMetadata);
						
						// Process each update in the batch
						message.updates.forEach(({ key, readableLocation }) => {
							if (!key) return;
							
							const existingMeta = prevMetadata.get(key);
							
							// Only update if the key exists and data actually changed
							if (existingMeta && existingMeta.readableLocation !== readableLocation) {
								newMetadata.set(key, {
									...existingMeta,
									readableLocation
								});
								hasChanges = true;
							}
						});
						
						// Return same reference if nothing changed = no rerender
						return hasChanges ? newMetadata : prevMetadata;
					});
				}
			};

			await authPost(`/api/image${endpoint}`, authUser.authToken, data);
			launchAlert(ALERTS.SUCCESS, `Image${imageArray.length > 1 ? 's' : ''} uploaded successfully!`);

			// Refresh gallery after upload
			refreshLibrary();
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Upload failed: " + (e.message || e.toString()));
		} finally {
			setLoadingPopupOpen(false);
		}
	};

	/**===========================================================
	 * WATCHERS
	 =============================================================*/
	
	useEffect(() => {
		setImagesLoaded(new Set());
	}, [setImagesLoaded]);
	
	useEffect(() => {
		if (!libImages?.length) {
			setTimeout(() => { // Timeout to ensure that this happens AFTER setImagesLoaded has reset all loaded states (hopefully prevents stuck loaders)
				refreshLibrary();
			}, 0);
		}
	}, [refreshLibrary, libImages]);

	// Close Nearby page websocket if open
	useEffect(() => {
		if (nearbySocket && nearbySocket.readyState === WebSocket.OPEN) {
			nearbySocket.close();
			
			setNearbySocket(null);
			setConnectedToNearby(false);
			setConnectingToNearby(false);
		}
	}, []);

	useEffect(() => {
		getSelfSummary();
	}, []);

	/**===========================================================
	 * RENDER
	 =============================================================*/

	return (
		<div className="bg-gray-1 w-full pb-40 sm:pb-0 min-h-[calc(100vh-max(7vh,70px))]">
			<ImageDisplay onPage={PAGES.LIBRARY} />

			<CSSTransition nodeRef={nodeRefBG} in={menuOpen} timeout={200} classNames="overlay-bg" unmountOnExit>
				<div ref={nodeRefBG} className="fixed bg-gray-1 top-0 opacity-80 bottom-0 right-0 left-0 z-20 h-dvh" onClick={toggleOpen}></div>
			</CSSTransition>

			<div className="fixed right-4 sm:top-[calc(max(7vh,70px+1rem))] bottom-24 sm:bottom-auto flex flex-col-reverse sm:flex-col items-end z-30">
				<Button className="shadow-lg shadow-gray-0 rounded-4xl w-14 h-14 z-20 p-4" onClick={toggleOpen}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6 text-white-0">
						<path fill="currentColor" d="M342.6 73.4C330.1 60.9 309.8 60.9 297.3 73.4L169.3 201.4C156.8 213.9 156.8 234.2 169.3 246.7C181.8 259.2 202.1 259.2 214.6 246.7L288 173.3L288 384C288 401.7 302.3 416 320 416C337.7 416 352 401.7 352 384L352 173.3L425.4 246.7C437.9 259.2 458.2 259.2 470.7 246.7C483.2 234.2 483.2 213.9 470.7 201.4L342.7 73.4zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 480C96 533 139 576 192 576L448 576C501 576 544 533 544 480L544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480C480 497.7 465.7 512 448 512L192 512C174.3 512 160 497.7 160 480L160 416z" />
					</svg>
				</Button>
				
				<div className={`flex flex-col my-2 z-10 sm:z-30 relative items-end`}>
					{ isMobileScreen()
						? [imgButton, locButton]
						: [locButton, imgButton] }
				</div>
			</div>

			<Popup
				bodyStyle="h-2/3 w-full md:w-2/3 md:h-1/2 lg:w-1/3 lg:h-2/3"
				open={uploadLocPopupOpen}
				headerText="ADD LOCATIONS"
				xClicked={() => setLocPopupOpen(false)}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setLocPopupOpen(false) },
					{ text: "SAVE", onClick: saveLocations },
				]}
				originalState={locations}
				setState={setLocations}
			>
				<div className="flex flex-col items-center pt-4 px-4">
					{locations.map((value, i) => (
						<div
							key={`location-${value}-${i}`}
							className="p-2 bg-blue-0 rounded w-full mx-4 my-1 flex justify-between items-center"
						>
							<p className="font-main font-bold text-white-1">{value}</p>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 ml-2 cursor-pointer text-white-0 hover:text-red-2" onClick={() => removeLocation(i)}>
								<path fill="currentColor" d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
							</svg>
						</div>
					))}

					{pendingLocations.map(v => (
						<div className="p-2 rounded w-full mx-4 my-1 flex items-center ghost-loader">
							<Spinner className="h-5 w-5 text-white-0 mr-2" />
							<p className="font-main font-bold text-white-0 italic">Processing location data, please wait...</p>
						</div>
					))}

					<Button className="px-4 py-2 mt-2 mb-4" onClick={addPendingLocation}>ADD LOCATION</Button>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-2/3 w-full md:w-5/6 lg:w-3/4 xl:w-2/3 xl:h-full"
				headerText="PICK LOCATION"
				open={locPickerOpen}
				xClicked={cancelLocPicker}
				layer={2}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: cancelLocPicker },
					{ text: "SAVE", onClick: processLocation },
				]}
			>
				<div className="w-full h-full">
					<LocationPicker
						onChange={setLastPendingLocation}
					/>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-2/3 w-full md:w-2/3 md:h-1/2 lg:w-1/3 lg:h-2/3"
				open={uploadImgPopupOpen}
				headerText="UPLOAD IMAGES"
				xClicked={() => setImgPopupOpen(false)}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setImgPopupOpen(false) },
					{ text: "SAVE", onClick: uploadImages },
				]}
				originalState={imagesToUpload}
				setState={setImagesToUpload}
			>
				<div className="flex pt-4 px-4">
					<FilePicker multiple showPicked onChange={setImagesToUpload} />
				</div>
			</Popup>

			<Popup
				bodyStyle="h-1/4 w-2/3 sm:w-90"
				headerText="UPLOADING"
				open={loadingPopupOpen}
				xDisabled
			>
				<div className="flex w-full h-full flex-col justify-center px-4">
					<div className="flex text-white justify-center font-main items-center">
						<Spinner className="h-8 mr-4" /> Upload in progress, please wait...
					</div>
				</div>
			</Popup>
		</div>
	);
}