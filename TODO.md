# TODO.md

## 🔧 Frontend Cleanup

### 1. Header Simplification

-   [ ] Remove **Compute** tab from header\
-   [ ] Remove **fake profile picture/avatar**\
-   [ ] Remove any unused navigation links\
-   [ ] Keep **Storage** tab only\
-   [ ] Ensure header layout remains centered and balanced\
-   [ ] Verify responsiveness (mobile + desktop)

------------------------------------------------------------------------

## 🖥 Terminal Integration

### 2. Embed Terminal in Frontend

-   [ ] Choose terminal library (e.g., xterm.js)\
-   [ ] Create `TerminalView` component\
-   [ ] Mount terminal instance on component load\
-   [ ] Handle resize correctly\
-   [ ] Add loading state while connecting

------------------------------------------------------------------------

## 🔌 Backend -- Terminal Session Handling

### 3. WebSocket Setup

-   [ ] Create WebSocket endpoint `/terminal`\
-   [ ] Handle connection handshake\
-   [ ] Authenticate session (if required)\
-   [ ] Attach terminal session to container

------------------------------------------------------------------------

## 🐳 Container Connectivity

### 4. Connect to Started Container

-   [ ] Ensure container is running before attaching\
-   [ ] Use Docker API or Docker SDK\
-   [ ] Attach to container STDIN / STDOUT\
-   [ ] Stream output back via WebSocket\
-   [ ] Handle container termination gracefully\
-   [ ] Implement error handling (container not found, stopped, etc.)

------------------------------------------------------------------------

## 🗄 Database Integration

### 5. Use DB Port for Session Context

-   [ ] Retrieve DB connection details from config\
-   [ ] Use DB port as session identifier (or context binding)\
-   [ ] Validate active DB connection before terminal access\
-   [ ] Log session → container → DB mapping
