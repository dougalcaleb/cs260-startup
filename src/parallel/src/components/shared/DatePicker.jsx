import {useMemo} from "react";
import Dropdown from "./Dropdown";

function normalizeValue(value) {
	if (!value) {
		const d = new Date();
		return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
	}
	if (value instanceof Date) {
		return {year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate()};
	}
	// assume shape {year, month, day}
	return value;
}

function daysInMonth(year, month) {
	return new Date(year, month, 0).getDate(); // month is 1-based here
}

export default function DatePicker({
	value,
	onChange = () => {},
	minYear = 1900,
	maxYear = new Date().getFullYear(),
	className = "flex gap-2 w-full",
	yearClass = "bg-gray-700 text-white rounded px-2 py-1",
	monthClass = "bg-gray-700 text-white rounded px-2 py-1",
	dayClass = "bg-gray-700 text-white rounded px-2 py-1",
	optionClass = "bg-gray-800 text-white",
	order = ["month", "day", "year"],
}) {
	const current = normalizeValue(value);
	let {year, month, day} = current;

	if (year < minYear) year = minYear;
	if (year > maxYear) year = maxYear;
	if (month < 1) month = 1;
	if (month > 12) month = 12;

	const maxDay = daysInMonth(year, month);
	if (day > maxDay) day = maxDay;
	if (day < 1) day = 1;

	const years = useMemo(() => {
		const arr = [];
		for (let y = maxYear; y >= minYear; y--) {
			arr.push({id: y, text: String(y)});
		}
		return arr;
	}, [minYear, maxYear]);

	const months = useMemo(() => {
		const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; 
		return names.map((n,i) => ({id: i+1, text: n}));
	}, []);

	const days = useMemo(() => {
		const arr = [];
		for (let d = 1; d <= maxDay; d++) {
			arr.push({id: d, text: String(d)});
		}
		return arr;
	}, [maxDay]);

	const emit = (next) => {
		const {year: y, month: m, day: d} = next;
		// Provide both normalized object and Date instance for flexibility
		const dateObj = new Date(y, m - 1, d);
		onChange({year: y, month: m, day: d, date: dateObj});
	};

	const handleYear = (y) => {
		const newYear = Number(y);
		const maxD = daysInMonth(newYear, month);
		emit({year: newYear, month, day: Math.min(day, maxD)});
	};
	const handleMonth = (m) => {
		const newMonth = Number(m);
		const maxD = daysInMonth(year, newMonth);
		emit({year, month: newMonth, day: Math.min(day, maxD)});
	};
	const handleDay = (d) => {
		emit({year, month, day: Number(d)});
	};

	const pieces = {
		year: (
			<Dropdown
				key="dp-year"
				options={years}
				value={year}
				onChange={handleYear}
				className={yearClass}
				optionClass={optionClass}
			/>
		),
		month: (
			<Dropdown
				key="dp-month"
				options={months}
				value={month}
				onChange={handleMonth}
				className={monthClass}
				optionClass={optionClass}
			/>
		),
		day: (
			<Dropdown
				key="dp-day"
				options={days}
				value={day}
				onChange={handleDay}
				className={dayClass}
				optionClass={optionClass}
			/>
		),
	};

	return (
		<div className={className}>
			{order.map(k => pieces[k])}
		</div>
	);
}
