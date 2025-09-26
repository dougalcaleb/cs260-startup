if (sessionStorage.getItem("has-loaded")) {
	document.querySelector(".load-screen").style.display = "none";
} else {
	window.onload = () => {
		document.querySelector(".load-screen p").style.animation = "0.5s ease-in forwards clip-in";
		document.querySelector(".load-screen").style.animation = "0.2s 2s linear forwards fadeout";
	};
}

sessionStorage.setItem("has-loaded", true);