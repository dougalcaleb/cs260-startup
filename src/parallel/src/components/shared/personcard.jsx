export default function PersonCard({ name, connections, className }) {
	
	return (
		<div className={`sm:w-120 h-40 relative mb-20 ${className}`}>
			<div className="rounded-full bg-green-2 h-20 w-20 sm:w-24 sm:h-24 ml-4 sm:ml-10 relative z-2 border-8 border-gray-1"></div>
			<div className="w-full -top-10 sm:-top-12 relative bg-gray-5 rounded-lg flex flex-col sm:flex-row h-50">
				<div className="pt-2 sm:pt-15 pb-4 flex flex-col items-center w-full sm:w-auto sm:min-w-44">
					<p className="font-main font-bold text-white-0 relative w-full text-right sm:text-center pt-2 px-2">John Scooby Dooby Doo</p>
					<p className="font-main font-bold text-gray-7 relative w-full text-right sm:text-center px-2 italic sm:mt-4">4 connections</p>
				</div>
				
				<div className="bg-gray-3 rounded-sm m-2 grow p-1 overflow-y-auto">
					<div className="flex flex-wrap">
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Saratoga Springs, UT</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">New York, NY</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Syracruse, UT</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Syracruse, UT</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Syracruse, UT</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Syracruse, UT</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Syracruse, UT</p>
						</div>
						<div className="bg-green-0 rounded-md m-1 h-max">
							<p className="font-main font-bold text-white p-2">Syracruse, UT</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}