# Complete Kaneo Clone Project Management Tool - Development Prompt

## Project Overview
Create a full-featured project management application similar to Kaneo (demo.kaneo.app) using Next.js 14, TypeScript, Prisma, MySQL, and shadcn/ui. This is a monolithic application designed for internal company use that can be deployed on Vercel.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (with Radix UI primitives)
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MySQL with Prisma ORM
- **Authentication**: Custom JWT-based session management
- **Drag & Drop**: @dnd-kit/core
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Deployment**: Vercel

## Core Features to Implement

### 1. Authentication System
- User registration and sign-in with email/password
- JWT-based session management with HTTP-only cookies
- Protected routes using Next.js middleware
- User profile management
- Role-based access control (admin, manager, member)

### 2. Workspace Management
- Create, edit, delete workspaces
- Invite team members via email
- Workspace member roles and permissions
- Workspace settings and configuration

### 3. Project Management
- Create projects within workspaces
- Project status tracking (active, completed, archived)
- Priority levels (low, medium, high, urgent)
- Project deadlines and milestones
- Project member assignment and roles

### 4. Kanban Board System
- Drag-and-drop task management using @dnd-kit
- Customizable columns (To Do, In Progress, Review, Done)
- Real-time task position updates
- Column reordering and customization
- Visual task status indicators

### 5. Task Management
- Create, edit, delete tasks with rich descriptions
- Task assignment to team members
- Priority and status management
- Due dates and time estimates
- Task comments and discussions
- File attachments support
- Task search and filtering

### 6. Time Tracking
- Manual time entry for tasks
- Built-in timer functionality
- Time tracking reports and analytics
- Daily/weekly/monthly time summaries
- Billable hours tracking

### 7. Collaboration Features
- Task comments with @mentions
- Real-time activity feed
- File sharing and attachments
- Team notifications
- Project activity history

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  avatar    String?
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  ownedWorkspaces    Workspace[]       @relation("WorkspaceOwner")
  workspaceMemberships WorkspaceMember[]
  projectMemberships ProjectMember[]
  assignedTasks      Task[]            @relation("TaskAssignee")
  reportedTasks      Task[]            @relation("TaskReporter")
  comments           TaskComment[]
  timeEntries        TimeEntry[]
  attachments        TaskAttachment[]
  activityLogs       ActivityLog[]

  @@map("users")
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  owner     User               @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members   WorkspaceMember[]
  projects  Project[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceRole @default(MEMBER)
  joinedAt    DateTime      @default(now())

  // Relations
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  workspaceId String
  status      ProjectStatus @default(ACTIVE)
  priority    Priority      @default(MEDIUM)
  startDate   DateTime?
  dueDate     DateTime?
  createdBy   String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  workspace   Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator     User            @relation(fields: [createdBy], references: [id])
  members     ProjectMember[]
  columns     Column[]
  tasks       Task[]
  activityLogs ActivityLog[]

  @@map("projects")
}

model ProjectMember {
  id        String      @id @default(cuid())
  projectId String
  userId    String
  role      ProjectRole @default(MEMBER)
  assignedAt DateTime   @default(now())

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}

model Column {
  id        String   @id @default(cuid())
  name      String
  projectId String
  position  Int
  color     String   @default("#6B7280")
  createdAt DateTime @default(now())

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@unique([projectId, position])
  @@map("columns")
}

model Task {
  id             String     @id @default(cuid())
  title          String
  description    String?
  columnId       String
  projectId      String
  assigneeId     String?
  reporterId     String
  position       Int
  priority       Priority   @default(MEDIUM)
  status         TaskStatus @default(TODO)
  estimatedHours Decimal?   @db.Decimal(5, 2)
  actualHours    Decimal    @default(0) @db.Decimal(5, 2)
  startDate      DateTime?
  dueDate        DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  // Relations
  column      Column           @relation(fields: [columnId], references: [id], onDelete: Cascade)
  project     Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?            @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  reporter    User             @relation("TaskReporter", fields: [reporterId], references: [id])
  comments    TaskComment[]
  timeEntries TimeEntry[]
  attachments TaskAttachment[]
  activityLogs ActivityLog[]

  @@map("tasks")
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@map("task_comments")
}

model TimeEntry {
  id          String   @id @default(cuid())
  taskId      String
  userId      String
  description String?
  hours       Decimal  @db.Decimal(5, 2)
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@map("time_entries")
}

model TaskAttachment {
  id         String   @id @default(cuid())
  taskId     String
  userId     String
  filename   String
  url        String
  fileSize   Int?
  mimeType   String?
  uploadedAt DateTime @default(now())

  // Relations
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@map("task_attachments")
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  projectId   String
  taskId      String?
  action      String
  description String?
  metadata    Json?
  createdAt   DateTime @default(now())

  // Relations
  user    User     @relation(fields: [userId], references: [id])
  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task    Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@map("activity_logs")
}

// Enums
enum Role {
  ADMIN
  MANAGER
  MEMBER
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
}

