import { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const useGlobalState = () => {
	return useContext(StateContext);
}

export default function StateProvider({ children }) {
	const [images, setImages] = useState([]);
	const [imagesLoaded, setImagesLoaded] = useState(new Set());
	const [username, setUsername] = useState("");

	return (
		<StateContext.Provider value={{
			images, setImages, imagesLoaded, setImagesLoaded,
			username, setUsername
		}}>
			{children}
		</StateContext.Provider>
	)
}