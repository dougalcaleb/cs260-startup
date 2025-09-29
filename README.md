# PARALLEL

An app for discovering quick connections using your photo library.

## 🚀 Specification Deliverable

- [x] Proper use of Markdown
- [x] A concise and compelling elevator pitch
- [x] Description of key features
- [x] Description of how you will use each technology
- [x] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

### Elevator pitch

So often you miss out on connections with people because you just don't know that it's something you have in common -- it just never comes up in conversation. But everyone loves taking photos at their favorite or most important places. Parallel quickly finds those connections by cross-referencing your photo library with others -- instantly finding connections you might have never discovered otherwise!

### Design

![Design image](design-mockup.png)

App Flow
- Pages include login/register, personal library, person search, and connect
- Bottom Navigation
- Mobile-first

Data flow
- Auth data stored in Atlas
- Photo storage in S3 bucket(s) (or possibly EFS)
- Search results handled by server
- Connect page is just the Personal Library page but using another person's data
- Metadata and location extraction/processing handled by 3rd-party API (Google)

### Key features

- Persistent photo library
- Comparing photos with similar data with others

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Core UI structure
- **CSS** - UI visuals
- **React** - Improved UI
- **Service** - Authentication and login. Location names via Google API
- **DB/Login** - Accounts and data storage
- **WebSocket** - Person search and comparison

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Server deployed and accessible with custom domain name** - [My server link](https://dougalcaleb.click).

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **HTML pages** - Added landing, login, library, connect, nearby search, and user search pages
- [x] **Proper HTML element usage** - Used proper HTML elements for appropriate page sections
- [x] **Links** - Included links from landing page to each other page, and from each individual page back to landing page
- [x] **Text** - Headers for each page, along with placeholder text for informational parts
- [x] **3rd party API placeholder** - Images fetched from Picsum; location names fetched from location coordinates via call to Google Maps API
- [x] **Images** - Images on Library and Connect pages
- [x] **Login placeholder** - Login page with username and password input
- [x] **DB data placeholder** - User's Library page
- [x] **WebSocket placeholder** - Nearby Search page

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Header, footer, and main content body** - Header with Parallel logo, contains nav on desktop. Footer on mobile with nav. Main content on all pages.
- [x] **Navigation elements** - Clickable, highlighted links for YOU/NEARBY/SEARCH (footer on mobile, header on desktop)
- [x] **Responsive to window resizing** - Breakpoint at 900px, continuously responsive without a refresh
- [x] **Application elements** - Library images, upload button, search box, nearby/search person card
- [x] **Application text content** - Headings, nav, text on person cards
- [x] **Application images** - Library images

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Bundled using Vite** - I did not complete this part of the deliverable.
- [ ] **Components** - I did not complete this part of the deliverable.
- [ ] **Router** - I did not complete this part of the deliverable.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **All functionality implemented or mocked out** - I did not complete this part of the deliverable.
- [ ] **Hooks** - I did not complete this part of the deliverable.

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.


## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.