enum ProjectRole {
  LEAD
  MEMBER
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

## Project Structure

```
kaneo-clone/
├── package.json
├── next.config.js
├── tailwind.config.js
├── components.json
├── tsconfig.json
├── .env.local
├── .env.example
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── sign-in/
    │   │   │   └── page.tsx
    │   │   ├── sign-up/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   ├── (dashboard)/
    │   │   ├── dashboard/
    │   │   │   └── page.tsx
    │   │   ├── workspaces/
    │   │   │   ├── page.tsx
    │   │   │   └── [workspaceId]/
    │   │   │       ├── page.tsx
    │   │   │       ├── projects/
    │   │   │       │   ├── page.tsx
    │   │   │       │   └── [projectId]/
    │   │   │       │       ├── page.tsx
    │   │   │       │       └── settings/
    │   │   │       │           └── page.tsx
    │   │   │       ├── members/
    │   │   │       │   └── page.tsx
    │   │   │       └── settings/
    │   │   │           └── page.tsx
    │   │   ├── profile/
    │   │   │   └── page.tsx
    │   │   ├── settings/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   └── api/
    │       ├── auth/
    │       │   ├── sign-in/
    │       │   │   └── route.ts
    │       │   ├── sign-up/
    │       │   │   └── route.ts
    │       │   └── sign-out/
    │       │       └── route.ts
    │       ├── workspaces/
    │       │   ├── route.ts
    │       │   └── [workspaceId]/
    │       │       ├── route.ts
    │       │       └── members/
    │       │           └── route.ts
    │       ├── projects/
    │       │   ├── route.ts
    │       │   └── [projectId]/
    │       │       ├── route.ts
    │       │       ├── columns/
    │       │       │   └── route.ts
    │       │       └── tasks/
    │       │           ├── route.ts
    │       │           └── [taskId]/
    │       │               ├── route.ts
    │       │               ├── comments/
    │       │               │   └── route.ts
    │       │               └── time-entries/
    │       │                   └── route.ts
    │       └── users/
    │           └── me/
    │               └── route.ts
    ├── components/
    │   ├── ui/ (shadcn/ui components)
    │   ├── auth/
    │   ├── dashboard/
    │   ├── workspace/
    │   ├── project/
    │   ├── kanban/
    │   ├── time-tracking/
    │   └── common/
    ├── lib/
    │   ├── auth.ts
    │   ├── db.ts
    │   ├── utils.ts
    │   ├── validations.ts
    │   └── constants.ts
    ├── hooks/
    │   ├── use-auth.ts
    │   ├── use-local-storage.ts
    │   └── use-debounce.ts
    ├── types/
    │   └── index.ts
    └── store/
        ├── auth-store.ts
        └── kanban-store.ts
```

## Key Implementation Steps

### 1. Project Setup
```bash
npx create-next-app@latest kaneo-clone --typescript --tailwind --eslint --app
cd kaneo-clone
npm install prisma @prisma/client
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install zustand react-hook-form @hookform/resolvers zod
npm install bcryptjs jsonwebtoken
npm install lucide-react date-fns
npx prisma init
npx shadcn-ui@latest init
```

### 2. shadcn/ui Components to Install
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
```

### 3. Environment Variables (.env.local)
```env
DATABASE_URL="mysql://username:password@localhost:3306/kaneo_clone"
NEXTAUTH_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Database Setup
```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

### 5. Authentication Implementation
- Create JWT utilities in `lib/auth.ts`
- Implement sign-in/sign-up API routes
- Create middleware for protected routes
- Build authentication forms with shadcn/ui

### 6. Kanban Board Implementation
- Use @dnd-kit for drag-and-drop functionality
- Create sortable task cards and columns
- Implement real-time position updates
- Add column customization features

### 7. Time Tracking Features
- Build timer component with start/stop functionality
- Create time entry forms
- Implement time reporting and analytics
- Add time tracking to task cards

### 8. Deployment on Vercel
- Set up environment variables in Vercel dashboard
- Configure MySQL database (use PlanetScale or Railway)
- Deploy with automatic CI/CD from GitHub
- Set up custom domain if needed

## Key Components to Build

### 1. KanbanBoard Component
```typescript
interface KanbanBoardProps {
  projectId: string;
  columns: Column[];
  tasks: Task[];
}

export function KanbanBoard({ projectId, columns, tasks }: KanbanBoardProps) {
  // Implement drag-and-drop logic with @dnd-kit
}
```

### 2. TaskCard Component
```typescript
interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  // Draggable task card with all task details
}
```

### 3. TimeTracker Component
```typescript
interface TimeTrackerProps {
  taskId: string;
  onTimeEntry: (hours: number, description: string) => void;
}

export function TimeTracker({ taskId, onTimeEntry }: TimeTrackerProps) {
  // Timer functionality and manual time entry
}
```

## UI/UX Requirements
- Clean, modern interface similar to Kaneo demo
- Dark/light theme support
- Fully responsive design (mobile-first)
- Intuitive drag-and-drop interactions
- Real-time updates and notifications
- Keyboard shortcuts for power users
- Loading states and error handling
- Accessible components (ARIA labels, keyboard navigation)

## Performance Considerations
- Implement proper caching strategies
- Optimize database queries with Prisma
- Use React.memo for expensive components
- Implement virtual scrolling for large task lists
- Compress images and optimize assets
- Server-side rendering for better SEO

## Security Features
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- XSS protection
- CSRF token implementation
- Rate limiting on API routes
- Secure JWT token handling
- Role-based access control

## Testing Strategy
- Unit tests for utility functions
- Integration tests for API routes
- Component testing with Testing Library
- E2E tests for critical user flows
- Database migration testing

## Deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates set up
- [ ] Domain configuration
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Backup strategy
- [ ] CI/CD pipeline

This comprehensive prompt provides everything needed to build a production-ready Kaneo clone that can be deployed on Vercel and used as an internal company tool. The application will be fully functional with modern UI, robust authentication, real-time collaboration features, and comprehensive project management capabilities.