import { useState, useRef, useEffect, useCallback } from "react";
import { CSSTransition } from 'react-transition-group'
import Button from "../shared/Button";
import { isMobile } from "../../mixins/screen";
import Popup from "../shared/Popup";
import { ALERTS, BTN_VARIANTS, POPUP_VARIANTS } from "../../mixins/constants";
import Input from "../shared/Input";
import FilePicker from "../shared/FilePicker";
import { authGet, authPost } from "../../mixins/api";
import useAuthUser from "../../hooks/useAuthUser";
import { useAlert } from "../../contexts/AlertContext";
import Spinner from "../shared/Spinner";
import { useGlobalState } from "../../contexts/StateProvider";

export default function Library() {
	const authUser = useAuthUser();
	const { launchAlert } = useAlert();
	const { images, setImages, imagesLoaded, setImagesLoaded } = useGlobalState();

	const [menuOpen, setMenuOpen] = useState(false);
	const [locBtnShow, setLocBtnShow] = useState(false);
	const [imgBtnShow, setImgBtnShow] = useState(false);
	const [uploadLocPopupOpen, setLocPopupOpen] = useState(false);
	const [uploadImgPopupOpen, setImgPopupOpen] = useState(false);
	const [loadingPopupOpen, setLoadingPopupOpen] = useState(false);
	const [locations, setLocations] = useState([""]);
	const [imagesToUpload, setImagesToUpload] = useState([]);
	const [viewImage, setViewImage] = useState(null);
	const [popupImageLoaded, setPopupImageLoaded] = useState(false);

	const imageBtnRef = useRef(null);
	const locationBtnRef = useRef(null);
	const nodeRefBG = useRef(null);

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

	const addLocation = () => {
		setLocations([...locations, ""]);
	};

	const setLocation = (index, value) => {
		const newLocations = [...locations];
		newLocations[index] = value;
		setLocations(newLocations);
	};

	const removeLocation = (index) => {
		const newLocations = [...locations];
		newLocations.splice(index, 1);
		setLocations(newLocations);
	}

	const imgButton = (
		<CSSTransition nodeRef={imageBtnRef} in={imgBtnShow} timeout={150} classNames="pop-in" key="img-btn" unmountOnExit>
			<div ref={imageBtnRef} className="invisible">
				<Button className="rounded-2xl my-2 shadow-gray-0 shadow-lg sm:z-10 relative" onClick={openImagePopup}>IMAGES</Button>
			</div>
		</CSSTransition>
	);

	const locButton = (
		<CSSTransition nodeRef={locationBtnRef} in={locBtnShow} timeout={150} classNames="pop-in" key="loc-btn" unmountOnExit>
			<div ref={locationBtnRef} className="invisible">
				<Button className="rounded-2xl shadow-gray-0 shadow-lg z-10 sm:z-0 relative" onClick={openLocationPopup}>LOCATIONS</Button>
			</div>
		</CSSTransition>
	);

	const placeholderImages = () => Array.from({ length: 20 }).map((_, i) => <div key={`placeholder-img-${i}`} className="ghost-loader rounded-md w-full h-30"></div>);

	const refreshLibrary = useCallback(async () => {
		try {
			const list = await authGet("/api/image/get-user-images", authUser.authToken);
			if (list?.length) {
				setImages(list.map(i => ({
					url: i.url,
					key: i.key
				})));
			} else {
				setImages(null);
			}
			setImagesLoaded(new Set());
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Failed to retrieve user image library: " + (e.message || e.toString()));
		}
	}, [authUser.authToken, setImages, setImagesLoaded]);

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
	
	const libraryImages = () => {
		if (images === null) {
			return (
				<div className="text-gray-7 italic font-bold w-80 ml-4">No library images found. Upload some!</div>
			);
		}
		if (images.length === 0) {
			return placeholderImages();
		}
		return images.map((imgData, i) => (
			<div className="overflow-hidden cursor-pointer sm:h-40 rounded-md flex-shrink-0" onClick={() => setViewImage(i)} key={imgData.key || `img-${i}`}>
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
		));
	}

	useEffect(() => {
		if (!images?.length) {
			refreshLibrary();
		}
	}, [refreshLibrary, images]);

	useEffect(() => {
		setImagesLoaded(new Set());
	}, [setImagesLoaded]);

	return (
		<div className="bg-gray-1 w-full pb-40 sm:pb-0 min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 text-xl sm:pb-2 sm:ml-8">LIBRARY</div>
			<div className="grid p-4 gap-2.5 sm:flex flex-wrap" id="library-content">
				{ libraryImages() }
			</div>

			<CSSTransition nodeRef={nodeRefBG} in={menuOpen} timeout={200} classNames="overlay-bg" unmountOnExit>
				<div ref={nodeRefBG} className="fixed bg-gray-1 top-0 opacity-80 bottom-0 right-0 left-0 z-20 h-dvh" onClick={toggleOpen}></div>
			</CSSTransition>

			<div className="fixed right-4 sm:top-[calc(max(7vh,70px+1rem))] bottom-24 sm:bottom-auto flex flex-col-reverse sm:flex-col items-end z-30">
				<Button className="shadow-lg shadow-gray-0 rounded-4xl w-14 h-14 z-20" onClick={toggleOpen}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6 text-white-0">
						<path fill="currentColor" d="M342.6 73.4C330.1 60.9 309.8 60.9 297.3 73.4L169.3 201.4C156.8 213.9 156.8 234.2 169.3 246.7C181.8 259.2 202.1 259.2 214.6 246.7L288 173.3L288 384C288 401.7 302.3 416 320 416C337.7 416 352 401.7 352 384L352 173.3L425.4 246.7C437.9 259.2 458.2 259.2 470.7 246.7C483.2 234.2 483.2 213.9 470.7 201.4L342.7 73.4zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 480C96 533 139 576 192 576L448 576C501 576 544 533 544 480L544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480C480 497.7 465.7 512 448 512L192 512C174.3 512 160 497.7 160 480L160 416z" />
					</svg>
				</Button>
				
				<div className={`flex flex-col my-2 z-10 sm:z-30 relative items-end`}>
					{ isMobile()
						? [imgButton, locButton]
						: [locButton, imgButton] }
				</div>
			</div>

			<Popup
				bodyStyle="h-2/3 w-full sm:w-1/3"
				open={uploadLocPopupOpen}
				headerText="ADD LOCATIONS"
				xClicked={() => setLocPopupOpen(false)}
				buttons={[
					{ text: "CANCEL", variant: BTN_VARIANTS.CANCEL, onClick: () => setLocPopupOpen(false) },
					{ text: "SAVE", onClick: () => setLocPopupOpen(false) },
				]}
				originalState={locations}
				setState={setLocations}
			>
				<div className="flex flex-col items-center pt-4 px-4">
					{locations.map((value, i) => (
						<div className="flex justify-center items-center mb-4" key={`loc-input-wrap-${i}`}>
							<Input
								className="w-4/5"
								key={`loc-input-${i}`}
								value={value}
								placeholder="Enter a location"
								onChange={(v) => setLocation(i, v)}
							></Input>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6 ml-2 cursor-pointer text-gray-7 hover:text-red-2" onClick={() => removeLocation(i)}>
								<path fill="currentColor" d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
							</svg>
						</div>
					))}
					<Button className="py-2 px-2 mb-4" onClick={addLocation}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-6 w-6">
							<path fill="currentColor" d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" />
						</svg>
					</Button>
				</div>
			</Popup>

			<Popup
				bodyStyle="h-2/3 w-full sm:w-1/3"
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
					<FilePicker multiple showPicked accept="image/*" onChange={setImagesToUpload} />
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

			<Popup
				bodyStyle="h-full w-full"
				open={viewImage !== null}
				xClicked={() => setViewImage(null)}
				variant={POPUP_VARIANTS.BLUR}
				originalState={popupImageLoaded}
				setState={setPopupImageLoaded}
				buttons={[
					{ text: "Delete", variant: BTN_VARIANTS.CANCEL, preventReset: true }
				]}
			>
				<div className="flex justify-center items-center px-4 pb-2 h-full">
					{!popupImageLoaded && <Spinner className="h-14 w-14 text-white-0" thickness="2.5" />}
					<img
						src={images?.[viewImage]?.url}
						alt={(images?.[viewImage]?.key || '').split('/').pop().split('__')[0]}
						className="max-w-full max-h-full object-contain rounded-md"
						onLoad={() => setPopupImageLoaded(true)}
					/>
				</div>
			</Popup>
		</div>
	);
}