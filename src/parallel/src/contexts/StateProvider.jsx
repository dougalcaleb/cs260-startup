import { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const useGlobalState = () => {
	return useContext(StateContext);
}

export default function StateProvider({ children }) {
	const [libImages, setLibImages] = useState([]);
	const [libImgMetadata, setLibImgMetadata] = useState(new Map());
	const [connectImages, setConnectImages] = useState([]);
	const [connectImgMetadata, setConnectImgMetadata] = useState(new Map());
	const [imagesLoaded, setImagesLoaded] = useState(new Set());
	const [username, setUsername] = useState("");
	const [connectedToNearby, setConnectedToNearby] = useState(false);
	const [connectingToNearby, setConnectingToNearby] = useState(false);
	const [comparingWith, setComparingWith] = useState(null);
	const [selfSummary, setSelfSummary] = useState(null);
	const [isComparing, setIsComparing] = useState(false);

	return (
		<StateContext.Provider value={{
			libImages, setLibImages,
			libImgMetadata, setLibImgMetadata,
			connectImages, setConnectImages,
			connectImgMetadata, setConnectImgMetadata,
			imagesLoaded, setImagesLoaded,
			username, setUsername,
			connectedToNearby, setConnectedToNearby,
			connectingToNearby, setConnectingToNearby,
			comparingWith, setComparingWith,
			selfSummary, setSelfSummary,
			isComparing, setIsComparing,
		}}>
			{children}
		</StateContext.Provider>
	)
}