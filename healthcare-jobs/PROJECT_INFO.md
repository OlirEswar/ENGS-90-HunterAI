# HealthCare Connect - Healthcare Job Recruiting Platform

A modern Next.js-based healthcare job recruiting platform that helps healthcare professionals find their perfect career match.

## Features

### 1. Landing Page
- Clean, healthcare-themed design with gradient blue/teal color scheme
- Options to sign up or log in
- Feature highlights showcasing platform benefits

### 2. Authentication
- **Login Page** ([/login](app/login/page.tsx)): Standard email/password login
- **Sign Up Flow**: Three-step onboarding process
  - Step 1 ([/signup/resume](app/signup/resume/page.tsx)): Resume upload with drag-and-drop functionality
  - Step 2 ([/signup/questionnaire](app/signup/questionnaire/page.tsx)): Humanistic questionnaire to understand candidate motivations and work style
  - Step 3 ([/signup/preferences](app/signup/preferences/page.tsx)): Set location, salary, and department preferences

### 3. Dashboard
- **Job Grid** ([/dashboard](app/dashboard/page.tsx)):
  - Displays matched jobs as clickable tiles
  - Each tile shows job title, company, location, salary, and department
  - Responsive grid layout (1-3 columns based on screen size)

- **Job Details Modal**:
  - Expands when clicking a job tile
  - Shows full job description, requirements, and benefits
  - Apply and Save options

- **Sidebar Navigation**:
  - Matched Jobs (active)
  - Saved Jobs
  - Applications
  - Profile
  - Settings
  - Sign Out

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Design**: Healthcare-themed with medical blue (#0ea5e9), teal (#14b8a6), and emerald (#10b981) color palette

## Project Structure

```
healthcare-jobs/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── login/page.tsx                    # Login page
│   ├── signup/
│   │   ├── resume/page.tsx              # Resume upload
│   │   ├── questionnaire/page.tsx       # Questionnaire
│   │   └── preferences/page.tsx         # Preferences
│   ├── dashboard/page.tsx               # Main dashboard with job grid
│   ├── layout.tsx                       # Root layout
│   └── globals.css                      # Global styles
├── lib/
│   └── api.ts                           # API functions (with dummy data)
├── types/
│   └── index.ts                         # TypeScript interfaces
└── components/                          # (Empty - ready for components)
```

## Key Files

- [app/page.tsx](app/page.tsx): Landing page with hero section and feature cards
- [app/login/page.tsx](app/login/page.tsx): Login form with placeholder authentication
- [app/signup/resume/page.tsx](app/signup/resume/page.tsx): Resume upload with drag-and-drop
- [app/signup/questionnaire/page.tsx](app/signup/questionnaire/page.tsx): 4-question humanistic assessment
- [app/signup/preferences/page.tsx](app/signup/preferences/page.tsx): Job preferences configuration
- [app/dashboard/page.tsx](app/dashboard/page.tsx): Main app with job grid, sidebar, and modal
- [lib/api.ts](lib/api.ts): API placeholder functions with 8 dummy healthcare jobs
- [types/index.ts](types/index.ts): TypeScript type definitions

## Dummy Data

The application includes 8 sample healthcare jobs across various departments:
- Registered Nurse - ICU
- Physical Therapist
- Medical Laboratory Technician
- Physician Assistant - Emergency Medicine
- Radiology Technologist
- Clinical Pharmacist
- Occupational Therapist
- Respiratory Therapist

## API Integration

All API calls are implemented as placeholder functions in [lib/api.ts](lib/api.ts). They make fetch requests that will fail (as expected), then return dummy data. The functions include:

- `loginUser()`: User authentication
- `registerUser()`: User registration
- `uploadResume()`: Resume file upload
- `getMatchedJobs()`: Fetch matched jobs for user
- `updateUserProfile()`: Update user preferences

To integrate with a real backend, simply update these functions to point to your actual API endpoints.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Design Philosophy

The application uses a **healthcare-focused design** with:
- Clean, professional interface
- Calming blue and teal gradients
- Medical-themed icons (heart, medical bag, etc.)
- Accessible color contrasts
- Modern rounded corners and smooth transitions
- Responsive layout for all screen sizes

## Next Steps for Production

1. **Backend Integration**:
   - Set up authentication API
   - Implement file upload service for resumes
   - Create job matching algorithm
   - Build user profile management

2. **Database**:
   - User accounts and profiles
   - Job listings
   - Applications tracking
   - Saved jobs

3. **Additional Features**:
   - Email notifications
   - Application tracking
   - Profile editing
   - Advanced job filtering
   - Real-time updates

## Notes

- All API calls currently fail gracefully and return mock data
- SessionStorage is used for multi-step signup flow
- The app is fully responsive and works on mobile, tablet, and desktop
- All pages include proper navigation and back buttons
