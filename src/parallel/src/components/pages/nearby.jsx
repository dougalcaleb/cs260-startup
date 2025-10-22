import { useEffect, useState } from "react";
import PersonCard from "../shared/PersonCard";
import Spinner from "../shared/Spinner";

export default function Nearby() {
	const [nearbyUsers, setNearbyUsers] = useState([]);

	const addNearbyUser = (user) => {
		setNearbyUsers((prev) => [...prev, user]);
	}

	useEffect(() => {
		const timeouts = [];

		timeouts.push(setTimeout(() => {
			addNearbyUser({
				name: "John Doe",
				connections: 3
			});
		}, 500));

		timeouts.push(setTimeout(() => {
			addNearbyUser({
				name: "Timmy Trumpet",
				connections: 18
			});
		}, 1000));

		timeouts.push(setTimeout(() => {
			addNearbyUser({
				name: "Literally Bruce Wayne",
				connections: 227
			});
		}, 1500));

		// Cleanup timeouts on unmount to avoid state updates after unmount
		return () => {
			timeouts.forEach(clearTimeout);
		};
	}, []);

	return (
		<div className="bg-gray-1 w-full min-h-[175vh] sm:min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 pb-4 text-2xl sm:ml-8">NEARBY</div>
			<div className="flex ml-8 mb-4">
				<Spinner className="h-6 w-6 text-gray-7 mr-3" />
				<p className="text-gray-7 font-main font-bold">Searching for nearby users...</p>
			</div>
			{nearbyUsers.map((u, idx) => (
				<PersonCard key={`${u.name}-${u.connections}-${idx}`} name={u.name} connections={u.connections} />
			))}
		</div>
	);
}