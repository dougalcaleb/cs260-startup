import { useNavigate } from "react-router-dom";
import {SKIP_SIGNIN_KEY, TOKEN_KEY} from "../mixins/constants";
// import { useAuth } from "react-oidc-context";

export default function useAuthUser() {
	const navigate = useNavigate();
	// const auth = useAuth();

	const signOutRedirect = () => {
		const didSkipSignin = window.sessionStorage.getItem(SKIP_SIGNIN_KEY);
		window.sessionStorage.clear();
		
		if (didSkipSignin) {
			navigate(0);
			return;
		}

		return;

		// auth.removeUser();

		// const clientId = "22rart6rc9f5arou9go82qi3rk";
		// const logoutUri = import.meta.env.PROD ? "https://startup.dougalcaleb.click/" : "http://localhost:5173/";
		// const cognitoDomain = "https://us-east-1cenwrahji.auth.us-east-1.amazoncognito.com";
		// window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
	};

	if (window.sessionStorage.getItem(SKIP_SIGNIN_KEY)) {
		return {
			username: "Not signed in",
			name: "Not signed in",
			picture: null,
			signOut: signOutRedirect
		}
	}

	// Simple sign-in here

	// Cognito sign-in
	// const profile = auth.user?.profile;

	return {
		loading: false,
		username: "Parallel User",
		name: "Parallel User",
		email: "parallel-user@dougalcaleb.github.io",
		picture: null,
		signOut: signOutRedirect,
		idToken: "user-id-token",
		accessToken: "user-access-token",
		authToken: "user-auth-token",
		uuid: "unique-user-id",
		raw: {},
	};
}