import { useNavigate } from "react-router-dom";
import {SKIP_SIGNIN_KEY} from "../mixins/constants";
import { useAuth } from "react-oidc-context";

export default function useAuthUser() {
	const navigate = useNavigate();
	const auth = useAuth();

	const signOutRedirect = () => {
		if (window.sessionStorage.getItem(SKIP_SIGNIN_KEY)) {
			window.sessionStorage.removeItem(SKIP_SIGNIN_KEY);
			navigate(0);
			return;
		}

		auth.removeUser();

		const clientId = "22rart6rc9f5arou9go82qi3rk";
		const logoutUri = import.meta.env.PROD ? "https://startup.dougalcaleb.click/login" : "http://localhost:5173/login";
		const cognitoDomain = "https://us-east-1cenwrahji.auth.us-east-1.amazoncognito.com";
		window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
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
	const profile = auth.user?.profile;

	return {
		loading: auth.isLoading,
		username: profile?.nickname ?? profile?.preferred_username ?? profile?.["cognito:username"] ?? null,
		name: profile?.name ?? profile?.given_name ?? null,
		email: profile?.email ?? null,
		picture: profile?.picture ?? null,
		signOut: signOutRedirect,
		idToken: auth.user?.id_token,
		accessToken: auth.user?.access_token,
		authToken: auth.user?.id_token ?? auth.user?.access_token,
		uuid: profile?.sub,
		raw: auth.user,
	};
}