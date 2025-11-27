import { useGlobalState } from "../../contexts/StateProvider";
import useAuthUser from "../../hooks/useAuthUser";
import { USER_PROFILE_KEY } from "../../mixins/constants";

export default function ProfileImage({
	isSelf = false,
	onClick,
	src,
	username,
	colors,
	className = "",
}) {
	const authUser = useAuthUser();
	const { username: selfUsername } = useGlobalState();

	const imgSource = (isSelf
		? authUser.picture
		: src) ||
		null;
	const uname = (isSelf
		? (selfUsername || authUser.username)
		: username) ||
		"?";
	const profileColors = (isSelf
		? JSON.parse(window.sessionStorage.getItem(USER_PROFILE_KEY))?.profileColors
		: colors) ||
		{ "main": "hsl(138, 47%, 64%)", "contrast": "hsl(0, 0%, 86%)" };
	
	const imgPlaceholder = (
		<div>
			<p className="font-bold font-main">{uname.split("")[0].toUpperCase?.()}</p>
		</div>
	);

	return (
		<div
			className={`rounded-full flex justify-center items-center overflow-hidden ${className}`}
			style={{ background: profileColors.main, color: profileColors.contrast }}
			onClick={onClick}
		>
			{imgSource ? (
				<img
					src={imgSource}
					alt="Profile"
					referrerPolicy="no-referrer"
					crossOrigin="anonymous"
					className="w-full h-full object-cover"
				/>
			) : imgPlaceholder}
		</div>
	)
}