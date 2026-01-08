<a href="https://zerodha.tech"><img src="https://zerodha.tech/static/images/github-badge.svg" align="right" alt="Zerodha Tech Badge" /></a>
# Whatomate

A modern WhatsApp Business Platform built with Go (Fastglue) and Vue.js (shadcn-vue).

## Features

- **Multi-tenant Architecture**: Support multiple organizations with isolated data
- **Role-Based Access Control**: Three roles (Admin, Manager, Agent) with granular permissions
- **WhatsApp Cloud API Integration**: Connect with Meta's WhatsApp Business API
- **Real-time Chat**: Live messaging with WebSocket support
- **Template Management**: Create and manage message templates
- **Bulk Messaging**: Send campaigns to multiple contacts with retry support for failed messages
- **Chatbot Automation**:
  - Keyword-based auto-replies
  - Conversation flows with branching logic and skip conditions
  - AI-powered responses (OpenAI, Anthropic, Google)
  - Agent transfer support
- **Canned Responses**: Pre-defined quick replies for agents
  - Organization-wide shared responses
  - Category-based organization (Greetings, Support, Sales, etc.)
  - Slash command support (type `/shortcut` in chat)
  - Dynamic placeholders (`{{contact_name}}`, `{{phone_number}}`)
- **Analytics Dashboard**: Track messages, engagement, and campaign performance

## Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard
![Dashboard](docs/public/images/01-dashboard.png)

### Chatbot Settings
![Chatbot Settings](docs/public/images/02-chatbot-settings.png)

### Keyword Rules
![Keyword Rules](docs/public/images/03-keyword-rules.png)
![Keyword Rule Editor](docs/public/images/04-keyword-rule-editor.png)

### AI Contexts
![AI Contexts](docs/public/images/05-ai-contexts.png)
![AI Context Editor](docs/public/images/06-ai-context-editor.png)

### Conversation Flows
![Conversation Flows](docs/public/images/07-conversation-flows.png)
![Conversation Flow Builder](docs/public/images/08-conversation-flow-builder.png)

### WhatsApp Flows
![WhatsApp Flows](docs/public/images/09-whatsapp-flows.png)
![WhatsApp Flow Builder](docs/public/images/10-whatsapp-flow-builder.png)

### Templates
![Templates](docs/public/images/11-templates.png)
![Template Editor](docs/public/images/12-template-editor.png)

### Campaigns
![Campaigns](docs/public/images/13-campaigns.png)
![Campaign Details](docs/public/images/14-campaign-details.png)

### Settings
![Settings](docs/public/images/15-settings.png)
![Account Settings](docs/public/images/16-account-settings.png)

</details>

## Tech Stack

