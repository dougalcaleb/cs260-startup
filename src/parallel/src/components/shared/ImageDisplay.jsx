import { useMemo, useState } from "react";
import { useGlobalState } from "../../contexts/StateProvider";
import { ALERTS, BTN_VARIANTS, IMG_ORGANIZE, PAGES, POPUP_VARIANTS, WS_GEOCODE_UPDATE, WS_UPLOAD_OPEN } from "../../mixins/constants";
import { useAlert } from "../../contexts/AlertContext";
import useAuthUser from "../../hooks/useAuthUser";
import Popup from "./Popup";
import Spinner from "./Spinner";
import { authPost, openWS } from "../../mixins/api";
import Dropdown from "./Dropdown";
import { formatDate, formatMetadata } from "../../mixins/format";
import { sortByLocation, sortByTime } from "../../mixins/sort";
import LocationPicker from "./LocationPicker";
import DatePicker from "./DatePicker";
import Button from "./Button";


export default function ImageDisplay({ onPage }) {
	/**===========================================================
	 * STATE
	 =============================================================*/
	
	// Hooks
	const { libImages, setLibImages, imagesLoaded, setImagesLoaded, libImgMetadata, setLibImgMetadata, connectImages, setConnectImages, connectImgMetadata, selfSummary, comparingWith } = useGlobalState();
	const { launchAlert } = useAlert();
	const authUser = useAuthUser();

	// State
	const [popupImageLoaded, setPopupImageLoaded] = useState(false);
	const [viewImage, setViewImage] = useState(null);
	const [loadingPopupOpen, setLoadingPopupOpen] = useState(false);
	const [settingsPopupOpen, setSettingsPopupOpen] = useState(false);
	const [infoPopupOpen, setInfoPopupOpen] = useState(false);
	const [organization, setOrganization] = useState(IMG_ORGANIZE.DEFAULT);
	const [tmpOrg, setTmpOrg] = useState(IMG_ORGANIZE.DEFAULT);
	const [locPickerOpen, setLocPickerOpen] = useState(false);
	const [pickedLoc, setPickedLoc] = useState(null);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [pickedDate, setPickedDate] = useState(null); // shape {year, month, day, date}
	const [confirmDeletePopupOpen, setConfirmDeletePopupOpen] = useState(false);

	// Computeds
	const [imageSet, setImageSet] = useMemo(() => {
		if (onPage === PAGES.LIBRARY) {
			return [libImages, setLibImages];
		} else if (onPage === PAGES.CONNECT) {
			return [connectImages, setConnectImages]
		}

		return [[], () => { }];
	}, [onPage, libImages, setLibImages, connectImages, setConnectImages]);

	const imageSetMdata = useMemo(() => {
		if (onPage === PAGES.LIBRARY) {
			return libImgMetadata;
		} else if (onPage === PAGES.CONNECT) {
			return connectImgMetadata;
		}

		return new Map();
	}, [onPage, libImgMetadata, connectImgMetadata]);

	const mergedImageSet = useMemo(() =>
		(imageSet || [])
			.map(i => ({
				...i,
				metadata: imageSetMdata.get(i.key) || { loc: null, time: null, readableLocation: "" }
			}))
			.filter(i => onPage === PAGES.LIBRARY || selfSummary.locations.has(i.metadata.readableLocation) || selfSummary.dates.has(formatDate(i.metadata.time)))
		, [imageSet, imageSetMdata, onPage, selfSummary]
	);

	const [locationSortedImageSet, dateSortedImageSet] = useMemo(() => {
		if (!imageSet || !imageSet.length || !mergedImageSet || !mergedImageSet.length) return [[], []];
		return [sortByLocation(mergedImageSet), sortByTime(mergedImageSet)];
	}, [imageSet, mergedImageSet]);

	const imagesByKey = useMemo(() => Object.fromEntries((imageSet || []).map(img => [img.key, img])), [imageSet]);

	const imageMetadata = useMemo(() => {
		const metadata = imageSetMdata.get(viewImage);
		return formatMetadata(metadata ? { metadata } : null);
	}, [viewImage, imageSetMdata]);
	
	/**===========================================================
	 * WATCHERS
	 =============================================================*/
	
	

	/**===========================================================
	 * SETTER HELPERS
	 =============================================================*/

	const setOrgType = () => {
		setSettingsPopupOpen(false);
		setOrganization(tmpOrg);
	}

	const closeViewPopup = () => {
		setViewImage(null);
		setInfoPopupOpen(false);
	}

	const saveImageLocation = async () => {
		if (!viewImage) return;
		const {lat, lng} = pickedLoc;
		try {
			// Open a WS to receive the readable address update
			const uploadSocket = openWS(WS_UPLOAD_OPEN, authUser.uuid);
			uploadSocket.onmessage = (evt) => {
				try {
					const message = JSON.parse(evt.data);
					if (message.type === WS_GEOCODE_UPDATE && Array.isArray(message.updates)) {
						message.updates.forEach(({ key, readableLocation }) => {
							if (key === viewImage && readableLocation) {
								setLibImgMetadata(prev => {
									const next = new Map(prev);
									const existing = next.get(viewImage) || {};
									next.set(viewImage, { ...existing, readableLocation });
									return next;
								});
							}
						});
					}
				} catch (e) {
					console.warn('WS message parse error', e);
				}
			};
			
			await authPost("/api/image/set-location", authUser.authToken, { key: viewImage, lat, lng });
			// Optimistically set raw coords so UI (e.g., grouping) can update
			setLibImgMetadata(prev => {
				const next = new Map(prev);
				const existing = next.get(viewImage) || {};
				next.set(viewImage, { ...existing, location: { lat, lng }, readableLocation: null });
				return next;
			});
			setLocPickerOpen(false);
			launchAlert(ALERTS.SUCCESS, "Location saved! It may take a few moments to display correctly.");
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Failed to set location: " + (e.message || e.toString()));
		}
	};

	const saveImageDate = async () => {
		if (!viewImage || !pickedDate) return;
		const { year, month, day } = pickedDate;
		try {
			const res = await authPost("/api/image/set-date", authUser.authToken, { key: viewImage, year, month, day });
			const tsSeconds = res?.timestamp ?? Math.floor(new Date(year, month - 1, day).getTime() / 1000);
			// Optimistically update timestamp for sorting/grouping
			setLibImgMetadata(prev => {
				const next = new Map(prev);
				const existing = next.get(viewImage) || {};
				next.set(viewImage, { ...existing, timestamp: tsSeconds });
				return next;
			});
			setDatePickerOpen(false);
			launchAlert(ALERTS.SUCCESS, "Date saved!");
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Failed to set date: " + (e.message || e.toString()));
		}
	};

	const deleteImage = async () => {
		setConfirmDeletePopupOpen(false);
		const deleteKey = imagesByKey?.[viewImage]?.key;
		if (!deleteKey) {
			launchAlert(ALERTS.ERROR, "Cannot delete: No image key");
			return;
		}

		setViewImage(null);
		setLoadingPopupOpen(true);

		try {
			await authPost("/api/image/delete-single", authUser.authToken, {
				key: deleteKey
			});

			setImageSet(imageSet.filter(i => i.key !== deleteKey));

			launchAlert(ALERTS.SUCCESS, "Image deleted successfully!");
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Delete failed: " + (e.message || e.toString()));
		} finally {
			setLoadingPopupOpen(false);
		}
	}

	/**===========================================================
	 * COMPONENT FRAGMENTS
	 =============================================================*/
	
	const createImage = (imgData, idx) => (
		<div
			className="overflow-hidden cursor-pointer sm:h-40 rounded-md flex-shrink-0 hover:shadow-lg shadow-gray-0 transition-all hover:-translate-y-1 duration-100"
			onClick={() => setViewImage(imgData.key)}
			key={imgData.key || `img-${idx}`}
		>
			{!imagesLoaded.has(imgData.key) && <div className="ghost-loader h-40 w-40"></div>}
			<img
				src={imgData.url}
				alt={(imgData.key || '').split('/').pop().split('__')[0]}
				className={`w-full h-full object-cover object-center sm:h-full sm:w-auto sm:object-contain rounded-md ${imagesLoaded.has(imgData.key) ? '' : 'hidden'}`}
				onLoad={() => {
					setImagesLoaded(prev => {
						const updated = new Set(prev);
						updated.add(imgData.key);
						return updated;
					});
				}}
			/>
		</div>
	);

	const viewPopupHeader = (
		<div className="w-full flex justify-end">
			<div className="text-white-0 h-8 rounded-tl rounded-bl flex items-center bg-gray-6">
				{onPage === PAGES.LIBRARY && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="min-w-5 min-h-5 mx-2 hover:text-red-2 cursor-pointer" onClick={() => setConfirmDeletePopupOpen(true)}>
					<path fill="currentColor" d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
				</svg>}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="min-h-5 min-w-5 mx-2 hover:text-green-2 cursor-pointer" onClick={() => setInfoPopupOpen(true)}>
					<path fill="currentColor" d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM224 160a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm-8 64l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z" />
				</svg>
			</div>
		</div>
	);

	const compactView = (mergedImageSet || []).map(createImage);

	const dateView = (
		dateSortedImageSet.map(dateSet => (
			<>
				<div className="img-organizer-title mt-2 col-span-full w-full font-bold text-gray-8 italic font-main">
					{dateSet.time}
				</div>
				{dateSet.images.map(createImage)}
			</>
		))
	);

	const locationView = (
		locationSortedImageSet.map(locationSet => (
			<>
				<div className="img-organizer-title mt-2 col-span-full w-full font-bold text-gray-8 italic font-main">
					{locationSet.location}
				</div>
				{locationSet.images.map(createImage)}
			</>
		))
	);

	let imageView = null;
	switch (organization) {
		case IMG_ORGANIZE.DEFAULT:
			imageView = compactView;
			break;
		case IMG_ORGANIZE.BY_LOC:
			imageView = locationView;
			break;
		case IMG_ORGANIZE.BY_DATE:
			imageView = dateView;
			break;
		default:
			console.error("Unknown image organization type", organization);
			break;
	}

	let bodyHeader = null;
	if (onPage === PAGES.LIBRARY) {
		bodyHeader = <div>LIBRARY</div>
	} else if (onPage === PAGES.CONNECT) {
		bodyHeader = <div className="text-center">CONNECT</div>
	}

	let bodySubHeader = null;
	if (onPage === PAGES.CONNECT) {
		bodySubHeader = (
			<div className="flex justify-center sm:justify-start mx-4 sm:mx-0 mt-2">
				<div className="flex items-center sm:ml-8 mb-4 sm:justify-normal px-4 py-2 bg-gray-4 w-max rounded select-none">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-6 w-6 sm:h-4 sm:w-4 text-green-2 mr-2">
						<path fill="currentColor" d="M418.4 157.9c35.3-8.3 61.6-40 61.6-77.9 0-44.2-35.8-80-80-80-43.4 0-78.7 34.5-80 77.5L136.2 151.1C121.7 136.8 101.9 128 80 128 35.8 128 0 163.8 0 208s35.8 80 80 80c12.2 0 23.8-2.7 34.1-7.6L259.7 407.8c-2.4 7.6-3.7 15.8-3.7 24.2 0 44.2 35.8 80 80 80s80-35.8 80-80c0-27.7-14-52.1-35.4-66.4l37.8-207.7zM156.3 232.2c2.2-6.9 3.5-14.2 3.7-21.7l183.8-73.5c3.6 3.5 7.4 6.7 11.6 9.5L317.6 354.1c-5.5 1.3-10.8 3.1-15.8 5.5L156.3 232.2z" />
					</svg>

					<p className="font-main font-bold italic mr-1">
						<span className="text-green-2">Connecting with </span>
						<span className="text-green-2">{comparingWith.username}</span>
					</p>
				</div>
			</div>
		)
	}

	/**===========================================================
	 * EMPTY RENDER
	 =============================================================*/

	if (imageSet === null || !mergedImageSet.length) {
		if (onPage === PAGES.LIBRARY) {
			return (
				<div className="text-gray-7 italic font-bold w-full p-8">No library images found. Upload some!</div>
			);
		} else {
			return (
				<>
					<div className="font-main font-black text-gray-6 sm:text-left w-full sm:w-auto pt-4 sm:pt-6 text-2xl sm:pb-2 sm:ml-8 px-4 sm:px-0 justify-center sm:justify-start">
						{bodyHeader}
					</div>
					{bodySubHeader}
					<div className="text-gray-7 italic font-bold w-full px-8 mt-4">No images to show.</div>
				</>
			);
		}
	}
	if (imageSet.length === 0) {
		return (
			<div className="grid gap-2.5 sm:flex flex-wrap w-full h-full pt-18 px-4">
				{Array.from({ length: 20 }).map((_, i) => <div key={`placeholder-img-${i}`} className="ghost-loader rounded-md h-40 w-40"></div>)}
			</div>
		);
	}

	/**===========================================================
	 * CONTENFUL RENDER
	 =============================================================*/
	
	return (
		<>
			<div className="font-main font-black text-gray-6 flex justify-between sm:text-left w-full sm:w-auto pt-4 sm:pt-6 text-2xl sm:pb-2 sm:ml-8 px-4 sm:px-0 sm:justify-start">
				<div className="h-8 w-8 sm:hidden"></div>
				{ bodyHeader }
				<div className="h-8 w-8 sm:px-4 sm:w-auto sm:h-auto flex items-center" onClick={() => setSettingsPopupOpen(true)}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-6 w-6 sm:h-5 sm:w-5 cursor-pointer hover:text-gray-7">
						<path fill="currentColor" d="M232.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 149.8C5.4 145.8 0 137.3 0 128s5.4-17.9 13.9-21.8L232.5 5.2zM48.1 218.4l164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 277.8C5.4 273.8 0 265.3 0 256s5.4-17.9 13.9-21.8l34.1-15.8zM13.9 362.2l34.1-15.8 164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 405.8C5.4 401.8 0 393.3 0 384s5.4-17.9 13.9-21.8z" />
					</svg>
				</div>
			</div>

			{bodySubHeader}

			<div className="grid p-4 gap-2.5 sm:flex flex-wrap" id="library-content">
				{imageView}
			</div>
			
			<Popup
				bodyStyle="h-full w-full"
				header={viewPopupHeader}
				open={viewImage !== null}
				xClicked={closeViewPopup}
				variant={POPUP_VARIANTS.BLUR}
				originalState={popupImageLoaded}
				setState={setPopupImageLoaded}
			>
				<div className="flex justify-center items-center px-4 pb-2 h-full relative">
					{!popupImageLoaded && <Spinner className="h-14 w-14 text-white-0 absolute m-auto left-0 right-0 top-0 bottom-0" thickness="2.5" />}
					<img
						src={imagesByKey?.[viewImage]?.url}
						alt={(imagesByKey?.[viewImage]?.key || '').split('/').pop().split('__')[0]}
						className="max-w-full max-h-full object-contain rounded-md"
						onLoad={() => setPopupImageLoaded(true)}
					/>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-1/4 w-2/3 sm:w-90"
				headerText="PROCESSING"
				open={loadingPopupOpen}
				xDisabled
			>
				<div className="flex w-full h-full flex-col justify-center px-4">
					<div className="flex text-white justify-center font-main items-center">
						<Spinner className="h-8 mr-4" /> Processing, please wait...
					</div>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-1/3 w-5/6 sm:w-90 sm:h-1/2"
				headerText="VIEW SETTINGS"
				open={settingsPopupOpen}
				xClicked={() => setSettingsPopupOpen(false)}
				originalState={tmpOrg}
				setState={setTmpOrg}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setSettingsPopupOpen(false) },
					{ text: "SAVE", onClick: setOrgType },
				]}
			>
				<div className="flex flex-col w-full h-full p-4">
					<p className="text-gray-7 font-main font-bold">Image organization</p>

					<Dropdown
						className="font-main font-bold my-2 bg-blue-0 p-2 rounded-sm text-white cursor-pointer outline-none"
						optionClass="font-main"
						options={[
							{ id: IMG_ORGANIZE.DEFAULT, text: "Compact" },
							{ id: IMG_ORGANIZE.BY_LOC, text: "Grouped by location" },
							{ id: IMG_ORGANIZE.BY_DATE, text: "Grouped by date" }
						]}
						onChange={setTmpOrg}
						value={tmpOrg}
					/>
				</div>
			</Popup>

			<Popup
				headerText="IMAGE INFO"
				bodyStyle="h-1/3 w-5/6 sm:w-90 sm:h-1/2"
				open={infoPopupOpen}
				xClicked={() => setInfoPopupOpen(false)}
				layer={1}
			>
				<div className="p-4 w-full h-full font-main text-white-0 font-bold">
					<div>
						<p className="text-gray-8 italic">Location:</p>
						{imageMetadata.loc ? (
							<p className="mb-2">{imageMetadata.loc}</p>
						): (
							<Button
								variant={BTN_VARIANTS.SECONDARY}
								className="py-2 px-4 mt-1"
								onClick={() => { setInfoPopupOpen(false); setLocPickerOpen(true); }}
							>
								Add location
							</Button>
						)}
						<p className="text-gray-8 italic mt-2">Date:</p>
						{imageMetadata.time ? (
							<p className="mb-4">{imageMetadata.time}</p>
						): (
							<Button
								variant={BTN_VARIANTS.SECONDARY}
								className="py-2 px-4 mt-1"
								onClick={() => { setInfoPopupOpen(false); setDatePickerOpen(true); }}
							>
								Add date
							</Button>
						)}
					</div>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-2/3 w-full md:w-5/6 lg:w-3/4 xl:w-2/3 xl:h-full"
				headerText="SET IMAGE LOCATION"
				open={locPickerOpen}
				xClicked={() => setLocPickerOpen(false)}
				layer={2}
				originalState={pickedLoc}
				setState={setPickedLoc}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setLocPickerOpen(false) },
					{ text: "SAVE", onClick: saveImageLocation },
				]}
			>
				<div className="w-full h-full">
					<LocationPicker
						onChange={setPickedLoc}
					/>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-1/3 w-5/6 sm:w-90 sm:h-1/2"
				headerText="SET IMAGE DATE"
				open={datePickerOpen}
				xClicked={() => setDatePickerOpen(false)}
				layer={2}
				originalState={pickedDate}
				setState={setPickedDate}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setDatePickerOpen(false) },
					{ text: "SAVE", onClick: saveImageDate },
				]}
			>
				<div className="w-full h-full flex flex-col p-4">
					<p className="text-gray-7 font-main font-bold mb-2">Pick a date</p>
					<DatePicker
						onChange={setPickedDate}
						value={pickedDate?.date || null}
						className="flex gap-2"
						yearClass="font-main font-bold my-2 bg-blue-0 p-2 rounded-sm text-white cursor-pointer outline-none"
						monthClass="font-main font-bold my-2 bg-blue-0 p-2 rounded-sm text-white cursor-pointer outline-none"
						dayClass="font-main font-bold my-2 bg-blue-0 p-2 rounded-sm text-white cursor-pointer outline-none"
						optionClass="font-main"
					/>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-1/4 w-2/3 sm:w-90"
				headerText="DELETE IMAGE"
				open={confirmDeletePopupOpen}
				xClicked={() => setConfirmDeletePopupOpen(false)}
				layer={2}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setConfirmDeletePopupOpen(false) },
					{ text: "DELETE", onClick: deleteImage },
				]}
			>
				<div className="flex w-full h-full flex-col justify-center px-4">
					<p class="font-main font-bold text-white-1">Are you sure you want to delete this image?</p>
				</div>
			</Popup>
		</>
	);
}