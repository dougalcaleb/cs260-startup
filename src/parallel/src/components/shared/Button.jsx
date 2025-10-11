

export default function Button({ className, children, click }) {
	

	return (
		<div
			className={
				`p-4 bg-green-1 hover:bg-green-0 cursor-pointer font-main font-bold text-center flex flex-col items-center text-white-0 select-none
				${className}`
			}
			onClick={click}
		>
			{ children }
		</div>
	)
}