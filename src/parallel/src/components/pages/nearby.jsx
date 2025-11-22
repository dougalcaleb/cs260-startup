import { useEffect, useMemo, useState } from "react";
import PersonCard from "../shared/PersonCard";
import Spinner from "../shared/Spinner";
import { useGlobalState } from "../../contexts/StateProvider";
import { openWS } from "../../mixins/api";
import { WS_NEARBY_OPEN, WS_NEARBY_USER_CONNECT, WS_NEARBY_USER_DISCONNECT } from "../../mixins/constants";
import useAuthUser from "../../hooks/useAuthUser";

export default function Nearby() {
	const authUser = useAuthUser();
	const { connectingToNearby, setConnectingToNearby, connectedToNearby, setConnectedToNearby } = useGlobalState();
	
	const [nearbyUsers, setNearbyUsers] = useState([]);
	const [selfData, setSelfData] = useState(null);

	if (!connectingToNearby && !connectedToNearby) {
		setConnectingToNearby(true);

		const nearbySocket = openWS(WS_NEARBY_OPEN, authUser.uuid);
		nearbySocket.addEventListener("open", () => {
			setConnectingToNearby(false);
			setConnectedToNearby(true);
		});
		nearbySocket.addEventListener("message", (evt) => {
			const data = JSON.parse(evt.data);
			
			if (data.type === WS_NEARBY_USER_CONNECT || data.type === WS_NEARBY_USER_DISCONNECT) {
				const users = Object.entries(data.data).filter(([userID, _]) => userID !== authUser.uuid).map(([userID, userData]) => ({ userID, ...userData }));
				setNearbyUsers(users);
				setSelfData(data.data[authUser.uuid]);
			}
		});
		nearbySocket.addEventListener("close", () => {
			setConnectedToNearby(false);
			setNearbyUsers([]);
		});
	}

	const connections = useMemo(() => {
		if (!selfData || !nearbyUsers.length) return [];

		const selfLocSet = new Set(selfData.locations);
		const selfDateSet = new Set(selfData.dates);

		return nearbyUsers.map(userData => ({
			userID: userData.userID,
			name: userData.username,
			connections: {
				locations:  selfLocSet.intersection(new Set(userData.locations)),
				dates: selfDateSet.intersection(new Set(userData.dates))
			}
		}));
	}, [nearbyUsers, selfData]);

	return (
		<div className="bg-gray-1 w-full min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 pb-4 text-2xl sm:ml-8">NEARBY</div>
			{connectingToNearby && (
				<div className="flex justify-center sm:justify-start">
					<div className="flex sm:ml-8 mb-4 sm:justify-normal px-4 py-2 bg-gray-4 w-max rounded select-none text-green-2">
						<Spinner className="h-6 w-6 mr-3" />
						<p className="font-main font-bold italic">Connecting to server...</p>
					</div>
				</div>
			)}
			{connectedToNearby && (
				<div className="flex justify-center sm:justify-start mx-4 sm:mx-0">
					<div className="flex items-center sm:ml-8 mb-4 sm:justify-normal px-4 py-2 bg-gray-4 w-max rounded select-none text-green-2 ghost-loader">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4 text-green-2 mr-3">
							<path fill="currentColor" d="M0 64c0-17.7 14.3-32 32-32 229.8 0 416 186.2 416 416 0 17.7-14.3 32-32 32s-32-14.3-32-32C384 253.6 226.4 96 32 96 14.3 96 0 81.7 0 64zM0 416a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM32 160c159.1 0 288 128.9 288 288 0 17.7-14.3 32-32 32s-32-14.3-32-32c0-123.7-100.3-224-224-224-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
						</svg>

						<p className="font-main font-bold italic">Connected, listening for other users to connect...</p>
					</div>
				</div>
			)}
			{!nearbyUsers.length && (
				<div>
					<p className="text-white-0 text-center font-main font-bold mx-8 bg-gray-4 max-w-max px-4 py-2 rounded">No users found nearby. You can try searching for them instead!</p>
				</div>
			)}
			<div className="mx-4 sm:mx-8">
				{connections.map((u, idx) => (
					<PersonCard className="my-2" key={`conn-${u.userID}-${idx}`} name={u.name} connections={u.connections} />
				))}
			</div>
		</div>
	);
}