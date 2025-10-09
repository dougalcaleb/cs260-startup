import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './additional.css'
import Root from './components/root'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<BrowserRouter>
			<Root></Root>
		</BrowserRouter>
	</StrictMode>,
)
