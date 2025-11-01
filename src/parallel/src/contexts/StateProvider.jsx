import { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const useGlobalState = () => {
	return useContext(StateContext);
}

export default function StateProvider({ children }) {
	const [libImages, setLibImages] = useState([]);
	const [connectImages, setConnectImages] = useState([]);
	const [imagesLoaded, setImagesLoaded] = useState(new Set());
	const [username, setUsername] = useState("");

	return (
		<StateContext.Provider value={{
			libImages, setLibImages,
			connectImages, setConnectImages,
			imagesLoaded, setImagesLoaded,
			username, setUsername
		}}>
			{children}
		</StateContext.Provider>
	)
}