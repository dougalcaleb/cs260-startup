import { useEffect, useState } from "react";
import Input from "../shared/Input";
import PersonCard from "../shared/PersonCard";
import { useGlobalState } from "../../contexts/StateProvider";
import { useAlert } from "../../contexts/AlertContext";
import { ALERTS } from "../../mixins/constants";
import { authGet } from "../../mixins/api";
import useAuthUser from "../../hooks/useAuthUser";
import { similarity } from "../../mixins/fuzzyMatch";

export default function Search() {
	const { nearbySocket, setNearbySocket, setConnectedToNearby, setConnectingToNearby } = useGlobalState();
	const { launchAlert } = useAlert();
	const authUser = useAuthUser();

	const [searchTerm, setSearchTerm] = useState("");
	const [foundUsers, setFoundUsers] = useState([]);
	const [allUsers, setAllUsers] = useState([]);

	const fuzzySearch = (query, limit = 50, threshold = 0.35) => {
		const q = query.trim().toLowerCase();

		const scored = Object.entries(allUsers)
			.map(([userID, userData]) => {
				const s = similarity(q, String(userData.username).toLocaleLowerCase())
				return { data: { ...userData, userID }, score: s };
			})
			.filter(u => u.score >= threshold)
			.sort((a, b) => b.score - a.score)
			.map(u => ({ ... u.data }));
	
		return typeof limit === "number" ? scored.slice(0, limit) : scored;
	}

	const updateSearchterm = (term) => {
		setSearchTerm(term);
		const searchResults = fuzzySearch(term);
		setFoundUsers(searchResults);
	}

	const fetchUsers = async () => {
		try {
			// const users = await authGet("/api/user/get-all-users", authUser.authToken);
			setAllUsers({
				user1: { username: "John Doe" },
				user2: { username: "Jane Smith" },
				user3: { username: "Caleb Dougal" },
			});
		} catch (e) {
			launchAlert(ALERTS.ERROR, "Failed to retrieve users: " + (e.message || e.toString()));
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// Close Nearby page websocket if open
	useEffect(() => {
		if (nearbySocket && nearbySocket.readyState === WebSocket.OPEN) {
			nearbySocket.close();
			
			setNearbySocket(null);
			setConnectedToNearby(false);
			setConnectingToNearby(false);
		}
	}, []);

	return (
		<div className="bg-gray-1 w-full min-h-[175vh] sm:min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 pb-4 text-2xl sm:ml-8">SEARCH</div>
			<div className="flex justify-center mb-16 sm:fixed sm:right-4 sm:top-[calc(max(7vh,70px)+1rem)]" id="person-search-wrap">
				<Input type="text" placeholder="Search users..." value={searchTerm} onChange={updateSearchterm}></Input>
			</div>
			<div className="mx-4">
				{foundUsers.map((u, idx) => (
					<PersonCard
						className="my-2"
						hideConnections
						key={`${u.name}-${u.connections}-${idx}`}
						name={u.username}
						connections={u.connections}
						profileColors={u.profileColors}
						profileImg={u.picture}
						userID={u.userID}
					/>
				))}
			</div>
		</div>
	);
}