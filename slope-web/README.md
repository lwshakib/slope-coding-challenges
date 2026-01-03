# Slope Web Client

The **Slope Web Client** is the user-facing frontend of the Slope platform. It provides a modern, responsive, and immersive interface for developers to solve algorithmic challenges.

## 🎨 Design Philosophy

- **Use Rich Aesthetics**: Vibrant colors, glassmorphism, and modern typography (Inter/Outfit).
- **Interactive**: Smooth animations with Framer Motion (`motion/react`).
- **Developer Centric**: A powerful Monaco-like code editor experience.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn/UI](https://ui.shadcn.com/) (Radix UI primitives)
- **Editor**: CodeMirror (via `@uiw/react-codemirror`)
- **State Management**: Zustand
- **Graphics**: Recharts (Analytics), Lucide React (Icons)

## ✨ Key Pages & Features

- **Dashboard**: Overview of user progress, recent activity, and recommended problems.
- **Problem List**: Filterable and searchable table of all coding challenges.
- **Problem Workspace (IDE)**:
    - **Description Panel**: Markdown rendered problem statement.
    - **Code Editor**: Syntax highlighting for JS, Python, C++.
    - **Console**: View test case results and execution logs.
    - **Submission Status**: Real-time feedback on your solution.
- **Analytics**: Visualization of problem-solving streaks and category mastery.

## 🚀 Getting Started

### Prerequisites
- Node.js or Bun installed.

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Configure Environment
Create a `.env.local` file and point it to your backend API:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Directory Structure

```
slope-web/
├── app/                # Next.js App Router pages
├── components/         # Reusable UI components (buttons, cards, IDE)
├── lib/                # Utilities, hooks, and API clients
├── stores/             # Zustand state stores
└── public/             # Static assets
```
