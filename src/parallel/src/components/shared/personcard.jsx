import Button from "./Button";

export default function PersonCard({ name, connections, className }) {
	
	return (
		<div className={`bg-gray-5 w-full rounded-xl flex flex-col p-2 ${className}`}>
			<div className="flex flex-col sm:flex-row justify-between">
				<div className="flex items-center">
					<div className="rounded-full bg-amber-500 h-10 w-10 m-1 my-2 sm:my-4"></div>
					<p className="font-main font-bold text-white ml-2">John Super Duper Internet</p>
				</div>
				<div className="flex justify-between items-center mb-4 sm:mb-0">
					<p className="font-main font-semibold italic text-gray-7 ml-1">4 connections</p>
					<Button className="h-max py-2 px-4 sm:mx-4">Connect</Button>
				</div>
			</div>
			<div className="bg-gray-3 w-full flex rounded-lg py-2 px-1 overflow-hidden relative">
				<div className="absolute h-full w-20 right-0 pointer-events-none bg-gradient-to-l from-gray-3 to-transparent"></div>
				
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
				<div className="bg-blue-1 px-4 py-2 rounded w-max font-main font-semibold text-white-1 mx-1 whitespace-nowrap">Saratoga Springs, UT</div>
			</div>
		</div>
	)
}