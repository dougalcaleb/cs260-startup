import { useState } from "react";
import { useGlobalState } from "../../contexts/StateProvider";
import { ALERTS, BTN_VARIANTS, IMG_ORGANIZE, PAGES, POPUP_VARIANTS } from "../../mixins/constants";
import { useAlert } from "../../contexts/AlertContext";
import useAuthUser from "../../hooks/useAuthUser";
import Popup from "./Popup";
import Spinner from "./Spinner";
import { authPost } from "../../mixins/api";
import Dropdown from "./Dropdown";
import { formatMetadata } from "../../mixins/format";


export default function ImageDisplay({ onPage }) {
	const { libImages, setLibImages, imagesLoaded, setImagesLoaded } = useGlobalState();
	const { launchAlert } = useAlert();
	const authUser = useAuthUser();

	const [popupImageLoaded, setPopupImageLoaded] = useState(false);
	const [viewImage, setViewImage] = useState(null);
	const [loadingPopupOpen, setLoadingPopupOpen] = useState(false);
	const [settingsPopupOpen, setSettingsPopupOpen] = useState(false);
	const [organization, setOrganization] = useState(IMG_ORGANIZE.DEFAULT);
	const [tmpOrg, setTmpOrg] = useState(IMG_ORGANIZE.DEFAULT);

	const placeholderImages = () => Array.from({ length: 20 }).map((_, i) => <div key={`placeholder-img-${i}`} className="ghost-loader rounded-md w-full h-30"></div>);

	if (libImages === null) {
		return (
			<div className="text-gray-7 italic font-bold w-full p-8">No library images found. Upload some!</div>
		);
	}
	if (libImages.length === 0) {
		return placeholderImages();
	}


	const deleteImage = async () => {
		const deleteKey = libImages?.[viewImage]?.key;
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

			setLibImages(libImages.filter(i => i.key !== deleteKey));

			launchAlert(ALERTS.SUCCESS, "Image deleted successfully!");
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Delete failed: " + (e.message || e.toString()));
		} finally {
			setLoadingPopupOpen(false);
		}
	}

	const setOrgType = () => {
		setSettingsPopupOpen(false);
		setOrganization(tmpOrg);
	}
	
	return (
		<>
			<div className="font-main font-black text-gray-6 flex justify-between sm:text-left w-full sm:w-auto pt-4 sm:pt-6 text-xl sm:pb-2 sm:ml-8 px-4 sm:px-0 sm:justify-start">
				<div className="h-8 w-8 sm:hidden"></div>
				<div>LIBRARY</div>
				<div className="h-8 w-8 sm:px-4 sm:w-auto sm:h-auto flex items-center" onClick={() => setSettingsPopupOpen(true)}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-6 w-6 sm:h-5 sm:w-5 cursor-pointer hover:text-gray-7">
						<path fill="currentColor" d="M232.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 149.8C5.4 145.8 0 137.3 0 128s5.4-17.9 13.9-21.8L232.5 5.2zM48.1 218.4l164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 277.8C5.4 273.8 0 265.3 0 256s5.4-17.9 13.9-21.8l34.1-15.8zM13.9 362.2l34.1-15.8 164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 405.8C5.4 401.8 0 393.3 0 384s5.4-17.9 13.9-21.8z" />
					</svg>
				</div>
			</div>

			<div className="grid p-4 gap-2.5 sm:flex flex-wrap" id="library-content">
				{libImages.map((imgData, i) => (
					<div className="overflow-hidden cursor-pointer sm:h-40 rounded-md flex-shrink-0 hover:shadow-lg shadow-gray-0 transition-all hover:-translate-y-1 duration-100" onClick={() => setViewImage(i)} key={imgData.key || `img-${i}`}>
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
				))}
			</div>
			
			<Popup
				bodyStyle="h-full w-full"
				headerText={formatMetadata(libImages?.[viewImage]) }
				open={viewImage !== null}
				xClicked={() => setViewImage(null)}
				variant={POPUP_VARIANTS.BLUR}
				originalState={popupImageLoaded}
				setState={setPopupImageLoaded}
				buttons={onPage === PAGES.LIBRARY ? [
					{ text: "Delete", variant: BTN_VARIANTS.CANCEL, preventReset: true, onClick: deleteImage }
				] : null}
			>
				<div className="flex justify-center items-center px-4 pb-2 h-full relative">
					{!popupImageLoaded && <Spinner className="h-14 w-14 text-white-0 absolute m-auto left-0 right-0 top-0 bottom-0" thickness="2.5" />}
					<img
						src={libImages?.[viewImage]?.url}
						alt={(libImages?.[viewImage]?.key || '').split('/').pop().split('__')[0]}
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
				bodyStyle="h-1/3 w-2/3 sm:w-90 sm:h-1/2"
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
		</>
	);
}