export default function Dropdown({
	options = [],
	onChange,
	value,
	className = "",
	optionClass = ""
}) {
	return (
		<>
			<div className="relative inline-block w-full">
				<select
					className={`appearance-none pr-9 w-full ${className}`}
					value={value}
					onChange={(e) => onChange(e.target.value)}
				>
					{options.map(e => (
						<option
							className={optionClass}
							key={`dd-option-${e.id}-${e.text}`}
							value={e.id}
						>
							{e.text}
						</option>
					))}
				</select>
				<svg
					aria-hidden="true"
					className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white"
					viewBox="0 0 448 512"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path fill="currentColor" d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
				</svg>
			</div>
		</>
	);
}