import { useSearchParams } from "react-router-dom";



export default function Connect() {
	const { uid } = useSearchParams();

	console.log(uid);

	return (<div></div>);
}