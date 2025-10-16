import {BTN_VARIANTS} from "../../mixins/constants";


export default function Button({ className, children, onClick, variant = BTN_VARIANTS.PRIMARY }) {
	
	let variantStyle = "";

	switch (variant) {
		case BTN_VARIANTS.PRIMARY:
			variantStyle = "bg-green-1 hover:bg-green-0 text-white-0";
			break;
		case BTN_VARIANTS.SECONDARY:
			variantStyle = "bg-purple-3 hover:bg-purple-2 text-white-0";
			break;
		case BTN_VARIANTS.CANCEL:
			variantStyle = "bg-gray-6 hover:bg-red-1 text-white";
			break;
	}

	return (
		<button
			className={
				`p-4 cursor-pointer font-main font-bold flex flex-col items-center select-none rounded-lg box-border
				${variantStyle}
				${className}`
			}
			onClick={onClick}
		>
			{ children }
		</button>
	)
}