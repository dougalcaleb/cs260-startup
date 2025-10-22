import { useState } from "react";
import Input from "../shared/Input";
import PersonCard from "../shared/PersonCard";

export default function Search() {
	const [searchTerm, setSearchTerm] = useState("");
	const [foundUsers, setFoundUsers] = useState([
		{
			name: "The Incredible Hunk",
			connections: 2
		},
		{
			name: "The Groovy New Emperor",
			connections: 99
		},
		{
			name: "Tom Snooze",
			connections: 13
		},
		{
			name: "anteater",
			connections: "0???"
		}
	]);
	const [userCount, setUserCount] = useState(0);

	const updateSearchterm = (term) => {
		if (term.length < 2) {
			setUserCount(0);
		} else if (term.length >= 2 && term.length < 4) {
			setUserCount(1);
		} else if (term.length >= 4 && term.length < 6) {
			setUserCount(2);
		} else if (term.length >= 6 && term.length < 8) {
			setUserCount(3);
		} else if (term.length >= 8) {
			setUserCount(4);
		}
		setSearchTerm(term);
	}


	return (
		<div className="bg-gray-1 w-full min-h-[175vh] sm:min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 pb-4 text-2xl sm:ml-8">SEARCH</div>
			<div className="flex justify-center mb-16 sm:fixed sm:right-4 sm:top-[calc(max(7vh,70px)+1rem)]" id="person-search-wrap">
				<Input type="text" placeholder="Search users..." value={searchTerm} onChange={updateSearchterm}></Input>
			</div>
			{foundUsers.slice(0, userCount).map((u, idx) => (
				<PersonCard key={`${u.name}-${u.connections}-${idx}`} name={u.name} connections={u.connections} />
			))}
		</div>
	);
}