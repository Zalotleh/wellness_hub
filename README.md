# 🌿 Wellness Hub - 5x5x5 Progress Tracking System

A comprehensive wellness platform with advanced 5x5x5 progress tracking, helping users optimize their health through the five defense systems.

**Status**: Phase 2 Complete ✅ | Backend APIs Ready | UI Development Next

---

## 🎯 What is 5x5x5?

The **5x5x5 System** is a holistic approach to nutrition tracking:

- **5 Defense Systems**: Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity
- **5 Foods per System**: Eat 5 different foods from each system daily
- **5 Times per Day**: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner

**Goal**: Achieve comprehensive health coverage through food variety and meal frequency.

---

## ✨ Features

### ✅ Implemented
- **Multi-System Food Tracking** - Foods can benefit multiple defense systems
- **Smart Food Matching** - Automatic ingredient matching to food database
- **5x5x5 Scoring Algorithm** - Real-time progress calculation (0-100%)
- **Meal Time Tracking** - Track consumption across 5 daily meal times
- **Source Tracking** - Manual, Recipe, or Meal Plan consumption
- **Defense System Benefits** - HIGH/MEDIUM/LOW strength ratings
- **Food Database** - 37 pre-categorized foods with 27 superfoods
- **Smart Recommendations** - AI-powered gap analysis and suggestions
- **Weekly Analytics** - Trends, streaks, and system breakdowns
- **Recipe Integration** - Mark entire recipes as consumed
- **Meal Plan Sync** - Automatically sync meal plans to progress

### 🚧 In Development
- UI Components (Phase 3)
- Frontend integration
- Visual analytics charts
- Mobile optimization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wellness-hub-5x5x5

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
npm run db:push

# Seed food database
npm run db:seed-foods

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[PROJECT_STATUS.md](docs/PROJECT_STATUS.md)** - Current project status and roadmap
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[PHASE_1_SUMMARY.md](docs/PHASE_1_SUMMARY.md)** - Database schema details
- **[PHASE_2_COMPLETE.md](docs/PHASE_2_COMPLETE.md)** - Backend implementation
- **[PHASE_3_QUICK_START.md](docs/PHASE_3_QUICK_START.md)** - UI development guide

---

## 🛠️ Available Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:push          # Deploy schema changes
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:generate      # Generate Prisma client
npm run db:seed-foods    # Seed food database (37 foods)
```

### Testing
```bash
npm run test:apis        # Test API functionality
npm run test:types       # Check TypeScript compilation
```

### Migration
```bash
npm run db:migrate-progress  # Migrate old Progress data to new system
```

---

## 📊 API Endpoints

All endpoints require authentication via NextAuth.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/progress/consumption` | POST | Log food consumption manually |
| `/api/progress/mark-recipe-consumed` | POST | Mark recipe as consumed |
| `/api/progress/daily-summary` | GET | Get daily progress summary |
| `/api/progress/food-database` | GET | Search food database |
| `/api/progress/weekly-summary` | GET | Get weekly analytics |
| `/api/progress/sync-meal-plan` | POST | Sync meal plan to progress |
| `/api/progress/recommendations` | GET | Get personalized recommendations |

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for detailed endpoint specifications.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Query (planned)
- **Testing**: Jest + React Testing Library (planned)

---

## 📈 Project Progress

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Database Schema | ✅ Complete | 100% |
| Phase 2: Backend APIs | ✅ Complete | 100% |
| Phase 3: UI Components | 🚧 Next | 0% |
| Phase 4: Integration | 📋 Pending | 0% |
| Phase 5: AI Features | 📋 Pending | 0% |
| Phase 6: Testing & Polish | 📋 Pending | 0% |

**Overall Progress**: ~33% Complete

---

## 🎨 Defense System Color Scheme

| System | Color | Icon | Abbreviation |
|--------|-------|------|--------------|
| Angiogenesis | Red | 🔴 | A |
| Regeneration | Green | 🟢 | R |
| Microbiome | Purple | 🟣 | M |
| DNA Protection | Blue | 🔵 | D |
| Immunity | Orange | 🟠 | I |

---

## 📁 Project Structure

```
wellness-hub-5x5x5/
├── app/                    # Next.js app directory
│   ├── (dashboard)/        # Dashboard pages
│   │   └── progress/       # Progress tracking pages
│   └── api/
│       └── progress/       # 7 API endpoints ✅
├── components/
│   ├── progress/           # Progress components (to build)
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── utils/
│   │   ├── progress-calculator.ts  # 5x5x5 scoring ✅
│   │   └── food-matcher.ts         # Food matching ✅
│   ├── auth.ts             # NextAuth configuration
│   └── prisma.ts           # Prisma client
├── prisma/
│   ├── schema.prisma       # Database schema ✅
│   ├── seed-foods.ts       # Food seeding script ✅
│   └── seeds/
│       └── food-database.ts # Food data (37 foods) ✅
├── scripts/
│   ├── test-apis.ts        # API tests ✅
│   └── migrate-progress.ts # Migration script ✅
├── docs/                   # Documentation ✅
└── types/
    └── index.ts            # TypeScript types ✅
```

---

## 🧪 Testing

### Database Tests
```bash
npm run test:apis
```

**Expected Output**:
```
✅ Total Foods in Database: 37
✅ Multi-System Foods: 27
✅ Defense Systems: 5 (all active)
✅ Meal Times: 6 (including custom)
🎉 All database models working correctly!
```

### Type Checking
```bash
npm run test:types
```

Should show **0 TypeScript errors**.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wellness_hub"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional
NODE_ENV="development"
```

---

## 📊 Database Statistics

- **Total Foods**: 37
- **Multi-System Foods**: 27 (73%)
- **Defense Systems Covered**: 5
- **Meal Times Supported**: 6
- **Consumption Sources**: 3

**Top Multi-System Foods**:
- Blueberries (4 systems)
- Kale (4 systems)
- Cranberries (4 systems)
- Apples (4 systems)

---

## 🚦 Getting Started with Development

### Phase 3: UI Components

The next phase focuses on building React components. Start with:

1. **MultiSystemBadge** - Foundation component for defense system display
2. **5x5x5ScoreCard** - Dashboard widget showing overall score
3. **MealTimeTracker** - Visual timeline of daily meal times

See [PHASE_3_QUICK_START.md](docs/PHASE_3_QUICK_START.md) for detailed implementation guide.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Run `npm run test:types` before committing
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Database powered by [Prisma](https://prisma.io)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Based on Dr. William Li's 5 Defense Systems research

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **API Reference**: [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Database Schema**: Run `npm run db:studio`
- **Issues**: Open a GitHub issue

---

**Status**: Backend Complete ✅ | Ready for UI Development 🎨

*Last Updated: January 7, 2026*
