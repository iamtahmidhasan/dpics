import "dotenv/config"
import prisma from "../src/lib/prisma"
import { CourseLevel, InstructorStatus } from "../src/generated/prisma/enums"

async function main() {
  console.log("🌱 Starting Course Seeder...")

  // 1. Ensure instructors exist
  let instructors = await prisma.instructor.findMany({
    include: { user: true },
  })

  // Check if second user can be made an instructor
  const unlinkedInstructorUser = await prisma.user.findFirst({
    where: {
      instructor: null,
      roles: { has: "INSTRUCTOR" },
    },
  })

  if (unlinkedInstructorUser) {
    const newInst = await prisma.instructor.create({
      data: {
        userId: unlinkedInstructorUser.id,
        instructorId: "INST-" + Math.floor(1000 + Math.random() * 9000),
        bio: "Senior Software Engineer and Mentor at DPI Computing Society.",
        expertise: "Full-Stack Development, Architecture, System Design",
        status: InstructorStatus.ACTIVE,
      },
      include: { user: true },
    })
    instructors.push(newInst)
  }

  // If still fewer than 2, get any user to become instructor for realistic multi-instructor demonstration
  if (instructors.length < 2) {
    const anotherUser = await prisma.user.findFirst({
      where: {
        instructor: null,
      },
    })
    if (anotherUser) {
      const createdInst = await prisma.instructor.create({
        data: {
          userId: anotherUser.id,
          instructorId: "INST-" + Math.floor(1000 + Math.random() * 9000),
          bio: "Competitive Programmer, Algorithms Specialist & Lab Mentor.",
          expertise: "C++, Data Structures, Algorithms, Problem Solving",
          status: InstructorStatus.ACTIVE,
        },
        include: { user: true },
      })
      instructors.push(createdInst)
    }
  }

  console.log(`👨‍🏫 Available Instructors: ${instructors.length}`)
  const inst1 = instructors[0]?.id
  const inst2 = instructors[1]?.id || inst1

  // 10 Full Size Dummy Courses Data
  const coursesData = [
    {
      title: "Full-Stack Next.js 15 & React 19 Mastery",
      slug: "full-stack-nextjs-15-react-19-mastery",
      excerpt: "Master modern web development with Next.js 15 App Router, React 19 Server Components, Prisma ORM, and Tailwind CSS.",
      description: `### Become a Modern Full-Stack Engineer with Next.js 15

Welcome to the definitive hands-on course designed specifically for polytechnic engineers and modern web developers. In this comprehensive course, you'll go from basic JavaScript/React understanding to building production-ready, highly scalable full-stack applications.

#### What you will learn:
- **Next.js 15 App Router:** Server vs Client Components, Nested Layouts, Streaming with Suspense.
- **Server Actions & Mutations:** Direct database operations with zero boilerplate API routes.
- **Database Architecture:** PostgreSQL with Prisma ORM 7, migrations, relations, and indexing.
- **Authentication & Security:** Better-Auth, session management, RBAC (Role-Based Access Control).
- **Styling & UI:** Tailwind CSS v4, dynamic dark mode, micro-interactions, responsive layouts.
- **Deployment & Production:** Vercel, Neon DB, environment secrets, and Lighthouse performance optimization.`,
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.INTERMEDIATE,
      isFree: true,
      price: 0,
      discountPrice: null,
      isPublished: true,
      featured: true,
      tags: ["Next.js", "React 19", "Prisma", "Full-Stack", "TypeScript", "Tailwind CSS"],
      sections: [
        {
          title: "Module 1: Foundations of Next.js 15 App Router",
          description: "Understanding React 19 features, Server Components vs Client Components, and routing conventions.",
          lessons: [
            {
              title: "1.1 Introduction to Next.js 15 & The App Router Paradigm",
              description: "Deep dive into why Next.js 15 is revolutionizing full-stack React development. Comparing Pages router with App router.",
              duration: "22 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=d56mG7DezGs",
              documents: [
                { title: "Next.js 15 Architecture Cheat Sheet.pdf", url: "https://nextjs.org/docs", size: "2.1 MB" },
              ],
              quiz: {
                title: "Next.js 15 Architecture Quiz",
                questions: [
                  {
                    id: "q1",
                    question: "Which component type is the default in Next.js App Router?",
                    options: ["Client Component", "Server Component", "Static Component", "Hybrid Component"],
                    correctIndex: 1,
                    explanation: "In Next.js App Router, all components inside the app directory are React Server Components by default unless marked with 'use client'.",
                  },
                  {
                    id: "q2",
                    question: "What directive must you add at the top of a file to make it interactive with hooks like useState?",
                    options: ["'use server'", "'use interactive'", "'use client'", "'enable hooks'"],
                    correctIndex: 2,
                    explanation: "'use client' instructs React and Next.js to package the component for client-side JavaScript execution.",
                  },
                ],
              },
              resources: [
                { title: "GitHub Starter Boilerplate", url: "https://github.com/vercel/next.js", type: "code" },
              ],
              externalLinks: [
                { title: "Next.js 15 Official Release Notes", url: "https://nextjs.org/blog/next-15" },
              ],
              instructors: [
                { id: inst1, role: "Lead Instructor" },
                ...(inst2 && inst2 !== inst1 ? [{ id: inst2, role: "Teaching Assistant" }] : []),
              ],
            },
            {
              title: "1.2 Layouts, Nested Routing & Loading States with Suspense",
              description: "Constructing persistent navigation, root layouts, nested folder structures, and streaming UI with loading.tsx.",
              duration: "30 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=8jj1Azv4tV8",
              documents: [
                { title: "Routing & Suspense Guide.pdf", url: "https://nextjs.org/docs", size: "1.8 MB" },
              ],
              assignment: {
                title: "Build a Multi-Page Layout with Active Nav Indicators",
                description: "Create an app directory layout with a responsive navbar, dark mode toggle, and dynamic nested routes under /dashboard.",
                deadline: "2026-10-20",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: Server Actions & Prisma Database Integration",
          description: "Connecting Neon PostgreSQL, modeling database schema with Prisma, and performing typesafe CRUD mutations.",
          lessons: [
            {
              title: "2.1 Setting up Prisma ORM & PostgreSQL Schema",
              description: "Defining models, relationships, running migrations, and seeding dummy data with Prisma Studio.",
              duration: "35 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=RebA5J-rlhU",
              resources: [
                { title: "Prisma Schema Template", url: "https://prisma.io", type: "code" },
              ],
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "2.2 Server Actions for Forms & Optimistic Updates",
              description: "Handling form submissions safely on the server, revalidating cache paths with revalidatePath, and handling optimistic UI.",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=d56mG7DezGs",
              liveClass: {
                date: "2026-10-18T14:00:00.000Z",
                link: "https://meet.google.com/xyz-nextjs-live",
                recording: "https://www.youtube.com/watch?v=d56mG7DezGs",
              },
              instructors: [
                { id: inst1, role: "Lead Instructor" },
                ...(inst2 && inst2 !== inst1 ? [{ id: inst2, role: "Lab Mentor" }] : []),
              ],
            },
          ],
        },
        {
          title: "Module 3: Capstone Project & Production Deployment",
          description: "Building an end-to-end production web app and deploying to Vercel with automated CI/CD.",
          lessons: [
            {
              title: "3.1 Authentication & Role-Based Access Control",
              description: "Implementing secure login, signup, session tokens, and admin-only protected route handlers.",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8jj1Azv4tV8",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "3.2 Performance Auditing & Vercel Production Deployment",
              description: "Fixing Largest Contentful Paint (LCP), optimizing images, configuring environment variables, and going live.",
              duration: "28 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=d56mG7DezGs",
              assignment: {
                title: "Deploy Your Capstone Next.js Project Live",
                description: "Deploy your full-stack repository to Vercel or Railway with PostgreSQL, and submit your live production URL.",
                deadline: "2026-10-30",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
      ],
    },
    {
      title: "Competitive Programming & Data Structures with C++",
      slug: "competitive-programming-data-structures-c-plus-plus",
      excerpt: "Crack ICPC, NCPC, and coding interviews with in-depth algorithms, graphs, dynamic programming, and data structures in C++20.",
      description: `### Conquer Contest Programming & Algorithmic Problem Solving

Dhaka Polytechnic Institute Computing Society brings you an intensive, battle-tested competitive programming curriculum. Whether preparing for intra-polytechnic programming contests, NCPC, or tech company technical rounds, this course takes you from fundamental C++ syntax to advanced graph theory and dynamic programming.

#### What you will master:
- **C++ Standard Template Library (STL):** vectors, pairs, sets, maps, priority queues, and iterators.
- **Time & Space Complexity:** Big-O notation, amortized analysis, constraints math.
- **Core Algorithms:** Binary search, two pointers, prefix sums, number theory (sieve, GCD, modular arithmetic).
- **Advanced Data Structures:** Disjoint Set Union (DSU), Segment Trees, Fenwick Trees (BIT).
- **Graph Algorithms:** BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Topological Sort.
- **Dynamic Programming (DP):** 0/1 Knapsack, Coin Change, LCS, LIS, Grid DP.`,
      thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.BEGINNER,
      isFree: true,
      price: 0,
      discountPrice: null,
      isPublished: true,
      featured: true,
      tags: ["C++", "Competitive Programming", "Algorithms", "Data Structures", "ICPC", "Problem Solving"],
      sections: [
        {
          title: "Module 1: C++ STL & Algorithmic Foundations",
          description: "Writing efficient C++, using fast I/O, and mastering STL containers.",
          lessons: [
            {
              title: "1.1 Fast I/O, Time Complexity Analysis & C++ STL Vectors",
              description: "Understanding milliseconds vs operations limit (10^8 operations per second in C++), ios_base::sync_with_stdio(false), and vectors.",
              duration: "32 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=RBSGKlAvoiM",
              documents: [
                { title: "C++ STL Cheat Sheet.pdf", url: "https://en.cppreference.com", size: "3.2 MB" },
              ],
              quiz: {
                title: "Complexity & STL Check",
                questions: [
                  {
                    id: "cp-q1",
                    question: "What is the average time complexity of searching an element in std::unordered_map?",
                    options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
                    correctIndex: 2,
                    explanation: "std::unordered_map is implemented with a hash table, offering O(1) average lookup time.",
                  },
                ],
              },
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
            {
              title: "1.2 Binary Search & The Two Pointers Technique",
              description: "Binary search on answers, lower_bound, upper_bound, and solving classic Codeforces 1200-1400 problems.",
              duration: "40 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              assignment: {
                title: "Solve 5 Binary Search Problems on VJudge",
                description: "Solve the 5 curated contest problems on binary search and two pointers, and submit your handle.",
                deadline: "2026-10-22",
                submissionUrl: "https://vjudge.net",
              },
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
          ],
        },
        {
          title: "Module 2: Graph Theory & Trees",
          description: "Representing graphs with adjacency lists, traversing with BFS/DFS, and finding shortest paths.",
          lessons: [
            {
              title: "2.1 Graph Representation, BFS, DFS & Connected Components",
              description: "Understanding undirected, directed, weighted graphs, cycle detection, and flood fill algorithms.",
              duration: "48 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
            {
              title: "2.2 Dijkstra's Algorithm for Shortest Paths",
              description: "Using priority_queue to implement Dijkstra in O((V + E) log V). Handling negative weight warnings.",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
          ],
        },
        {
          title: "Module 3: Dynamic Programming (DP) Mastery",
          description: "Transitioning from recursion to memoization and bottom-up DP tables.",
          lessons: [
            {
              title: "3.1 Recursion to Memoization & The 0/1 Knapsack Problem",
              description: "Formulating states, transitions, base cases, and avoiding TLE using memoization arrays.",
              duration: "55 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
            {
              title: "3.2 Longest Common Subsequence (LCS) & Path Printing",
              description: "Standard string DP pattern, table reconstruction, and space-optimized DP solutions.",
              duration: "42 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
          ],
        },
      ],
    },
    {
      title: "Complete Python for Beginners to Data Science",
      slug: "complete-python-beginners-data-science",
      excerpt: "Learn Python from scratch, understand Object-Oriented Programming, and build data analytics projects with Pandas and NumPy.",
      description: `### Your Gateway to Python Programming & Modern Data Science

Python is the most versatile programming language in the world, powering artificial intelligence, web backends, automation, and big data analytics. This beginner-friendly course is tailored for polytechnic diploma students stepping into programming for the very first time.

#### Course Highlights:
- Python 3 syntax: variables, control flow, functions, lambdas, and list comprehensions.
- Object-Oriented Programming (OOP): classes, inheritance, encapsulation, polymorphism.
- File handling, JSON parsing, and CSV processing.
- Numerical computing with **NumPy**: vectorization, multi-dimensional arrays, matrix operations.
- Data wrangling with **Pandas**: DataFrames, filtering, group-by, handling missing values.
- Data visualization with **Matplotlib** and **Seaborn**: bar charts, scatter plots, heatmaps.`,
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.BEGINNER,
      isFree: true,
      price: 0,
      discountPrice: null,
      isPublished: true,
      featured: false,
      tags: ["Python", "Data Science", "Pandas", "NumPy", "Matplotlib", "Beginner"],
      sections: [
        {
          title: "Module 1: Python Fundamentals & Data Structures",
          description: "Core syntax, data types, loops, lists, dictionaries, tuples, and sets.",
          lessons: [
            {
              title: "1.1 Python Installation, VS Code Setup & Core Syntax",
              description: "Setting up Python 3.12, virtual environments, installing packages with pip, variables, and f-strings.",
              duration: "25 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
              documents: [
                { title: "Python Quick Reference Guide.pdf", url: "https://python.org", size: "1.5 MB" },
              ],
              instructors: [{ id: inst1, role: "Instructor" }],
            },
            {
              title: "1.2 Functions, Dictionaries & List Comprehensions",
              description: "Writing reusable functions, arbitrary arguments (*args, **kwargs), dictionary operations, and clean list comprehensions.",
              duration: "30 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
              quiz: {
                title: "Python Data Structures Quiz",
                questions: [
                  {
                    id: "py-q1",
                    question: "Which of the following creates a dictionary in Python?",
                    options: ["x = [1, 2, 3]", "x = {'name': 'Tahmid'}", "x = (1, 2, 3)", "x = {1, 2, 3}"],
                    correctIndex: 1,
                    explanation: "Curly brackets with key-value pairs create a dictionary. Without key-value pairs it creates a set.",
                  },
                ],
              },
              instructors: [{ id: inst1, role: "Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: Object-Oriented Programming (OOP) in Python",
          description: "Classes, dunder methods, inheritance, and clean code principles.",
          lessons: [
            {
              title: "2.1 Classes, Objects & The __init__ Constructor",
              description: "Creating custom classes, instance variables, methods, and the self parameter.",
              duration: "35 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
              instructors: [{ id: inst1, role: "Instructor" }],
            },
            {
              title: "2.2 Inheritance, Polymorphism & Modular Code",
              description: "Subclassing, super() calls, method overriding, and organizing code into modules.",
              duration: "32 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
              instructors: [{ id: inst1, role: "Instructor" }],
            },
          ],
        },
        {
          title: "Module 3: Data Analysis with NumPy & Pandas",
          description: "Reading datasets, performing analytical queries, and plotting meaningful visualizations.",
          lessons: [
            {
              title: "3.1 NumPy Arrays & Fast Vectorized Calculations",
              description: "Array slicing, broadcasting, mathematical operations, and statistical calculations.",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
              instructors: [{ id: inst1, role: "Instructor" }],
            },
            {
              title: "3.2 Real-World Data Wrangling with Pandas & Matplotlib",
              description: "Loading a Kaggle dataset, cleaning missing values, grouping data, and generating charts.",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
              assignment: {
                title: "Exploratory Data Analysis Project",
                description: "Download the provided student dataset, compute top correlations, and generate at least 3 seaborn plots.",
                deadline: "2026-10-28",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Instructor" }],
            },
          ],
        },
      ],
    },
    {
      title: "Modern UI/UX Design with Figma to Code",
      slug: "modern-ui-ux-design-figma-to-code",
      excerpt: "Design beautiful web & mobile interfaces in Figma, master typography, auto-layout, design tokens, and convert designs into code.",
      description: `### Transform Ideas into Stunning, Usable Digital Experiences

A high-converting web product starts with world-class user interface design. This comprehensive workshop takes you inside the design process used by top digital product studios.

#### What you will master:
- **Figma Foundations:** Frames, vector shapes, typography hierarchies, harmonious color palettes.
- **Auto Layout 5.0:** Fluid responsive layouts, flex-like spacing, min/max dimensions.
- **Design Systems & Component Architecture:** Variants, component properties, design tokens.
- **Interactive Prototyping:** Micro-interactions, smart animate, sheet modals, and hover states.
- **Developer Handoff:** Exporting assets, CSS inspection, converting Figma components into React/Tailwind.`,
      thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.BEGINNER,
      isFree: false,
      price: 1500,
      discountPrice: 999,
      isPublished: true,
      featured: true,
      tags: ["Figma", "UI/UX", "Product Design", "Design System", "CSS", "Frontend"],
      sections: [
        {
          title: "Module 1: Figma Essentials & Visual Design Principles",
          description: "Understanding grids, visual balance, contrast ratios, and interface typography.",
          lessons: [
            {
              title: "1.1 Navigating Figma, Canvas Setup & The Golden Rules of UI",
              description: "Tour of Figma tools, setting up 8pt grids, choosing fonts, and defining accessible color contrast.",
              duration: "28 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=FTlczFBlYnw",
              documents: [
                { title: "8-Point Grid System Guide.pdf", url: "https://figma.com", size: "2.4 MB" },
              ],
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
            {
              title: "1.2 Mastering Auto Layout 5.0 & Responsive Frames",
              description: "How auto layout mimics CSS flexbox: padding, gap, fill container vs hug contents, and absolute positioning.",
              duration: "35 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=c_hO_fjimCw",
              assignment: {
                title: "Build a Responsive Hero Section in Figma",
                description: "Design a high-converting SaaS landing page hero section using Auto Layout and submit your Figma link.",
                deadline: "2026-10-25",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
          ],
        },
        {
          title: "Module 2: Design Systems & Component Libraries",
          description: "Creating scalable design tokens, button variants, inputs, and dark mode themes.",
          lessons: [
            {
              title: "2.1 Building Atomic Design Components & Variants",
              description: "Creating buttons with default, hover, active, and disabled states using boolean component properties.",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=FTlczFBlYnw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
            {
              title: "2.2 Smart Animate Micro-interactions & Prototyping",
              description: "Connecting frames, setting easing curves, building realistic animated dropdowns and drawer modals.",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=c_hO_fjimCw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
          ],
        },
        {
          title: "Module 3: From Figma Design to React & Tailwind Code",
          description: "Handoff workflows, extracting SVG assets, and writing pixel-perfect Tailwind CSS code.",
          lessons: [
            {
              title: "3.1 Translating Figma Tokens to Tailwind CSS Config",
              description: "Mapping color palettes, font weights, and spacing scales from your Figma design system to Tailwind CSS.",
              duration: "34 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=FTlczFBlYnw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
            {
              title: "3.2 Coding the Complete Landing Page in React",
              description: "Step-by-step code walkthrough recreating the Figma design in React with semantic HTML and clean styling.",
              duration: "50 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=c_hO_fjimCw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
          ],
        },
      ],
    },
    {
      title: "Mastering Backend Engineering with Node.js, Express & PostgreSQL",
      slug: "mastering-backend-engineering-nodejs-express-postgresql",
      excerpt: "Architect robust REST APIs, implement JWT authentication, manage database transactions, Redis caching, and Dockerize services.",
      description: `### Build Production-Grade Backend Architectures That Scale

Learn how real-world enterprise backends are architected from the ground up. This course focuses on writing clean, maintainable, secure server applications using the Node.js runtime and PostgreSQL.

#### What you will master:
- **Node.js Internals:** Event Loop, Libuv, Streams, Buffers, Worker Threads.
- **Express.js Architecture:** Controller-Service-Repository pattern, middleware chains, error handling.
- **Relational Databases & SQL:** Schema design, normalization, ACID transactions, foreign keys, indexes.
- **Authentication & Security:** JWT tokens, refresh token rotation, bcrypt password hashing, CORS, rate limiting.
- **Performance:** Redis caching, connection pooling, database query optimization.
- **DevOps:** Docker containerization, docker-compose, and automated health checks.`,
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.INTERMEDIATE,
      isFree: false,
      price: 2000,
      discountPrice: 1499,
      isPublished: true,
      featured: true,
      tags: ["Node.js", "Express", "PostgreSQL", "Backend", "Redis", "Docker", "REST API"],
      sections: [
        {
          title: "Module 1: Node.js Core & REST API Architecture",
          description: "Writing structured APIs following the Service-Repository pattern.",
          lessons: [
            {
              title: "1.1 The Node.js Event Loop & Express Project Scaffolding",
              description: "Understanding single-threaded event loop, non-blocking I/O, setting up TypeScript, and folder architecture.",
              duration: "30 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
              documents: [
                { title: "Backend Architecture Guide.pdf", url: "https://nodejs.org", size: "2.8 MB" },
              ],
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "1.2 Error Handling Middleware, Validation & Environment Management",
              description: "Centralized error classes, Zod request body validation, and environment validation with envalid.",
              duration: "35 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: PostgreSQL, Indexing & Authentication",
          description: "Designing schemas, writing parameterized SQL queries, and secure token authentication.",
          lessons: [
            {
              title: "2.1 Database Schema Design, Relations & Foreign Keys",
              description: "One-to-many, many-to-many junction tables, cascade deletes, and B-tree indexes.",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "2.2 JWT Authentication & Refresh Token Rotation",
              description: "Issuing short-lived access tokens, persisting refresh tokens in Redis/PostgreSQL, and logout revocation.",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
        {
          title: "Module 3: Caching, Dockerization & Production Readiness",
          description: "High performance caching with Redis, containerization, and deployment.",
          lessons: [
            {
              title: "3.1 Redis In-Memory Caching & Cache Invalidation",
              description: "Cache-aside pattern, setting TTL, and invalidating cache on write mutations.",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "3.2 Dockerizing Node.js + Postgres with Docker Compose",
              description: "Multi-stage Dockerfile, minimizing image size, setting up health checks and docker-compose.yml.",
              duration: "42 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
              assignment: {
                title: "Dockerized E-Commerce Backend Service",
                description: "Build a multi-container Docker compose service with Express, Postgres, and Redis, and submit your GitHub repo.",
                deadline: "2026-11-05",
                submissionUrl: "https://github.com",
              },
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
      ],
    },
    {
      title: "Mobile App Development with Flutter & Dart",
      slug: "mobile-app-development-flutter-dart",
      excerpt: "Build high-performance, beautiful native iOS and Android apps from a single codebase using Flutter and Dart.",
      description: `### Cross-Platform Native Mobile Development Made Easy

Create silky-smooth 60fps and 120fps native mobile apps for Android and iOS using Google's Flutter framework. This course takes you through widgets, state management, offline database storage, and push notifications.

#### Course Curriculum:
- **Dart Language Primer:** null-safety, async/await, futures, streams, collections.
- **Widget Tree:** StatelessWidget vs StatefulWidget, BuildContext, LayoutBuilder.
- **Styling & UI:** Material 3, Cupertino iOS widgets, custom animations, hero transitions.
- **State Management:** Provider, Riverpod, and Bloc architecture.
- **Networking & Persistence:** Dio HTTP client, SharedPreferences, SQLite/Isar local database.
- **Firebase:** Authentication, Firestore database, Cloud Messaging (FCM) notifications.`,
      thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.INTERMEDIATE,
      isFree: false,
      price: 2500,
      discountPrice: 1799,
      isPublished: true,
      featured: false,
      tags: ["Flutter", "Dart", "Mobile", "Android", "iOS", "Cross-Platform", "Firebase"],
      sections: [
        {
          title: "Module 1: Flutter Fundamentals & Widget Tree",
          description: "Understanding widgets, layouts, stateful vs stateless components.",
          lessons: [
            {
              title: "1.1 Flutter SDK Setup & Your First Material 3 App",
              description: "Android Studio / VS Code configuration, Flutter doctor, running emulator, and scaffold basics.",
              duration: "26 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
            {
              title: "1.2 Layout Mastery: Row, Column, Stack & ListView",
              description: "Building scrollable feeds, responsive grids, constraints, and custom app bars.",
              duration: "34 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
          ],
        },
        {
          title: "Module 2: State Management with Riverpod & API Calls",
          description: "Managing app state cleanly and consuming REST APIs.",
          lessons: [
            {
              title: "2.1 Riverpod State Providers & Notifiers",
              description: "StateProvider, FutureProvider, and refactoring business logic out of the UI widget tree.",
              duration: "44 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
            {
              title: "2.2 Networking with Dio & JSON Deserialization",
              description: "Fetching remote data, handling network exceptions, and parsing models with json_serializable.",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
          ],
        },
        {
          title: "Module 3: Full App Build & Play Store Deployment",
          description: "Building an offline-first notes/task application and signing the release APK/AAB.",
          lessons: [
            {
              title: "3.1 Local Storage with SQLite & SharedPreferences",
              description: "Caching user settings, offline CRUD persistence, and synchronizing when back online.",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
            {
              title: "3.2 App Signing, Icons, Splash Screens & Release AAB",
              description: "Generating release keystore, configuring build.gradle, and preparing for Google Play Console submission.",
              duration: "32 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
              assignment: {
                title: "Submit Your Signed Flutter APK",
                description: "Build the complete mobile app, generate a release APK, and upload your build to Google Drive.",
                deadline: "2026-11-10",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
          ],
        },
      ],
    },
    {
      title: "Git, GitHub & Open Source Collaboration Bootcamp",
      slug: "git-github-open-source-collaboration-bootcamp",
      excerpt: "Master version control, branches, pull requests, merge conflict resolution, and contribute to open-source projects with confidence.",
      description: `### Essential Version Control & Team Collaboration for Every Developer

No developer can work in isolation. Version control with Git is the single most vital skill expected by tech companies and open-source communities. This fast-paced, practical bootcamp demystifies Git commands and GitHub workflows.

#### What you will master:
- **Git Under the Hood:** Commits, snapshots, blobs, trees, commit hashes (SHA).
- **Core Operations:** staging, committing, git diff, git log, git checkout/switch.
- **Branching Strategies:** feature branches, hotfixes, rebasing vs merging.
- **Conflict Resolution:** Safely resolving merge conflicts and cherry-picking commits.
- **GitHub Collaboration:** Forking, Pull Requests (PRs), code reviews, issues, and project boards.
- **Automation:** GitHub Actions for automated linting, test running, and deployments.`,
      thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.BEGINNER,
      isFree: true,
      price: 0,
      discountPrice: null,
      isPublished: true,
      featured: false,
      tags: ["Git", "GitHub", "Version Control", "Open Source", "CI/CD", "DevOps"],
      sections: [
        {
          title: "Module 1: Git Essentials & Everyday Workflow",
          description: "Terminal commands, commit anatomy, and local repo management.",
          lessons: [
            {
              title: "1.1 Introduction to Git, Terminal Setup & First Commit",
              description: "Configuring user.name, user.email, SSH keys for GitHub, git init, add, and commit.",
              duration: "20 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
              documents: [
                { title: "Git Command Cheatsheet.pdf", url: "https://git-scm.com", size: "1.2 MB" },
              ],
              instructors: [{ id: inst2, role: "Instructor" }],
            },
            {
              title: "1.2 Branching, Merging & Solving Conflicts",
              description: "Creating feature branches, merging with fast-forward vs three-way merge, and solving merge conflicts in VS Code.",
              duration: "28 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=apGV9Kg7ics",
              instructors: [{ id: inst2, role: "Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: GitHub, Pull Requests & Open Source",
          description: "Forking repositories, submitting clean PRs, and reviewing code.",
          lessons: [
            {
              title: "2.1 The Open Source Workflow: Fork, Clone, Branch & PR",
              description: "How to find beginner-friendly open-source issues (good-first-issue), write descriptive pull requests, and respond to review comments.",
              duration: "30 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
              instructors: [{ id: inst2, role: "Instructor" }],
            },
            {
              title: "2.2 Continuous Integration with GitHub Actions",
              description: "Writing YAML workflow files to test and lint code on every pull request automatically.",
              duration: "25 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=apGV9Kg7ics",
              assignment: {
                title: "Contribute to DPI Computing Society Open Source Repo",
                description: "Fork the DPI CS community repo, add your profile card, and submit a verified Pull Request.",
                deadline: "2026-10-31",
                submissionUrl: "https://github.com",
              },
              instructors: [{ id: inst2, role: "Instructor" }],
            },
          ],
        },
      ],
    },
    {
      title: "Linux System Administration & DevOps Essentials",
      slug: "linux-system-administration-devops-essentials",
      excerpt: "Learn Linux server management, Bash scripting, Nginx configuration, SSL certificates, Docker containers, and server security.",
      description: `### Master the Operating System That Powers the Modern Internet

Over 90% of the world's cloud servers run on Linux. As a polytechnic computer engineer, mastering the Linux terminal and system administration is your biggest competitive advantage in DevOps and cloud roles.

#### What you will master:
- **Linux Architecture:** Kernel, shell, filesystem hierarchy (FHS), permissions (chmod, chown).
- **Bash Scripting:** Variables, loops, cron jobs for automated system maintenance.
- **Networking & Services:** systemd, journalctl, netstat, ufw firewall, SSH hardening.
- **Web Servers:** Installing and configuring Nginx as a reverse proxy with load balancing.
- **SSL / TLS:** Free HTTPS setup with Let's Encrypt and Certbot auto-renewal.
- **Containerization:** Running containerized workloads with Docker.`,
      thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.INTERMEDIATE,
      isFree: false,
      price: 1800,
      discountPrice: 1200,
      isPublished: true,
      featured: false,
      tags: ["Linux", "DevOps", "Ubuntu", "Bash", "Nginx", "Docker", "SysAdmin"],
      sections: [
        {
          title: "Module 1: The Linux Terminal & System Navigation",
          description: "Navigating filesystems, managing user accounts, and file permissions.",
          lessons: [
            {
              title: "1.1 Terminal Essentials, File Manipulation & Navigation",
              description: "Mastering ls, cd, cp, mv, rm, cat, grep, find, and understanding the Filesystem Hierarchy Standard.",
              duration: "27 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=sWbUDq4S6Y8",
              documents: [
                { title: "Linux SysAdmin Cheatsheet.pdf", url: "https://ubuntu.com", size: "2.0 MB" },
              ],
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
            {
              title: "1.2 Users, Groups, Sudo & File Permissions (chmod, chown)",
              description: "Understanding read/write/execute binary permissions (755, 644), chown, useradd, and securing sudo privileges.",
              duration: "32 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=2a_A20WffoQ",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
          ],
        },
        {
          title: "Module 2: Bash Automation & Process Management",
          description: "Automating repetitive admin tasks with bash scripts and systemd services.",
          lessons: [
            {
              title: "2.1 Writing Bash Scripts & Automating Backups with Cron",
              description: "Conditionals, loops, script arguments, crontab syntax, and automated database backups.",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=sWbUDq4S6Y8",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
            {
              title: "2.2 Process Monitoring & Systemd Service Management",
              description: "Managing background daemons with systemctl, reading logs with journalctl, and monitoring with htop.",
              duration: "35 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=2a_A20WffoQ",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
          ],
        },
        {
          title: "Module 3: Nginx Web Server, SSL & Cloud Deployment",
          description: "Deploying web applications behind Nginx with Let's Encrypt SSL.",
          lessons: [
            {
              title: "3.1 Configuring Nginx as Reverse Proxy & Load Balancer",
              description: "Writing server blocks, proxy_pass to Node.js/Python ports, and configuring gzip compression.",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=sWbUDq4S6Y8",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
            {
              title: "3.2 Securing Cloud VPS: SSH Keys, UFW Firewall & SSL",
              description: "Disabling password login, setting up SSH keys, configuring UFW firewall ports, and running certbot.",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=2a_A20WffoQ",
              assignment: {
                title: "Configure & Secure a Cloud Linux Server",
                description: "Set up a virtual machine, configure Nginx with custom domain and HTTPS, and submit your public IP.",
                deadline: "2026-11-15",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
          ],
        },
      ],
    },
    {
      title: "Cybersecurity Fundamentals & Ethical Hacking 101",
      slug: "cybersecurity-fundamentals-ethical-hacking-101",
      excerpt: "Explore networking fundamentals, vulnerability assessment, OWASP Top 10 web vulnerabilities, Burp Suite, and defensive security.",
      description: `### Defend Systems and Understand the Hacker Mindset

Cybersecurity is one of the highest-demand careers in information technology. In this course, you will learn hands-on ethical hacking fundamentals, explore common web application attack vectors, and discover how to write secure code that prevents breaches.

#### Core Modules:
- **Networking Foundations:** TCP/IP, OSI Model, DNS, HTTP/HTTPS, packet analysis with Wireshark.
- **Reconnaissance & Footprinting:** Nmap port scanning, OSINT tools, subdomain enumeration.
- **Web Application Vulnerabilities (OWASP Top 10):**
  - SQL Injection (SQLi)
  - Cross-Site Scripting (XSS)
  - Cross-Site Request Forgery (CSRF)
  - Broken Access Control (IDOR)
- **Ethical Hacking Tools:** Burp Suite Community, Kali Linux, Metasploit basics.
- **Defensive Strategies:** Principle of Least Privilege, input sanitization, CSP headers.`,
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.INTERMEDIATE,
      isFree: false,
      price: 3000,
      discountPrice: 1999,
      isPublished: true,
      featured: true,
      tags: ["Cybersecurity", "Ethical Hacking", "OWASP", "Networking", "Burp Suite", "Security"],
      sections: [
        {
          title: "Module 1: Networking Foundations & Packet Sniffing",
          description: "Understanding network protocols, ports, and capturing traffic.",
          lessons: [
            {
              title: "1.1 The OSI Model, TCP/IP & Wireshark Packet Analysis",
              description: "Understanding 3-way handshakes, analyzing unencrypted HTTP vs TLS encrypted traffic in Wireshark.",
              duration: "30 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=inWWhr5tnEA",
              documents: [
                { title: "Networking & Port Cheat Sheet.pdf", url: "https://wireshark.org", size: "2.1 MB" },
              ],
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
            {
              title: "1.2 Port Scanning & Reconnaissance with Nmap",
              description: "SYN scans (-sS), service version detection (-sV), operating system fingerprinting (-O), and vulnerability scripts.",
              duration: "35 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: Web Application Security & OWASP Top 10",
          description: "Finding and remediating critical web vulnerabilities.",
          lessons: [
            {
              title: "2.1 Intercepting HTTP Traffic with Burp Suite",
              description: "Setting up browser proxy, manipulating requests with Repeater, and fuzzing with Intruder.",
              duration: "42 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=inWWhr5tnEA",
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
            {
              title: "2.2 SQL Injection (SQLi) & Cross-Site Scripting (XSS)",
              description: "In-band SQLi, stored vs reflected XSS payloads, and secure coding defenses using parameterized queries.",
              duration: "48 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              quiz: {
                title: "OWASP Vulnerability Check",
                questions: [
                  {
                    id: "sec-q1",
                    question: "What is the most effective primary defense against SQL Injection?",
                    options: [
                      "Blacklisting single quotes",
                      "Parameterized queries (Prepared Statements)",
                      "Encoding all user input with Base64",
                      "Hiding the database error messages",
                    ],
                    correctIndex: 1,
                    explanation: "Parameterized queries ensure user input is treated as literal data, never executed as SQL command code.",
                  },
                ],
              },
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
          ],
        },
        {
          title: "Module 3: Defensive Hardening & Secure System Design",
          description: "Implementing defense-in-depth security best practices.",
          lessons: [
            {
              title: "3.1 Authentication Security, Password Hashing & 2FA",
              description: "Why MD5/SHA1 are broken, proper Argon2/bcrypt salting, and implementing Time-based One-Time Passwords (TOTP).",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=inWWhr5tnEA",
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
            {
              title: "3.2 Web Security Headers: CSP, HSTS & CORS Best Practices",
              description: "Preventing clickjacking with X-Frame-Options, restricting resource loading with Content-Security-Policy, and CORS misconfiguration pitfalls.",
              duration: "32 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              assignment: {
                title: "Complete OWASP Juice Shop Lab Challenges",
                description: "Solve 3 vulnerability challenges on the OWASP Juice Shop vulnerable web app and submit your walkthrough report.",
                deadline: "2026-11-20",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
          ],
        },
      ],
    },
    {
      title: "Artificial Intelligence & Machine Learning Crash Course",
      slug: "artificial-intelligence-machine-learning-crash-course",
      excerpt: "Step into the world of AI: understand supervised and unsupervised machine learning, train models with Scikit-Learn, and build neural networks.",
      description: `### Demystifying AI, Deep Learning, and Predictive Models

Artificial Intelligence is reshaping every industry on the planet. This accessible, math-intuitive course bridges the gap between software engineering and machine learning, guiding you step-by-step through real ML pipelines.

#### What you will master:
- **Machine Learning Concepts:** Training sets, validation, testing, overfitting, underfitting, bias-variance tradeoff.
- **Supervised Learning:** Linear Regression, Logistic Regression, Decision Trees, Random Forests.
- **Unsupervised Learning:** K-Means Clustering, Principal Component Analysis (PCA).
- **Model Evaluation:** Confusion Matrix, Precision, Recall, F1-Score, ROC-AUC.
- **Deep Learning Intro:** Perceptrons, activation functions (ReLU, Sigmoid), backpropagation with PyTorch.
- **Computer Vision & NLP:** Convolutional neural networks (CNN) overview, word embeddings, transformer intuition.`,
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
      level: CourseLevel.ADVANCED,
      isFree: false,
      price: 3500,
      discountPrice: 2499,
      isPublished: true,
      featured: true,
      tags: ["AI", "Machine Learning", "Python", "Scikit-Learn", "Deep Learning", "PyTorch"],
      sections: [
        {
          title: "Module 1: Machine Learning Foundations & Linear Models",
          description: "Understanding data preprocessing, training workflows, and linear algorithms.",
          lessons: [
            {
              title: "1.1 The Machine Learning Workflow & Feature Engineering",
              description: "Train/test split, feature scaling (StandardScaler, MinMaxScaler), handling categorical variables with One-Hot Encoding.",
              duration: "34 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=JMUxmLyrhSk",
              documents: [
                { title: "Machine Learning Roadmap.pdf", url: "https://scikit-learn.org", size: "2.5 MB" },
              ],
              instructors: [
                { id: inst1, role: "Lead AI Researcher" },
                ...(inst2 && inst2 !== inst1 ? [{ id: inst2, role: "Lab Assistant" }] : []),
              ],
            },
            {
              title: "1.2 Linear & Logistic Regression with Scikit-Learn",
              description: "Fitting continuous lines, predicting probabilities, cost functions (Mean Squared Error, Log Loss), and gradient descent.",
              duration: "40 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
          ],
        },
        {
          title: "Module 2: Decision Trees, Ensemble Methods & Evaluation",
          description: "Building powerful non-linear tree models and properly scoring metrics.",
          lessons: [
            {
              title: "2.1 Decision Trees & Random Forest Classifiers",
              description: "Information gain, Gini impurity, bagging, feature importance, and tuning hyperparameters.",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=JMUxmLyrhSk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
            {
              title: "2.2 Evaluation Metrics: Beyond Simple Accuracy",
              description: "Why 99% accuracy can be misleading in imbalanced datasets, calculating Precision, Recall, and ROC-AUC curves.",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
          ],
        },
        {
          title: "Module 3: Neural Networks & Deep Learning with PyTorch",
          description: "Constructing artificial neural networks and understanding modern deep learning.",
          lessons: [
            {
              title: "3.1 Neural Network Architecture & Backpropagation",
              description: "Layers, weights, biases, non-linear activation functions (ReLU), and how gradients propagate backwards.",
              duration: "52 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
            {
              title: "3.2 Training an Image Classifier with PyTorch",
              description: "Writing training loops, calculating loss with cross-entropy, updating weights with Adam optimizer on GPU/CPU.",
              duration: "48 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=JMUxmLyrhSk",
              assignment: {
                title: "Train a Customer Churn Prediction Model",
                description: "Train a classification model using Scikit-Learn or PyTorch, evaluate with F1-score, and submit a Jupyter notebook.",
                deadline: "2026-11-25",
                submissionUrl: "https://forms.google.com",
              },
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
          ],
        },
      ],
    },
  ]

  let count = 0
  for (const cData of coursesData) {
    console.log(`⏳ Seeding: ${cData.title}...`)

    // Upsert course
    const course = await prisma.course.upsert({
      where: { slug: cData.slug },
      update: {
        title: cData.title,
        excerpt: cData.excerpt,
        description: cData.description,
        thumbnail: cData.thumbnail,
        level: cData.level,
        isFree: cData.isFree,
        price: cData.price,
        discountPrice: cData.discountPrice,
        isPublished: cData.isPublished,
        featured: cData.featured,
        tags: cData.tags,
      },
      create: {
        title: cData.title,
        slug: cData.slug,
        excerpt: cData.excerpt,
        description: cData.description,
        thumbnail: cData.thumbnail,
        level: cData.level,
        isFree: cData.isFree,
        price: cData.price,
        discountPrice: cData.discountPrice,
        isPublished: cData.isPublished,
        featured: cData.featured,
        tags: cData.tags,
      },
    })

    // Delete existing sections for clean refresh if course existed
    await prisma.courseSection.deleteMany({
      where: { courseId: course.id },
    })

    // Insert sections and lessons
    for (let sIdx = 0; sIdx < cData.sections.length; sIdx++) {
      const s = cData.sections[sIdx]
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: s.title,
          description: s.description,
          orderIndex: sIdx,
        },
      })

      for (let lIdx = 0; lIdx < s.lessons.length; lIdx++) {
        const l: any = s.lessons[lIdx]
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: l.title,
            description: l.description,
            orderIndex: lIdx,
            isPreview: l.isPreview,
            videoUrl: l.videoUrl,
            videoDuration: l.duration,
            documents: (l.documents as any) ?? null,
            quiz: (l.quiz as any) ?? null,
            assignment: (l.assignment as any) ?? null,
            resources: (l.resources as any) ?? null,
            externalLinks: (l.externalLinks as any) ?? null,
            liveClass: (l.liveClass as any) ?? null,
          },
        })

        // Add instructors if provided
        if (l.instructors && l.instructors.length > 0) {
          for (const inst of l.instructors) {
            if (inst.id) {
              await prisma.lessonInstructor.create({
                data: {
                  lessonId: lesson.id,
                  instructorId: inst.id,
                  role: inst.role,
                },
              })
            }
          }
        }
      }
    }

    count++
    console.log(`✅ [${count}/10] Seeded: ${cData.title}`)
  }

  console.log(`\n🎉 Successfully seeded all 10 full size courses!`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
