import {useCallback, useMemo, useState} from "react";
import {GoogleMap, Marker, useJsApiLoader} from "@react-google-maps/api";

const containerStyle = {width: "100%", height: "100%"};

export default function LocationPicker({
	defaultCenter = {lat: 40.2338, lng: -111.6585}, // provo
	defaultZoom = 10,
	onChange = {},
	className = "h-full w-full",
}) {
	const [markerPos, setMarkerPos] = useState(defaultCenter);
	const [mapCenter, setMapCenter] = useState(defaultCenter);

	const libraries = useMemo(() => ["places"], []);
	const {isLoaded, loadError} = useJsApiLoader({
		id: "google-maps-script",
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
		libraries,
	});

	const updatePos = useCallback((pos) => {
		setMarkerPos(pos);
		onChange(pos);
	}, [onChange]);

	const onMapClick = useCallback(ev => {
		const lat = ev.latLng?.lat();
		const lng = ev.latLng?.lng();
		if (typeof lat === "number" && typeof lng === "number") {
			updatePos({lat, lng});
		}
	}, [updatePos]);

	if (loadError) {
		return <div className="text-red-400 font-main">Failed to load Maps</div>;
	}

	return (
		<div className={className}>
			{!isLoaded ? (
				<div className="w-full h-full flex items-center justify-center text-white-0 font-main">Loading map…</div>
			) : (
				<div className="w-full h-full flex flex-col">
					<div className="flex-1 min-h-60">
						<GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={defaultZoom} onClick={onMapClick}>
							{markerPos && (
								<Marker
									position={markerPos}
									draggable
									onDragEnd={(e) => {
										const lat = e.latLng?.lat();
										const lng = e.latLng?.lng();
										if (typeof lat === "number" && typeof lng === "number") {
											updatePos({ lat, lng });
										}
									}}
								/>
							)}
						</GoogleMap>
					</div>
				</div>
			)}
		</div>
	);
}
