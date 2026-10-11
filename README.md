# NAWI Pro Frontend

**Web application for NAWI Pro, a Smart India Hackathon solution for recording OIML R 76 test observations and generating test reports for non-automatic weighing instruments (NAWIs).**

This React application is the user-facing workspace for administrators, laboratory supervisors, and testing officers. It provides role-aware dashboards and tools for laboratory and instrument workflows, inspection records, evidence, reviews, reports, and public certificate/report verification.

## Contents

- [Product areas](#product-areas)
- [Technology](#technology)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Configuration](#configuration)
- [Development](#development)
- [Build, preview, and lint](#build-preview-and-lint)
- [Application structure](#application-structure)
- [API and authentication](#api-and-authentication)
- [Deployment](#deployment)
- [Related documentation](#related-documentation)

## Product areas

- Sign-in and role-based dashboards
- Laboratory profiles, instrument registration, and assignment
- Inspection preparation, test plans, test execution, and evidence capture
- Supervisor review, non-compliance reporting, and report workflows
- Notifications, administrative views, and audit history
- NAWI Assistant and nameplate text extraction workflows
- Public certificate and report verification routes

Inspection screens support OIML R 76 inspired workflows. The project is not a substitute for the applicable standards, authorized verification, or legal metrology procedures.

## Technology

- React 19 and React DOM
- Vite 8
- React Router 7
- Axios for backend requests
- Tailwind CSS 4 and project-specific CSS
- Chart.js for dashboard visualizations

Exact dependency versions are recorded in [`package.json`](package.json) and `package-lock.json`.

## Requirements

- Node.js compatible with the installed Vite version and project dependencies
- npm
- The NAWI Pro backend, either running locally or available at the configured API origin

## Local setup

From the repository root:

```powershell
cd frontend
npm install
```

Start the backend separately when developing against a local API. Follow the [backend setup guide](../backend/README.md) to configure its database, Redis, and environment.

## Configuration

The frontend reads `VITE_API_BASE_URL` to choose the API origin. Create `frontend/.env.local` to override the configured default:

```dotenv
VITE_API_BASE_URL=http://localhost:4000
```

When this variable is unset, the source falls back to `https://sih-backend-1-c1mr.onrender.com`. Restart the Vite development server after changing environment files. For production, set the value at build time to the API origin for that environment.

Vite embeds `VITE_` variables in browser-delivered code. Use this variable only for public configuration such as an API base URL. Never put database credentials, API keys, signing secrets, or other private values in frontend environment files.

## Development

```powershell
npm run dev
```

Vite prints the local development URL, usually `http://localhost:5173`. The backend's CORS configuration must permit that exact origin. Authenticated API calls use cookie credentials; local and deployed backend configuration must support the corresponding origin and cookie policy.

## Build, preview, and lint

Create an optimized production build:

```powershell
npm run build
```

Serve the built output locally for a production-like preview:

```powershell
npm run preview
```

Run ESLint:

```powershell
npm run lint
```

## Application structure

```text
frontend/
├── public/                   # Static assets and hosting redirects
└── src/
    ├── api/                  # Axios clients and API functions
    ├── assets/               # Brand and workflow imagery
    ├── components/           # Reusable interface components
    ├── context/              # Authentication context
    ├── layout/               # Shared dashboard layout
    ├── pages/                # Role dashboards and product workflows
    ├── App.jsx               # Client routes
    └── main.jsx              # Application entry point
```

Useful implementation locations:

- API origin and Axios clients: [`src/api/axiosInstance.js`](src/api/axiosInstance.js)
- Authentication API calls: [`src/api/authApi.js`](src/api/authApi.js)
- Role and route configuration: [`src/App.jsx`](src/App.jsx)
- Authentication state: [`src/context/authContext.jsx`](src/context/authContext.jsx)

## API and authentication

API calls are grouped in `src/api/` and use the configured base URL. The credentialed Axios client sends cookies for signed-session workflows; public verification calls can use the client without credentials. Do not store session tokens or secrets in browser storage or frontend source.

The frontend and backend must agree on:

1. The backend origin configured by `VITE_API_BASE_URL`.
2. The browser origin permitted by backend CORS.
3. Credentialed request behavior and cookie attributes for the environment.

See the [backend README](https://github.com/nadim-dev/SIH-frontend/blob/backend/README.md) for currently configured backend origins and session-cookie behavior.

## Deployment

- Build with `npm run build`; Vite writes the static production bundle to `dist/`.
- Set `VITE_API_BASE_URL` to the intended backend origin before creating the production build.
- Configure the backend to allow the deployed frontend origin and credentialed requests.
- Use HTTPS for production when relying on secure cross-site session cookies.
- Configure the static host to serve the SPA entry point for client-side routes. This repository includes [`public/_redirects`](public/_redirects) for compatible static hosts; verify the rewrite behavior with your selected provider.
- Keep server secrets and provider credentials in backend or hosting environment configuration, never in the frontend build.

The frontend is currently configured to use the deployed Render API by default when no `VITE_API_BASE_URL` is supplied. Set an explicit value for staging, local, or other deployment environments to avoid accidentally targeting the default service.

## Related documentation

- [Backend README](../https://github.com/nadim-dev/SIH-frontend/blob/backend/README.md)
- [Frontend scripts and dependencies](package.json)
