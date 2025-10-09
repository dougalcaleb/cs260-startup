import Input from "../shared/input";
import PersonCard from "../shared/personcard";

export default function Nearby() {
	return (
		<div className="bg-gray-1 w-full min-h-[175vh] sm:min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 pb-4 text-2xl sm:ml-8">NEARBY</div>
			<PersonCard name="John Doe" connections="3"></PersonCard>
			<PersonCard name="Jimbo McFlimbo" connections="2"></PersonCard>
		</div>
	);
}