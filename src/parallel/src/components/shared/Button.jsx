

export default function Button({ className, children }) {
	

	return (
		<div className={`p-4 bg-green-1 cursor-pointer rounded-4xl ${className}`}>
			{ children }
		</div>
	)
}