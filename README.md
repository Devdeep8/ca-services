# 🏛️ CA Practice Automation

A comprehensive platform for Chartered Accountants in India to streamline GST returns, ITR filings, and client management with AI-powered automation.

## ✨ Features

### 🏛️ Core Functionality
- **Bulk GST Return Processing** - Automate GSTR-1 and GSTR-3B workflows
- **Income Tax Return Management** - Streamline ITR preparation and filing
- **Client Management** - Multi-GSTIN client profiles with automated reminders
- **Document Tracking** - Secure document storage and organization

### 🤖 AI-Powered Features
- **Document Data Extraction** - Intelligent parsing of invoices and financial documents
- **Reconciliation Analysis** - AI-powered discrepancy detection and explanations
- **Communication Drafting** - Automated email and notice generation
- **Tax Advisory Q&A** - Intelligent responses to tax-related queries

### 🔐 Authentication & Security
- **Role-Based Access** - CA, Staff, and Client roles with appropriate permissions
- **Google OAuth** - Quick and secure sign-in with Google accounts
- **Email/Password Auth** - Traditional authentication with bcrypt security
- **Session Management** - Secure session handling with NextAuth.js

## 🚀 Technology Stack

### Frontend
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - High-quality UI components
- **🔄 Zustand** - Lightweight state management
- **📊 TanStack Query** - Server state management

### Backend
- **🗄️ Prisma** - Modern ORM with SQLite
- **🔐 NextAuth.js** - Authentication framework
- **🤖 z-ai-web-dev-sdk** - AI integration
- **🔌 Socket.io** - Real-time communication

## 🏗️ Database Schema

The application uses a comprehensive database schema designed for CA practices:

```
Organization (CA Firms)
├── Membership (User roles)
├── Client (Client profiles)
├── Business (Business entities)
├── GSTIN (GST registration details)
├── Document (File storage and metadata)
├── GSTReturn (GSTR-1, GSTR-3B data)
├── ITR (Income Tax Return data)
├── Reminder (Compliance deadlines)
└── AIAnalysis (AI-powered insights)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd ca-practice-automation
npm install
```

2. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Or run the setup script
./setup.sh
```

3. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

4. **Configure Google OAuth (Optional)**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
   - Update `.env` with your credentials:
     ```
     GOOGLE_CLIENT_ID=your-client-id
     GOOGLE_CLIENT_SECRET=your-client-secret
     ```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=file:./db/custom.db

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🎯 User Roles

### CA (Chartered Accountant)
- Full access to all features
- Can create and manage organizations
- Can add staff members and clients
- Can manage GST returns and ITR filings
- Access to AI-powered features and analytics

### Staff
- Access to assigned clients and tasks
- Can upload and process documents
- Can prepare returns under supervision
- Limited access to organization settings

### Client
- Can upload own documents
- Can view return status
- Can receive automated reminders
- Limited access to own data only

## 🤖 AI Integration

The platform integrates AI capabilities through the `z-ai-web-dev-sdk`:

### Document Processing
```javascript
// Automatic data extraction from invoices
const extractedData = await zai.chat.completions.create({
  messages: [{
    role: 'user',
    content: 'Extract GST details from this invoice...'
  }]
});
```

### Reconciliation Analysis
```javascript
// AI-powered GST reconciliation
const analysis = await zai.chat.completions.create({
  messages: [{
    role: 'user',
    content: 'Analyze discrepancies between GSTR-1 and GSTR-3B...'
  }]
});
```

### Communication Drafting
```javascript
// Automated email generation
const email = await zai.chat.completions.create({
  messages: [{
    role: 'user',
    content: 'Draft a reminder email for pending GST return...'
  }]
});
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── ...
│   ├── auth/              # Authentication pages
│   │   ├── sign-in/       # Login page
│   │   └── sign-up/       # Registration page
│   ├── dashboard/         # Main dashboard
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers.tsx     # Session provider
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Helper functions
└── prisma/               # Database schema
```

## 🚀 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth routes

#### Document Processing
- `POST /api/documents/process` - AI-powered document processing
- `POST /api/documents/upload` - File upload

#### GST Returns
- `POST /api/gst/reconcile` - GST reconciliation analysis
- `POST /api/gst/validate` - Return validation

#### AI Features
- `POST /api/communications/draft` - Generate communications
- `POST /api/tax/qa` - Tax Q&A system

## 🔧 Configuration

### Authentication Configuration

The authentication system is configured in `src/lib/auth.ts`:

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      // Email/password authentication
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Custom JWT and session handling
  },
};
```

### Database Configuration

Database schema is defined in `prisma/schema.prisma`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      UserRole // CA, Staff, Client
  // ... other fields
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

Built with ❤️ for Chartered Accountants in India. Streamlining tax compliance with AI-powered automation.