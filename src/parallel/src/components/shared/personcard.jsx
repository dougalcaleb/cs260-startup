import { Link, useNavigate } from "react-router-dom";
import ProfileImage from "../pages/ProfileImage";
import Button from "./Button";
import { useGlobalState } from "../../contexts/StateProvider";

export default function PersonCard({
	name,
	userID,
	connections,
	className,
	profileColors,
	profileImg,
	hideConnections = false,
}) {
	const navigate = useNavigate();
	const { setComparingWith, setIsComparing } = useGlobalState();

	connections = Object.assign({ locations: new Set(), dates: new Set() }, connections);

	const connectionCount = connections.locations.size + connections.dates.size;

	const combined = [...(connections?.locations ?? []), ...(connections?.dates ?? [])];
	const shuffled = combined.sort(() => Math.random() - 0.5);

	const profileData = {
		username: name,
		colors: profileColors,
		src: profileImg
	};

	const navToConnect = () => {
		setComparingWith(userID);
		setIsComparing(true);
		navigate("/connect");
	}

	return (
		<div className={`bg-gray-5 w-full rounded-xl flex flex-col p-2 ${className}`}>
			<div className="flex flex-col sm:flex-row justify-between">
				<div className="flex items-center">
					<ProfileImage
						username={profileData.username}
						colors={profileData.colors}
						src={profileData.src}
						className="w-10 h-10 m-1 my-2 sm:my-4"
					/>
					<p className="font-main font-bold text-white ml-2">{name}</p>
				</div>
				<div className={`flex justify-between items-center sm:mb-0 ${hideConnections ? 'mt-4' : 'mb-4'}`}>
					{!hideConnections && <p className="font-main font-semibold italic text-gray-7 ml-1">{connectionCount} connections</p>}
					<Button
						onClick={navToConnect}
						className="h-max py-2 px-4 sm:mx-4"
					>
						Connect
					</Button>
				</div>
			</div>
			{!!combined.length && <div className="bg-gray-3 w-full flex rounded-lg py-2 px-1 overflow-hidden relative">
				<div className="absolute h-full w-20 right-0 pointer-events-none bg-gradient-to-l from-gray-3 to-transparent"></div>

				{shuffled.map((item, index) => (
					<div
						key={`connection-tile-${item}-${index}`}
						className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap"
					>
						{item}
					</div>
				))}
			</div>}
		</div>
	)
}