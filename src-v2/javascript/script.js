document.querySelector(".load-screen").style.display = "none";

if (sessionStorage.getItem("has-loaded")) {
	document.querySelector(".load-screen").style.display = "none";
} else {
	window.onload = () => {
		document.querySelector(".load-screen p").style.animation = "0.5s ease-in forwards clip-in";
		document.querySelector(".load-screen").style.animation = "0.2s 2s linear forwards fadeout";
	};
}

sessionStorage.setItem("has-loaded", true);

// Mobile header title fade

const header = document.querySelector("header");
const bigHeader = document.querySelector("#pre-header-logo");
const smallHeader = document.querySelector("#header-logo-wrap");
let textHeight = bigHeader.getBoundingClientRect().height;

if (window.innerWidth < 900) {
	const headerBound = header.getBoundingClientRect();

	bigHeader.style.top = `${headerBound.bottom / 2 - textHeight / 2}px`;
	smallHeader.style.opacity = 0;
}

window.addEventListener("scroll", () => {
	if (window.innerWidth < 900) {
		const headerBound = header.getBoundingClientRect();
		const percentScrolled = (window.scrollY / (window.innerHeight / 5));

		bigHeader.style.top = `${headerBound.bottom / 2 - textHeight / 2}px`;
		bigHeader.style.opacity = 1 - percentScrolled * 3;
		smallHeader.style.opacity = (percentScrolled - 0.3) * 3;
	}
});

window.addEventListener("resize", () => {
	if (window.innerWidth > 900) {
		smallHeader.style.opacity = 1;
		bigHeader.style.opacity = 0;
	} else {
		textHeight = bigHeader.getBoundingClientRect().height;
		const headerBound = header.getBoundingClientRect();
		const percentScrolled = (window.scrollY / (window.innerHeight / 5));

		bigHeader.style.top = `${headerBound.bottom / 2 - textHeight / 2}px`;
		bigHeader.style.opacity = 1 - percentScrolled * 3;
		smallHeader.style.opacity = (percentScrolled - 0.3) * 3;
	}
});