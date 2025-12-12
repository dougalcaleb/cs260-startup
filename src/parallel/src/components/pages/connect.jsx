import { useCallback, useEffect } from "react";
import { useGlobalState } from "../../contexts/StateProvider";
import { ALERTS, PAGES } from "../../mixins/constants";
import ImageDisplay from "../shared/ImageDisplay";
import { authGet, authPost } from "../../mixins/api";
import useAuthUser from "../../hooks/useAuthUser";
import { useAlert } from "../../contexts/AlertContext";

export default function Connect() {
	const authUser = useAuthUser();
	const { launchAlert } = useAlert();
	const { comparingWith, setImagesLoaded, connectImages, setConnectImages, setConnectImgMetadata, setSelfSummary, libImgMetadata } = useGlobalState();
	
	// const refreshLibrary = useCallback(async () => {
	// 	try {
	// 		const list = await authPost("/api/image/get-user-images", authUser.authToken, { userID: comparingWith.userID });
	// 		if (list?.length) {
	// 			setConnectImages(list.map(i => ({ url: i.url, key: i.key })));
	// 			setConnectImgMetadata(new Map(list.map(i => [ i.key, i.metadata ])));
	// 		} else {
	// 			setConnectImages(null);
	// 		}
	// 		setImagesLoaded(new Set());
	// 	} catch (e) {
	// 		launchAlert(ALERTS.ERROR, "Failed to retrieve images: " + (e.message || e.toString()));
	// 	}
	// }, [authUser.authToken, setConnectImages, setImagesLoaded]);

	// const getSelfSummary = useCallback(async () => {
	// 	try {
	// 		const data = await authGet("/api/user/get-user-summary", authUser.authToken);
	// 		setSelfSummary({
	// 			dates: new Set(JSON.parse(data.dates || "[]")),
	// 			locations: new Set(JSON.parse(data.locations || "[]")),
	// 		});
	// 	} catch (e) {
	// 		launchAlert(ALERTS.ERROR, "Failed to get own user data summary: " + (e.message || e.toString()));
	// 	}
	// }, [authUser.authToken, setSelfSummary, libImgMetadata]);

	/**===========================================================
	 * WATCHERS
	 =============================================================*/
	
	// useEffect(() => {
	// 	setImagesLoaded(new Set());
	// }, [setImagesLoaded]);
	
	// useEffect(() => {
	// 	if (!connectImages?.length) {
	// 		setTimeout(() => { // Timeout to ensure that this happens AFTER setImagesLoaded has reset all loaded states (hopefully prevents stuck loaders)
	// 			refreshLibrary();
	// 		}, 0);
	// 	}
	// 	getSelfSummary();
	// }, [refreshLibrary, getSelfSummary, connectImages]);

	return (
		<div className="bg-gray-1 w-full pb-40 sm:pb-0 min-h-[calc(100vh-max(7vh,70px))]">
			<ImageDisplay onPage={PAGES.CONNECT} />
		</div>
	);
}