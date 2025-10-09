export default function PersonCard({ name, connections}) {
	
	return (
		<div className="nearby-person  bg-green-2 rounded-md cursor-pointer flex justify-between font-main text-white-0 font-black overflow-hidden mb-4 items-center mx-auto sm:ml-8">
			<div className="bg-green-1 rounded-r-xl py-2.5 px-5 text-xl break-normal">{name}</div>
			<div className="px-5 break-keep text-center">{connections} connections</div>
		</div>
	)
}