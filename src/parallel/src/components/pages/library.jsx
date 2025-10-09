import Header from "../shared/header"
import Footer from "../shared/footer"
import phimg from "../../assets/landscape-200.jpg"

export default function Library() {
	return (
		<div className="bg-gray-1 w-full min-h-[175vh] sm:min-h-[calc(100vh-max(7vh,70px))]">
			<div className="font-main font-black text-gray-6 text-center sm:text-left w-full sm:w-auto pt-4 sm:pt-6 text-2xl sm:ml-8">LIBRARY</div>
			<div className="grid p-4 gap-2.5" id="library-content">
				{ images() }
			</div>
		</div>
	);
}

function images() {
	const arr = [];

	for (let i = 0; i < 20; i++) {
		arr.push(<img key={i} src={phimg} alt={`placeholder ${i}`} className="w-full h-auto object-cover rounded-md" />);
	}

	return arr;
}