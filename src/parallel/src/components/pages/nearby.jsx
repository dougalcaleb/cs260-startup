import { useEffect, useState } from "react";
import PersonCard from "../shared/PersonCard";
import Spinner from "../shared/Spinner";
import { useGlobalState } from "../../contexts/StateProvider";
import { openWS } from "../../mixins/api";
import { WS_NEARBY_OPEN } from "../../mixins/constants";
import useAuthUser from "../../hooks/useAuthUser";

export default function Nearby() {
	const [nearbyUsers, setNearbyUsers] = useState([]);
	const { connectingToNearby, setConnectingToNearby, connectedToNearby, setConnectedToNearby } = useGlobalState();
	const authUser = useAuthUser();


	const addNearbyUser = (user) => {
		setNearbyUsers((prev) => [...prev, user]);
	}

	if (!connectingToNearby && !connectedToNearby) {
		setConnectingToNearby(true);

		// const nearbySocket = openWS(WS_NEARBY_OPEN, authUser.uuid);
		// nearbySocket.onopen = () => {
		// 	setConnectingToNearby(false);
		// 	setConnectedToNearby(true);
		// }
		// nearbySocket.onmessage = (evt) => {

		// }
		// nearbySocket.onclose = () => {
		// 	setConnectedToNearby(false);
		// }
	}

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
			{!nearbyUsers.length && (
				<div>
					<p className="text-white-0 text-center font-main font-bold mx-8 bg-gray-4 max-w-max px-4 py-2 rounded">No users found nearby. You can try searching for them instead!</p>
				</div>
			)}
			{nearbyUsers.map((u, idx) => (
				<PersonCard key={`${u.name}-${u.connections}-${idx}`} name={u.name} connections={u.connections} />
			))}
			<div className="flex flex-col flex-wrap w-full p-4">
				<PersonCard className="my-2"></PersonCard>
				<PersonCard className="my-2"></PersonCard>
				<PersonCard className="my-2"></PersonCard>
				<PersonCard className="my-2"></PersonCard>
				<PersonCard className="my-2"></PersonCard>
				<PersonCard className="my-2"></PersonCard>
			</div>
		</div>
	);
}