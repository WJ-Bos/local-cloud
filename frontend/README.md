# Local Cloud Control Plane - Frontend

React-based UI for managing local infrastructure resources.

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── DatabaseForm.jsx      # Form for creating new databases
│   ├── DatabaseList.jsx      # List view of all databases
│   ├── DatabaseCard.jsx      # Individual database card
│   └── StatusBadge.jsx       # Status indicator component
├── App.jsx                   # Main application component
├── main.jsx                  # Application entry point
└── index.css                 # Global styles with Tailwind
```

## Color Scheme

- **Primary Dark**: `#272829` - Main background
- **Primary Blue**: `#61677A` - Secondary elements, buttons
- **Primary Light**: `#D8D9DA` - Borders, secondary text
- **Primary Cream**: `#FFF6E0` - Primary text, highlights

## Features (Phase 1 MVP)

- ✅ Create new PostgreSQL databases
- ✅ View all databases in a grid layout
- ✅ Display database status with color-coded badges
- ✅ Show connection strings and port information
- ✅ Delete databases
- ⏳ API integration (to be implemented)

## Status Values

- **PROVISIONING** - Database is being created
- **RUNNING** - Database is active and available
- **FAILED** - Database creation failed
- **DESTROYING** - Database is being deleted
- **DESTROYED** - Database has been removed

## Development Notes

Currently, the UI is displaying mock data. API integration with the Spring Boot backend will be implemented in the next phase.

## Technologies

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client (to be added for API calls)
