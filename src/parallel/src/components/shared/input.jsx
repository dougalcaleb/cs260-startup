export default function Input({ type = "text", placeholder, className = "", value, onChange }) {
	return (
		<input
			type={type}
			placeholder={placeholder}
			className={className}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}