### Backend
- **Go 1.21+** with [Fastglue](https://github.com/zerodha/fastglue) (fasthttp-based HTTP framework)
- **PostgreSQL** for data storage with GORM v2
- **Redis** for caching, pub/sub, and job queues (Redis Streams)
- **JWT** for authentication
- **Worker Service** for reliable campaign processing

### Frontend
- **Vue 3** with Composition API and TypeScript
- **Vite** for build tooling
- **shadcn-vue** / Radix Vue for UI components
- **TailwindCSS** for styling
- **Pinia** for state management
- **Vue Query** for server state

## Project Structure

```
whatomate/
├── cmd/
│   ├── server/           # Main application entry point
│   └── worker/           # Standalone worker entry point
├── internal/
│   ├── config/           # Configuration management
│   ├── database/         # Database connections
│   ├── handlers/         # HTTP handlers
│   ├── middleware/       # HTTP middleware
│   ├── models/           # Data models
│   ├── queue/            # Redis Streams job queue
│   ├── services/         # Business logic
│   └── worker/           # Worker service for job processing
├── docker/               # Docker configuration
├── frontend/             # Vue.js frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── views/        # Page views
│   │   ├── stores/       # Pinia stores
│   │   ├── services/     # API services
│   │   └── lib/          # Utilities
│   └── ...
├── config.example.toml   # Example configuration
├── Makefile              # Build commands
└── README.md
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone and configure**:
   ```bash
   cd whatomate
   cp config.example.toml config.toml
   # Edit config.toml with your settings
   ```

2. **Start backend**:
   ```bash
   # Install dependencies
   go mod download

   # Run database migrations
   make migrate

   # Start the server (includes 1 embedded worker by default)
   make run

   # Or run with more workers for higher throughput
   go run cmd/server/main.go -workers=3

   # Or disable embedded workers (run workers separately)
   go run cmd/server/main.go -workers=0
   ```

3. **Start frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Docker Setup

```bash
# Build Docker images
make docker-build

# Start all services (PostgreSQL, Redis, Server, Worker)
make docker-up
```

Access the application at `http://localhost:3000` or `http://localhost` (port 80 via nginx)

#### Other Docker Commands

```bash
# Stop all services
make docker-down

# View logs
make docker-logs

# Rebuild and restart
make docker-build && make docker-up
```

#### Scaling Workers

For high-volume campaign processing, you can scale the worker service:

```bash
cd docker
docker compose up -d --scale worker=3
```

Workers use Redis Streams consumer groups, ensuring each job is processed by exactly one worker.

### Default Admin Login

When you run migrations for the first time, a default admin user is created:

- **Email**: `admin@admin.com`
- **Password**: `admin`

> **Important**: Change this password immediately after first login via the Profile page.

## Configuration

Copy `config.example.toml` to `config.toml` and update the values:

```toml
[app]
name = "Whatomate"
environment = "development"
debug = true

[server]
host = "0.0.0.0"
port = 8080

[database]
host = "localhost"
port = 5432
user = "whatomate"
password = "your-password"
name = "whatomate"
ssl_mode = "disable"

[redis]
host = "localhost"
port = 6379
password = ""
db = 0

[jwt]
secret = "your-jwt-secret"
access_token_expiry = "15m"
refresh_token_expiry = "7d"

[whatsapp]
api_version = "v18.0"
webhook_verify_token = "your-webhook-verify-token"

[ai]
openai_api_key = ""
anthropic_api_key = ""
google_api_key = ""
```

## Worker Service

The worker service handles bulk campaign message processing using Redis Streams for reliable job queuing.

### Architecture

```
┌─────────────┐     Redis Streams      ┌─────────────┐
│   Server    │ ─────────────────────► │  Worker 1   │
│  (enqueue)  │   whatomate:campaigns  ├─────────────┤
└─────────────┘         │              │  Worker 2   │
                        └─────────────►│  Worker N   │
                                       └─────────────┘
```

### Features

- **Reliable Processing**: Jobs persist in Redis until acknowledged
- **Horizontal Scaling**: Add more workers to increase throughput
- **Graceful Shutdown**: Workers complete current job before stopping
- **Automatic Recovery**: Stale jobs are reclaimed on worker startup

### Running Workers

**Embedded Mode** (default): The server runs workers internally.

```bash
# Default: 1 worker
./whatomate

# Run with 3 embedded workers
./whatomate -workers=3

# Disable embedded workers (use standalone workers only)
./whatomate -workers=0
```

**Standalone Mode**: Run workers as separate processes.

```bash
# Run standalone worker (1 worker)
go run cmd/worker/main.go

# Run with multiple workers
go run cmd/worker/main.go -workers=5

# Or with Docker Compose
docker compose up -d --scale worker=3
```

### Scaling Workers Without Restart

Workers can be added dynamically without restarting the server. Since all workers consume from the same Redis Stream consumer group, new workers immediately start processing queued jobs.

```bash
# Server running with 1 embedded worker
go run cmd/server/main.go -workers=1

# In another terminal, add 5 more workers
go run cmd/worker/main.go -workers=5

# Add even more workers if needed
go run cmd/worker/main.go -workers=10
```

This is useful for:
- **Burst processing**: Scale up workers during high-volume campaigns
- **Zero-downtime scaling**: Add capacity without interrupting the server
- **Resource optimization**: Run workers on different machines

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### WhatsApp Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Contacts
- `GET /api/contacts` - List contacts (agents see only assigned)
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id/assign` - Assign contact to agent
- `GET /api/contacts/:id/messages` - Get messages
- `POST /api/contacts/:id/messages` - Send message

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates/sync` - Sync from Meta

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/start` - Start campaign (queues for processing)
- `POST /api/campaigns/:id/pause` - Pause campaign
- `POST /api/campaigns/:id/cancel` - Cancel campaign
- `POST /api/campaigns/:id/retry-failed` - Retry failed messages
- `GET /api/campaigns/:id/stats` - Get campaign statistics
- `GET /api/campaigns/:id/recipients` - List recipients
- `POST /api/campaigns/:id/recipients/import` - Import recipients

### WhatsApp Flows
- `GET /api/flows` - List flows
- `POST /api/flows` - Create flow
- `GET /api/flows/:id` - Get flow
- `PUT /api/flows/:id` - Update flow
- `DELETE /api/flows/:id` - Delete flow
- `POST /api/flows/:id/save-to-meta` - Save/update flow on Meta
- `POST /api/flows/:id/publish` - Publish flow on Meta
- `POST /api/flows/:id/deprecate` - Deprecate flow
- `POST /api/flows/sync` - Sync flows from Meta

### Chatbot
- `GET /api/chatbot/settings` - Get settings
- `PUT /api/chatbot/settings` - Update settings
- `GET /api/chatbot/keywords` - List keyword rules
- `GET /api/chatbot/flows` - List flows
- `GET /api/chatbot/ai-contexts` - List AI contexts

### Canned Responses
- `GET /api/canned-responses` - List canned responses
- `POST /api/canned-responses` - Create canned response
- `GET /api/canned-responses/:id` - Get canned response
- `PUT /api/canned-responses/:id` - Update canned response
- `DELETE /api/canned-responses/:id` - Delete canned response
- `POST /api/canned-responses/:id/use` - Track usage

### Webhooks
- `GET /api/webhook` - Webhook verification
- `POST /api/webhook` - Receive messages

## Role-Based Access Control

The platform supports three user roles with different permission levels:

| Feature | Admin | Manager | Agent |
|---------|-------|---------|-------|
| User Management | Full | None | None |
| Account Settings | Full | Full | None |
| Contacts | Full | Full | Assigned only |
| Messages | Full | Full | Assigned only |
| Templates | Full | Full | None |
| Flows | Full | Full | None |
| Campaigns | Full | Full | None |
| Chatbot Settings | Full | Full | None |
| Canned Responses | Full | Full | Use only |
| Analytics | Full | Full | None |

- **Admin**: Full access to all features including user management
- **Manager**: Full access except cannot manage users
- **Agent**: Can only chat with contacts assigned to them

## Conversation Flows

Conversation flows allow you to create multi-step automated conversations that collect information from users.

### Skip Conditions

Each step can have an optional **skip condition** that determines whether to skip the step based on previously collected data. If the condition evaluates to `true`, the step is skipped and the flow proceeds to the next step.

#### Syntax

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equals | `status == 'confirmed'` |
| `!=` | Not equals | `phone != ''` (not empty) |
| `>` | Greater than | `amount > 1000` |
| `<` | Less than | `age < 18` |
| `>=` | Greater or equal | `count >= 5` |
| `<=` | Less or equal | `score <= 100` |
| `AND` | All conditions must be true | `name != '' AND phone != ''` |
| `OR` | Any condition can be true | `status == 'vip' OR amount > 1000` |
| `()` | Grouping | `(status == 'vip' OR amount > 100) AND name != ''` |

#### Examples

```
# Skip if phone already collected
phone != ''

# Skip if both name and email are provided
name != '' AND email != ''

# Skip for VIP users or high-value orders
status == 'vip' OR amount > 1000

# Complex condition with grouping
(status == 'vip' OR amount > 100) AND name != ''
```

#### Button Responses

When a user clicks a button, two variables are stored:
- `{store_as}` - The button ID (e.g., `btn_1`)
- `{store_as}_title` - The button text (e.g., `Yes`)

To check the button text in skip conditions, use the `_title` suffix:
```
# Check button text
choice_title == 'Yes'

# Check button ID
choice == 'btn_yes'

# Check if any button was clicked (not empty)
choice != ''
```

## WhatsApp Setup

1. Create a Meta Developer account at [developers.facebook.com](https://developers.facebook.com)
2. Create a new app and add the WhatsApp product
3. Get your Phone Number ID and Business Account ID
4. Generate a permanent access token
5. Configure the webhook URL to point to `/api/webhook`
6. Set the webhook verify token in your configuration

## License

See [LICENSE](LICENSE) for details. Free to use and distribute.
