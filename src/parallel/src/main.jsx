import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './additional.css'
import Root from './components/root'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from 'react-oidc-context'
import { AlertProvider } from './contexts/AlertContext';
import StateProvider from './contexts/StateProvider'
import { VERSION_STAMP } from './version'
import { formatDate } from './mixins/format'

const cognitoAuthConfig = {
	authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CeNWRAhjI",
	client_id: "22rart6rc9f5arou9go82qi3rk",
	redirect_uri: import.meta.env.PROD ? "https://startup.dougalcaleb.click/" : "http://localhost:5173/",
	response_type: "code",
	scope: "phone openid email profile",
};

console.log("VERSION:", isNaN(VERSION_STAMP) ? VERSION_STAMP : formatDate(VERSION_STAMP * 1000));

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<AuthProvider {...cognitoAuthConfig}>
			<BrowserRouter>
				<AlertProvider>
					<StateProvider>
						<Root></Root>
					</StateProvider>
				</AlertProvider>
			</BrowserRouter>
		</AuthProvider>
	</StrictMode>
)
