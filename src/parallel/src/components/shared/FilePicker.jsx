import { useId, useState } from "react";
import { formatFileSize } from "../../mixins/format";

export default function FilePicker({ id, multiple = false, onChange = () => {}, accept = "", showPicked=false, maxCount = 25 }) {
	const reactId = useId();
	const [files, setFiles] = useState([]);
	
	const inputId = id ?? `file-${String(reactId).replace(/:/g, "-")}`;

	const updateFiles = (e) => {
		setFiles(Array.from(e.target.files));
		onChange(e.target.files);
	}

	const removeFile = (index) => {
		const newFiles = [...files];
		newFiles.splice(index, 1);
		setFiles(newFiles);
		onChange(newFiles);
	}

	return (
		<>
			<div className="flex flex-col w-full">
				<label htmlFor={inputId} className="font-main text-white-0 px-4 py-2 bg-blue-1 hover:bg-blue-0 rounded-md font-bold cursor-pointer text-center mb-4 w-full">
					<input
						id={inputId}
						className="hidden"
						type="file"
						multiple={multiple}
						onChange={updateFiles}
						accept={accept}
					/>
					CHOOSE FILES
				</label>

				{showPicked && (
					<>
						<div className="font-main text-white-1 mb-2">Selected files: ({files.length}, max {maxCount})</div>
						<div className="flex flex-col mb-4">
							{files.map((f, i) => (
								<div key={`file-display-${inputId}-${i}`} className="font-mono text-gray-8 hover:bg-gray-3 p-1 flex items-center">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-4 w-4 mr-2 cursor-pointer text-gray-7 hover:text-red-2" onClick={() => removeFile(i)}>
										<path fill="currentColor" d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
									</svg>
									<p>{f.name} ({formatFileSize(f.size)})</p>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</>
	);
}
