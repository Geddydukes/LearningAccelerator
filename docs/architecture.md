# System Architecture - Learning Accelerator

## C4 System Context Diagram

```mermaid
C4Context
    title Learning Accelerator - System Context

    Person(learner, "Learner", "User seeking accelerated learning through AI agents")
    
    System(la, "Learning Accelerator", "Multi-agent learning orchestration platform")
    
    System_Ext(gemini, "Google Gemini", "LLM API for agent intelligence")
    System_Ext(elevenlabs, "ElevenLabs", "Voice synthesis API")
    System_Ext(supabase, "Supabase", "Database, Auth & Storage")
    System_Ext(github, "GitHub/GitLab", "Code repository hosting")
    
    Rel(learner, la, "Interacts with", "HTTPS")
    Rel(la, gemini, "Agent prompts", "API calls")
    Rel(la, elevenlabs, "Voice synthesis", "API calls")
    Rel(la, supabase, "Data persistence", "PostgreSQL")
    Rel(la, github, "Code analysis", "Git API")
```

## C4 Container Diagram

```mermaid
C4Container
    title Learning Accelerator - Container View

    Person(learner, "Learner")
    
    Container(webapp, "Web Application", "React/TypeScript", "Learning dashboard and agent interfaces")
    Container(api, "API Gateway", "Supabase Edge Functions", "Secure agent proxy and business logic")
    Container(db, "Database", "PostgreSQL", "User data and weekly learning notes")
    Container(storage, "File Storage", "Supabase Storage", "Agent prompts and audio files")
    
    System_Ext(gemini, "Google Gemini")
    System_Ext(elevenlabs, "ElevenLabs")
    
    Rel(learner, webapp, "Uses", "HTTPS")
    Rel(webapp, api, "API calls", "REST/WebSocket")
    Rel(api, db, "Reads/Writes", "SQL")
    Rel(api, storage, "Retrieves prompts", "Object storage")
    Rel(api, gemini, "Agent requests", "HTTP API")
    Rel(api, elevenlabs, "Voice synthesis", "HTTP API")
```

## Component Architecture

### Frontend Components
- **Dashboard Module**: Main learning interface with agent cards
- **Agent Interaction Module**: Chat interfaces and voice controls  
- **Progress Module**: Weekly tracking and analytics
- **Auth Module**: Login, registration, and session management

### Backend Services
- **Agent Proxy Service**: Secure API key management and prompt injection
- **Authentication Service**: JWT handling and user management
- **Database Service**: Weekly JSON persistence with versioning
- **Voice Service**: ElevenLabs integration and audio caching

### Data Flow

1. **User Authentication**: Supabase Auth → JWT tokens → Protected routes
2. **Agent Interaction**: Frontend → API Gateway → Prompt injection → Gemini API
3. **Voice Synthesis**: Agent response → ElevenLabs API → Audio URL → Frontend playback
4. **Data Persistence**: Structured JSON → PostgreSQL → Historical tracking

## Security Architecture

### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant A as API Gateway
    
    U->>F: Login request
    F->>S: Authenticate
    S->>F: JWT token
    F->>A: API call with JWT
    A->>S: Verify token
    S->>A: Token valid
    A->>F: Protected resource
```

### Agent Proxy Security
- API keys stored server-side only
- Prompts never exposed to client
- Rate limiting on agent endpoints
- Input validation and sanitization

## Scalability Considerations

- **Horizontal Scaling**: Stateless API design enables load balancing
- **Caching Strategy**: Agent responses cached for performance
- **Database Optimization**: Indexed queries and connection pooling
- **CDN Integration**: Static assets and audio files served via CDN