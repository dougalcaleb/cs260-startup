import { createContext, useContext, useState } from "react";

const ImageContext = createContext();

export const useImages = () => {
	return useContext(ImageContext);
}

export default function ImageProvider({ children }) {
	const [images, setImages] = useState([]);
	const [imagesLoaded, setImagesLoaded] = useState(new Set());

	return (
		<ImageContext.Provider value={{ images, setImages, imagesLoaded, setImagesLoaded }}>
			{children}
		</ImageContext.Provider>
	)
}