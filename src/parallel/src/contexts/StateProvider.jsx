import { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const useGlobalState = () => {
	return useContext(StateContext);
}

export default function StateProvider({ children }) {
	const [libImages, setLibImages] = useState([]);
	const [libImgMetadata, setLibImgMetadata] = useState(new Map());
	const [connectImages, setConnectImages] = useState([]);
	const [imagesLoaded, setImagesLoaded] = useState(new Set());
	const [username, setUsername] = useState("");
	const [connectedToNearby, setConnectedToNearby] = useState(false);
	const [connectingToNearby, setConnectingToNearby] = useState(false);

	return (
		<StateContext.Provider value={{
			libImages, setLibImages,
			libImgMetadata, setLibImgMetadata,
			connectImages, setConnectImages,
			imagesLoaded, setImagesLoaded,
			username, setUsername,
			connectedToNearby, setConnectedToNearby,
			connectingToNearby, setConnectingToNearby,
		}}>
			{children}
		</StateContext.Provider>
	)
}