

export default function Button({ className, children, onClick }) {
	

	return (
		<button
			className={
				`p-4 bg-green-1 hover:bg-green-0 cursor-pointer font-main font-bold flex flex-col items-center text-white-0 select-none rounded-lg
				${className}`
			}
			onClick={onClick}
		>
			{ children }
		</button>
	)
}