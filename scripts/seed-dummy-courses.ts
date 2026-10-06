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
    await prisma.user.update({
      where: { id: unlinkedInstructorUser.id },
      data: {
        bio: "Senior Software Engineer and Mentor at DPI Computing Society.",
        skills: ["Full-Stack Development", "Architecture", "System Design"],
      },
    })
    const newInst = await prisma.instructor.create({
      data: {
        userId: unlinkedInstructorUser.id,
        instructorId: "INST-" + Math.floor(1000 + Math.random() * 9000),
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
      await prisma.user.update({
        where: { id: anotherUser.id },
        data: {
          bio: "Competitive Programmer, Algorithms Specialist & Lab Mentor.",
          skills: ["C++", "Data Structures", "Algorithms", "Problem Solving"],
        },
      })
      const createdInst = await prisma.instructor.create({
        data: {
          userId: anotherUser.id,
          instructorId: "INST-" + Math.floor(1000 + Math.random() * 9000),
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

  // 10 Full Size Dummy Courses Data with Dual English and Bangla Support
  const coursesData = [
    {
      title: "Full-Stack Next.js 15 & React 19 Mastery",
      titleBn: "ফুল-স্ট্যাক নেক্সট.জেএস ১৫ ও রিয়েক্ট ১৯ মাস্টারি",
      slug: "full-stack-nextjs-15-react-19-mastery",
      excerpt: "Master modern web development with Next.js 15 App Router, React 19 Server Components, Prisma ORM, and Tailwind CSS.",
      excerptBn: "নেক্সট.জেএস ১৫ অ্যাপ রাউটার, রিয়েক্ট ১৯ সার্ভার কম্পোনেন্টস, প্রিজমা ওআরএম এবং টেইলউইন্ড সিএসএস দিয়ে আধুনিক ওয়েব ডেভেলপমেন্ট শিখুন।",
      description: `### Become a Modern Full-Stack Engineer with Next.js 15

Welcome to the definitive hands-on course designed specifically for polytechnic engineers and modern web developers. In this comprehensive course, you'll go from basic JavaScript/React understanding to building production-ready, highly scalable full-stack applications.

#### What you will learn:
- **Next.js 15 App Router:** Server vs Client Components, Nested Layouts, Streaming with Suspense.
- **Server Actions & Mutations:** Direct database operations with zero boilerplate API routes.
- **Database Architecture:** PostgreSQL with Prisma ORM 7, migrations, relations, and indexing.
- **Authentication & Security:** Better-Auth, session management, RBAC (Role-Based Access Control).
- **Styling & UI:** Tailwind CSS v4, dynamic dark mode, micro-interactions, responsive layouts.
- **Deployment & Production:** Vercel, Neon DB, environment secrets, and Lighthouse performance optimization.`,
      descriptionBn: `### নেক্সট.জেএস ১৫ দিয়ে হয়ে উঠুন একজন দক্ষ ফুল-স্ট্যাক ইঞ্জিনিয়ার

ডিপিআই কম্পিউটিং সোসাইটির পক্ষ থেকে পলিটেকনিক শিক্ষার্থী ও আধুনিক ওয়েব ডেভেলপারদের জন্য প্রস্তুতকৃত একটি স্বয়ংসম্পূর্ণ কোর্স। এই কোর্সে রিয়েক্টের প্রাথমিক ধারণা থেকে শুরু করে বাস্তব জীবনের প্রডাকশন-রেডি, স্কেলেবল ওয়েব অ্যাপ্লিকেশন তৈরি শেখানো হবে।

#### এই কোর্সে যা যা শিখবেন:
- **Next.js 15 App Router:** সার্ভার বনাম ক্লায়েন্ট কম্পোনেন্টস, নেস্টেড লেআউট, সাসপেন্স ও স্ট্রিমিং।
- **Server Actions & Mutations:** অতিরিক্ত API রুট তৈরি ছাড়াই সরাসরি সার্ভার থেকে ডেটাবেজ মিউটেশন।
- **ডেটাবেজ আর্কিটেকচার:** PostgreSQL ডেটাবেজ, Prisma ORM 7, মাইগ্রেশন, রিলেশন ও ইনডেক্সিং।
- **অথেনটিকেশন ও সিকিউরিটি:** Better-Auth, সেশন ম্যানেজমেন্ট ও রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC)।
- **স্টাইলিং ও ইউআই:** Tailwind CSS v4, ডার্ক মোড, আধুনিক মাইক্রো-অ্যানিমেশন এবং রেসপনসিভ লেআউট।
- **প্রডাকশন ও ডেপ্লয়মেন্ট:** Vercel এবং Neon DB ডেটাবেজে লাইভ ডিপ্লয়মেন্ট ও পারফরম্যান্স অপ্টিমাইজেশন।`,
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
          titleBn: "মডিউল ১: নেক্সট.জেএস ১৫ অ্যাপ রাউটারের মূল ভিত্তি",
          description: "Understanding React 19 features, Server Components vs Client Components, and routing conventions.",
          descriptionBn: "রিয়েক্ট ১৯ এর নতুন ফিচার, সার্ভার বনাম ক্লায়েন্ট কম্পোনেন্ট এবং রাউটিং কনভেনশন।",
          lessons: [
            {
              title: "1.1 Introduction to Next.js 15 & The App Router Paradigm",
              titleBn: "১.১ নেক্সট.জেএস ১৫ পরিচিতি ও অ্যাপ রাউটার আর্কিটেকচার",
              description: "Deep dive into why Next.js 15 is revolutionizing full-stack React development. Comparing Pages router with App router.",
              descriptionBn: "কেন নেক্সট.জেএস ১৫ আধুনিক ফুল-স্ট্যাক রিয়েক্ট ডেভেলপমেন্টে পরিবর্তন আনছে। পেজ রাউটার বনাম অ্যাপ রাউটার তুলনা।",
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
              titleBn: "১.২ লেআউট, নেস্টেড রাউটিং ও সাসপেন্স লোডিং স্টেট",
              description: "Constructing persistent navigation, root layouts, nested folder structures, and streaming UI with loading.tsx.",
              descriptionBn: "পারসিস্টেন্ট ন্যাভিগেশন, রুট লেআউট, নেস্টেড ফোল্ডার কাঠামো এবং loading.tsx দিয়ে ইউআই স্ট্রিমিং।",
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
          titleBn: "মডিউল ২: সার্ভার অ্যাকশন ও প্রিজমা ডেটাবেজ ইন্টিগ্রেশন",
          description: "Connecting Neon PostgreSQL, modeling database schema with Prisma, and performing typesafe CRUD mutations.",
          descriptionBn: "নিওন পোস্টগ্রেসকিউএল কানেকশন, প্রিজমা দিয়ে স্কিমা ডিজাইন এবং টাইপসেফ সিআরইউডি অপারেশন।",
          lessons: [
            {
              title: "2.1 Setting up Prisma ORM & PostgreSQL Schema",
              titleBn: "২.১ প্রিজমা ওআরএম ও পোস্টগ্রেসকিউএল স্কিমা সেটআপ",
              description: "Defining models, relationships, running migrations, and seeding dummy data with Prisma Studio.",
              descriptionBn: "মডেল ও রিলেশনশিপ ডিফাইন করা, মাইগ্রেশন চালানো এবং প্রিজমা স্টুডিও দিয়ে ডেটা সিড করা।",
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
              titleBn: "২.২ ফর্ম হ্যান্ডলিং ও অপটিমিস্টিক ইউআইয়ের জন্য সার্ভার অ্যাকশন",
              description: "Handling form submissions safely on the server, revalidating cache paths with revalidatePath, and handling optimistic UI.",
              descriptionBn: "সার্ভারে নিরাপদভাবে ফর্ম সাবমিশন, revalidatePath দিয়ে ক্যাশ রিভ্যালিডেশন এবং অপটিমিস্টিক ইউআই।",
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
          titleBn: "মডিউল ৩: ক্যাপস্টোন প্রজেক্ট ও প্রডাকশন ডেপ্লয়মেন্ট",
          description: "Building an end-to-end production web app and deploying to Vercel with automated CI/CD.",
          descriptionBn: "সম্পূর্ণ একটি ফুল-স্ট্যাক প্রজেক্ট তৈরি ও সিআই/সিডি সহ ভার্সেলে ডেপ্লয়মেন্ট।",
          lessons: [
            {
              title: "3.1 Authentication & Role-Based Access Control",
              titleBn: "৩.১ অথেনটিকেশন ও রোল-বেসড অ্যাক্সেস কন্ট্রোল",
              description: "Implementing secure login, signup, session tokens, and admin-only protected route handlers.",
              descriptionBn: "নিরাপদ লগইন, সাইনআপ, সেশন টোকেন এবং সুরক্ষিত অ্যাডমিন রুট তৈরি।",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8jj1Azv4tV8",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "3.2 Performance Auditing & Vercel Production Deployment",
              titleBn: "৩.২ পারফরম্যান্স অডিট ও ভার্সেল প্রডাকশন ডেপ্লয়মেন্ট",
              description: "Fixing Largest Contentful Paint (LCP), optimizing images, configuring environment variables, and going live.",
              descriptionBn: "এলসিপি অপ্টিমাইজেশন, ইমেজ অপ্টিমাইজেশন, এনভায়রনমেন্ট ভেরিয়েবল সেটআপ ও লাইভ ডেপ্লয়মেন্ট।",
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
      titleBn: "কম্পিটিটিভ প্রোগ্রামিং ও ডেটা স্ট্রাকচার (সি++)",
      slug: "competitive-programming-data-structures-c-plus-plus",
      excerpt: "Crack ICPC, NCPC, and coding interviews with in-depth algorithms, graphs, dynamic programming, and data structures in C++20.",
      excerptBn: "আইসিপিসি, এনসিপিসি ও টেকনিক্যাল ইন্টারভিউ ক্র্যাক করতে সি++২০ দিয়ে ডেটা স্ট্রাকচার, গ্রাফ ও ডায়নামিক প্রোগ্রামিং শিখুন।",
      description: `### Conquer Contest Programming & Algorithmic Problem Solving

Dhaka Polytechnic Institute Computing Society brings you an intensive, battle-tested competitive programming curriculum. Whether preparing for intra-polytechnic programming contests, NCPC, or tech company technical rounds, this course takes you from fundamental C++ syntax to advanced graph theory and dynamic programming.

#### What you will master:
- **C++ Standard Template Library (STL):** vectors, pairs, sets, maps, priority queues, and iterators.
- **Time & Space Complexity:** Big-O notation, amortized analysis, constraints math.
- **Core Algorithms:** Binary search, two pointers, prefix sums, number theory (sieve, GCD, modular arithmetic).
- **Advanced Data Structures:** Disjoint Set Union (DSU), Segment Trees, Fenwick Trees (BIT).
- **Graph Algorithms:** BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Topological Sort.
- **Dynamic Programming (DP):** 0/1 Knapsack, Coin Change, LCS, LIS, Grid DP.`,
      descriptionBn: `### কনটেস্ট প্রোগ্রামিং ও অ্যালগরিদমিক প্রবলেম সলভিংয়ে দক্ষতা অর্জন করুন

ঢাকা পলিটেকনিক ইনস্টিটিউট কম্পিউটিং সোসাইটির বিশেষ কনটেস্ট প্রোগ্রামিং কারিকুলাম। আপনি যদি জাতীয় প্রোগ্রামিং প্রতিযোগিতা, আইসিপিসি অথবা আন্তর্জাতিক সফটওয়্যার ইঞ্জিনিয়ারিং ইন্টারভিউয়ের জন্য প্রস্তুতি নিতে চান, তবে এই কোর্সটি আপনার জন্য।

#### যা যা শিখবেন:
- **C++ Standard Template Library (STL):** ভেক্টর, পেয়ার, সেট, ম্যাপ, প্রায়োরিটি কিউ ও আইটারেটর।
- **টাইম ও স্পেস কমপ্লেক্সিটি:** বিগ-ও নোটেশন, কনস্ট্রেইন্ট বিশ্লেষণ ও অপটিমাইজেশন।
- **মূল অ্যালগরিদম:** বাইনারি সার্চ, টু পয়েন্টার, প্রিফিক্স সাম ও নাম্বার থিওরি।
- **অ্যাডভান্সড ডেটা স্ট্রাকচার:** ডিসজয়েন্ট সেট ইউনিয়ন (DSU), সেগমেন্ট ট্রি ও ফেনউইক ট্রি।
- **গ্রাফ অ্যালগরিদম:** বিএফএস, ডিএফএস, ডায়েক্সট্রা, বেলম্যান-ফোর্ড ও টপোলজিক্যাল সর্ট।
- **ডায়নামিক প্রোগ্রামিং (DP):** ন্যাপস্যাক, কয়েন চেঞ্জ, এলসিএস ও গ্রিড ডিপি।`,
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
          titleBn: "মডিউল ১: সি++ এসটিএল ও অ্যালগরিদমিক ভিত্তি",
          description: "Writing efficient C++, using fast I/O, and mastering STL containers.",
          descriptionBn: "দ্রুত কোড লেখা, ফাস্ট আই/ও এবং এসটিএল কন্টেইনার আয়ত্ত করা।",
          lessons: [
            {
              title: "1.1 Fast I/O, Time Complexity Analysis & C++ STL Vectors",
              titleBn: "১.১ ফাস্ট আই/ও, টাইম কমপ্লেক্সিটি ও সি++ এসটিএল ভেক্টর",
              description: "Understanding milliseconds vs operations limit (10^8 operations per second in C++), ios_base::sync_with_stdio(false), and vectors.",
              descriptionBn: "মিলিসেকেন্ড হিসাব, অপারেশন লিমিট এবং ভেক্টরের বাস্তব ব্যবহার।",
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
              titleBn: "১.২ বাইনারি সার্চ ও টু পয়েন্টার টেকনিক",
              description: "Binary search on answers, lower_bound, upper_bound, and solving classic Codeforces 1200-1400 problems.",
              descriptionBn: "অ্যানসারের ওপর বাইনারি সার্চ, lower_bound, upper_bound ও কোডফোর্সেস সমস্যা সমাধান।",
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
          titleBn: "মডিউল ২: গ্রাফ থিওরি ও ট্রি অ্যালগরিদম",
          description: "Representing graphs with adjacency lists, traversing with BFS/DFS, and finding shortest paths.",
          descriptionBn: "অ্যাডজাসেন্সি লিস্ট দিয়ে গ্রাফ রিপ্রেজেন্টেশন, বিএফএস/ডিএফএস ও শর্টেস্ট পাথ।",
          lessons: [
            {
              title: "2.1 Graph Representation, BFS, DFS & Connected Components",
              titleBn: "২.১ গ্রাফ রিপ্রেজেন্টেশন, বিএফএস, ডিএফএস ও কানেক্টেড কম্পোনেন্টস",
              description: "Understanding undirected, directed, weighted graphs, cycle detection, and flood fill algorithms.",
              descriptionBn: "ডিরেক্টেড ও আনডিরেক্টেড গ্রাফ, সাইকেল ডিটেকশন ও ফ্লাড ফিল অ্যালগরিদম।",
              duration: "48 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
            {
              title: "2.2 Dijkstra's Algorithm for Shortest Paths",
              titleBn: "২.২ ডায়েক্সট্রা অ্যালগরিদম ও শর্টেস্ট পাথ",
              description: "Using priority_queue to implement Dijkstra in O((V + E) log V). Handling negative weight warnings.",
              descriptionBn: "প্রায়োরিটি কিউ ব্যবহার করে O((V + E) log V) কমপ্লেক্সিটিতে ডায়েক্সট্রা বাস্তবায়ন।",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
          ],
        },
        {
          title: "Module 3: Dynamic Programming (DP) Mastery",
          titleBn: "মডিউল ৩: ডায়নামিক প্রোগ্রামিং (ডিপি) মাস্টারি",
          description: "Transitioning from recursion to memoization and bottom-up DP tables.",
          descriptionBn: "রিকার্শন থেকে মেমোইজেশন ও বটম-আপ ডিপি টেবিল গঠন।",
          lessons: [
            {
              title: "3.1 Recursion to Memoization & The 0/1 Knapsack Problem",
              titleBn: "৩.১ রিকার্শন থেকে মেমোইজেশন ও ০/১ ন্যাপস্যাক সমস্যা",
              description: "Formulating states, transitions, base cases, and avoiding TLE using memoization arrays.",
              descriptionBn: "স্টেট ও ট্রানজিশন নির্ধারণ, বেস কেস ও মেমোইজেশন দিয়ে TLE প্রতিরোধ।",
              duration: "55 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
              instructors: [{ id: inst2, role: "Lead Coach" }],
            },
            {
              title: "3.2 Longest Common Subsequence (LCS) & Path Printing",
              titleBn: "৩.২ লংগেস্ট কমন সাবসিকোয়েন্স (LCS) ও পাথ প্রিন্টিং",
              description: "Standard string DP pattern, table reconstruction, and space-optimized DP solutions.",
              descriptionBn: "স্ট্যান্ডার্ড স্ট্রিং ডিপি প্যাটার্ন, টেবিল রিকনস্ট্রাকশন ও স্পেস অপ্টিমাইজেশন।",
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
      titleBn: "কমপ্লিট পাইথন: জিরো থেকে ডেটা সায়েন্স",
      slug: "complete-python-beginners-data-science",
      excerpt: "Learn Python from scratch, understand Object-Oriented Programming, and build data analytics projects with Pandas and NumPy.",
      excerptBn: "পাইথন প্রোগ্রামিংয়ের শুরু থেকে অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং ও প্যান্ডাস-নামপাই দিয়ে বাস্তব ডেটা অ্যানালাইটিক্স প্রজেক্ট।",
      description: `### Your Gateway to Python Programming & Modern Data Science

Python is the most versatile programming language in the world, powering artificial intelligence, web backends, automation, and big data analytics. This beginner-friendly course is tailored for polytechnic diploma students stepping into programming for the very first time.

#### Course Highlights:
- Python 3 syntax: variables, control flow, functions, lambdas, and list comprehensions.
- Object-Oriented Programming (OOP): classes, inheritance, encapsulation, polymorphism.
- File handling, JSON parsing, and CSV processing.
- Numerical computing with **NumPy**: vectorization, multi-dimensional arrays, matrix operations.
- Data wrangling with **Pandas**: DataFrames, filtering, group-by, handling missing values.
- Data visualization with **Matplotlib** and **Seaborn**: bar charts, scatter plots, heatmaps.`,
      descriptionBn: `### পাইথন প্রোগ্রামিং ও আধুনিক ডেটা সায়েন্সের জগতে প্রবেশ করুন

পাইথন বর্তমান বিশ্বের সবচেয়ে জনপ্রিয় ও বহুমুখী প্রোগ্রামিং ল্যাঙ্গুয়েজ। কৃত্রিম বুদ্ধিমত্তা, ওয়েব ব্যাকএন্ড, ডেটা সায়েন্স ও অটোমেশনের প্রাণকেন্দ্র এই পাইথন। পলিটেকনিক শিক্ষার্থীদের জন্য শূন্য থেকে শুরু করে প্রজেক্ট-ভিত্তিক ধাপে ধাপে সাজানো হয়েছে এই কোর্স।

#### কোর্সের মূল হাইলাইটস:
- পাইথন ৩ বেসিক: ভেরিয়েবল, লুপ, ফাংশন, ল্যাম্বডা ও লিস্ট কম্প্রিহেনশন।
- অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং (OOP): ক্লাস, অবজেক্ট, ইনহেরিটেন্স ও পলিমরফিজম।
- ফাইল হ্যান্ডলিং, সিএসভি ও জেএসন প্রসেসিং।
- **NumPy:** বহুমাত্রিক অ্যারে অপারেশন ও ভেক্টরাইজড ক্যালকুলেশন।
- **Pandas:** ডেটাফ্রেম, ফিল্টারিং, গ্রুপ-বাই ও মিসিং ডেটা হ্যান্ডলিং।
- **Matplotlib & Seaborn:** ডেটা ভিজুয়ালাইজেশন, চার্ট ও হিটম্যাপ তৈরি।`,
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
          titleBn: "মডিউল ১: পাইথন ফান্ডামেন্টালস ও ডেটা স্ট্রাকচার",
          description: "Core syntax, data types, loops, lists, dictionaries, tuples, and sets.",
          descriptionBn: "মূল সিনট্যাক্স, ডেটা টাইপ, লুপ, লিস্ট, ডিকশনারি ও সেট।",
          lessons: [
            {
              title: "1.1 Python Installation, VS Code Setup & Core Syntax",
              titleBn: "১.১ পাইথন ইনস্টলেশন, ভিএস কোড সেটআপ ও সিনট্যাক্স",
              description: "Setting up Python 3.12, virtual environments, installing packages with pip, variables, and f-strings.",
              descriptionBn: "পাইথন ৩.১২ সেটআপ, ভার্চুয়াল এনভায়রনমেন্ট, পিপ প্যাকেজ এবং এফ-স্ট্রিং।",
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
              titleBn: "১.২ ফাংশন, ডিকশনারি ও লিস্ট কম্প্রিহেনশন",
              description: "Writing reusable functions, arbitrary arguments (*args, **kwargs), dictionary operations, and clean list comprehensions.",
              descriptionBn: "পুনর্ব্যবহারযোগ্য ফাংশন, আর্গুমেন্টস (*args, **kwargs) ও লিস্ট কম্প্রিহেনশন।",
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
          titleBn: "মডিউল ২: অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং (ওওপি)",
          description: "Classes, dunder methods, inheritance, and clean code principles.",
          descriptionBn: "ক্লাস, অবজেক্ট, কনস্ট্রাক্টর ও ক্লিন কোড প্রিন্সিপাল।",
          lessons: [
            {
              title: "2.1 Classes, Objects & The __init__ Constructor",
              titleBn: "২.১ ক্লাস, অবজেক্ট ও __init__ কনস্ট্রাক্টর",
              description: "Creating custom classes, instance variables, methods, and the self parameter.",
              descriptionBn: "কাস্টম ক্লাস তৈরি, ইনস্ট্যান্স ভেরিয়েবল ও সেলফ প্যারামিটার।",
              duration: "35 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
              instructors: [{ id: inst1, role: "Instructor" }],
            },
            {
              title: "2.2 Inheritance, Polymorphism & Modular Code",
              titleBn: "২.২ ইনহেরিটেন্স, পলিমরফিজম ও মডুলার কোড",
              description: "Subclassing, super() calls, method overriding, and organizing code into modules.",
              descriptionBn: "সাবক্লাস, সুপার কল, মেথড ওভাররাইডিং এবং কোড মডিউলাইজেশন।",
              duration: "32 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
              instructors: [{ id: inst1, role: "Instructor" }],
            },
          ],
        },
        {
          title: "Module 3: Data Analysis with NumPy & Pandas",
          titleBn: "মডিউল ৩: নামপাই ও প্যান্ডাস দিয়ে ডেটা অ্যানালাইসিস",
          description: "Reading datasets, performing analytical queries, and plotting meaningful visualizations.",
          descriptionBn: "বাস্তব ডেটাসেট লোড করা, অ্যানালিটিক্যাল কুয়েরি ও ভিজুয়ালাইজেশন।",
          lessons: [
            {
              title: "3.1 NumPy Arrays & Fast Vectorized Calculations",
              titleBn: "৩.১ নামপাই অ্যারে ও ফাস্ট ভেক্টরাইজড ক্যালকুলেশন",
              description: "Array slicing, broadcasting, mathematical operations, and statistical calculations.",
              descriptionBn: "অ্যারে স্লাইসিং, ব্রডকাস্টিং এবং পরিসংখ্যানিক গণনা।",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
              instructors: [{ id: inst1, role: "Instructor" }],
            },
            {
              title: "3.2 Real-World Data Wrangling with Pandas & Matplotlib",
              titleBn: "৩.২ প্যান্ডাস ও ম্যাটপ্লটলিব দিয়ে বাস্তব ডেটা ক্লিনিং",
              description: "Loading a Kaggle dataset, cleaning missing values, grouping data, and generating charts.",
              descriptionBn: "ক্যাগল ডেটাসেট লোড, মিসিং ভ্যালু ক্লিন করা এবং গ্রাফ তৈরি।",
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
      titleBn: "মডার্ন ইউআই/ইউএক্স ডিজাইন: ফিগমা থেকে কোড",
      slug: "modern-ui-ux-design-figma-to-code",
      excerpt: "Design beautiful web & mobile interfaces in Figma, master typography, auto-layout, design tokens, and convert designs into code.",
      excerptBn: "ফিগমাতে প্রফেশনাল ওয়েব ও মোবাইল ইন্টারফেস ডিজাইন করুন, অটো-লেআউট আয়ত্ত করুন এবং ডিজাইনকে সরাসরি রিয়েক্ট কোডে রূপান্তর করুন।",
      description: `### Transform Ideas into Stunning, Usable Digital Experiences

A high-converting web product starts with world-class user interface design. This comprehensive workshop takes you inside the design process used by top digital product studios.

#### What you will master:
- **Figma Foundations:** Frames, vector shapes, typography hierarchies, harmonious color palettes.
- **Auto Layout 5.0:** Fluid responsive layouts, flex-like spacing, min/max dimensions.
- **Design Systems & Component Architecture:** Variants, component properties, design tokens.
- **Interactive Prototyping:** Micro-interactions, smart animate, sheet modals, and hover states.
- **Developer Handoff:** Exporting assets, CSS inspection, converting Figma components into React/Tailwind.`,
      descriptionBn: `### আপনার ধারণাকে রূপ দিন আকর্ষণীয় ও ব্যবহারবান্ধব ডিজিটাল অভিজ্ঞতায়

একটি সফল ওয়েব ও মোবাইল পণ্যের শুরু হয় চমৎকার ইউজার ইন্টারফেস ডিজাইন দিয়ে। এই কোর্সে ডিজিটাল প্রোডাক্ট স্টুডিওগুলোর কাজের প্রক্রিয়া, কম্পোনেন্ট আর্কিটেকচার এবং সরাসরি রিয়েক্ট-টেইলউইন্ডে রূপান্তর শেখানো হয়েছে।

#### যা যা শিখবেন:
- **ফিগমার মূল ভিত্তি:** ফ্রেম, ভেক্টর শেইপ, টাইপোগ্রাফি হায়ারার্কি ও কালার প্যালেট।
- **Auto Layout 5.0:** ফ্লুইড রেসপনসিভ লেআউট ও প্যাডিং-গ্যাপ কন্ট্রোল।
- **ডিজাইন সিস্টেম:** ভ্যারিয়েন্ট, কম্পোনেন্ট প্রপার্টি ও ডিজাইন টোকেন।
- **ইন্টারঅ্যাক্টিভ প্রোটোটাইপিং:** স্মার্ট অ্যানিমেট, ড্রয়ার ও হোভার স্টেট।
- **ফিগমা থেকে কোড:** ডিজাইন অ্যাসেট এক্সপোর্ট ও নিখুঁত টেইলউইন্ড সিএসএস কোড রূপান্তর।`,
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
          titleBn: "মডিউল ১: ফিগমা এসেনশিয়ালস ও ভিজ্যুয়াল ডিজাইন প্রিন্সিপাল",
          description: "Understanding grids, visual balance, contrast ratios, and interface typography.",
          descriptionBn: "গ্রিড সিস্টেম, ভিজ্যুয়াল ব্যালেন্স ও ইন্টারফেস টাইপোগ্রাফি।",
          lessons: [
            {
              title: "1.1 Navigating Figma, Canvas Setup & The Golden Rules of UI",
              titleBn: "১.১ ফিগমা ক্যানভাস ও ইউআই ডিজাইনের সুবর্ণ নিয়মাবলী",
              description: "Tour of Figma tools, setting up 8pt grids, choosing fonts, and defining accessible color contrast.",
              descriptionBn: "ফিগমা টুলস, ৮-পয়েন্ট গ্রিড এবং অ্যাক্সেসিবল কালার কনট্রাস্ট।",
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
              titleBn: "১.২ অটো লেআউট ৫.০ ও রেসপনসিভ ফ্রেম মাস্টারি",
              description: "How auto layout mimics CSS flexbox: padding, gap, fill container vs hug contents, and absolute positioning.",
              descriptionBn: "প্যাডিং, গ্যাপ, ফিল কন্টেইনার এবং অ্যাবসোলিউট পজিশনিং।",
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
          titleBn: "মডিউল ২: ডিজাইন সিস্টেম ও কম্পোনেন্ট লাইব্রেরি",
          description: "Creating scalable design tokens, button variants, inputs, and dark mode themes.",
          descriptionBn: "স্কেলেবল ডিজাইন টোকেন, বাটন ভ্যারিয়েন্ট ও ডার্ক মোড থিম।",
          lessons: [
            {
              title: "2.1 Building Atomic Design Components & Variants",
              titleBn: "২.১ অ্যাটমিক ডিজাইন কম্পোনেন্ট ও ভ্যারিয়েন্ট তৈরি",
              description: "Creating buttons with default, hover, active, and disabled states using boolean component properties.",
              descriptionBn: "হোভার, অ্যাক্টিভ ও ডিজেবল্ড স্টেটের জন্য প্রপার্টি ভিত্তিক বাটন তৈরি।",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=FTlczFBlYnw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
            {
              title: "2.2 Smart Animate Micro-interactions & Prototyping",
              titleBn: "২.২ স্মার্ট অ্যানিমেট ও প্রোটোটাইপিং",
              description: "Connecting frames, setting easing curves, building realistic animated dropdowns and drawer modals.",
              descriptionBn: "ফ্রেম কানেকশন, ইজিং কার্ভ এবং রিয়েলিস্টিক অ্যানিমেশন।",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=c_hO_fjimCw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
          ],
        },
        {
          title: "Module 3: From Figma Design to React & Tailwind Code",
          titleBn: "মডিউল ৩: ফিগমা ডিজাইন থেকে রিয়েক্ট ও টেইলউইন্ড কোড",
          description: "Handoff workflows, extracting SVG assets, and writing pixel-perfect Tailwind CSS code.",
          descriptionBn: "এসভিজি এক্সপোর্ট এবং পিক্সেল পারফেক্ট টেইলউইন্ড সিএসএস কোড লেখা।",
          lessons: [
            {
              title: "3.1 Translating Figma Tokens to Tailwind CSS Config",
              titleBn: "৩.১ ফিগমা টোকেন থেকে টেইলউইন্ড কনফিগ তৈরি",
              description: "Mapping color palettes, font weights, and spacing scales from your Figma design system to Tailwind CSS.",
              descriptionBn: "কালার ও স্পেসিং স্কেলকে টেইলউইন্ড সিএসএসে ম্যাপ করা।",
              duration: "34 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=FTlczFBlYnw",
              instructors: [{ id: inst1, role: "Lead Designer" }],
            },
            {
              title: "3.2 Coding the Complete Landing Page in React",
              titleBn: "৩.২ সম্পূর্ণ ল্যান্ডিং পেজ রিয়েক্টে কোড করা",
              description: "Step-by-step code walkthrough recreating the Figma design in React with semantic HTML and clean styling.",
              descriptionBn: "ধাপে ধাপে ফিগমা ডিজাইন দেখে সেমান্টিক এইচটিএমএল ও টেইলউইন্ডে রূপান্তর।",
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
      titleBn: "মাস্টারিং ব্যাকএন্ড ইঞ্জিনিয়ারিং: নোড.জেএস, এক্সপ্রেস ও পোস্টগ্রেসকিউএল",
      slug: "mastering-backend-engineering-nodejs-express-postgresql",
      excerpt: "Architect robust REST APIs, implement JWT authentication, manage database transactions, Redis caching, and Dockerize services.",
      excerptBn: "রোবাস্ট রেস্ট এপিআই তৈরি, জেডব্লিউটি অথেনটিকেশন, পোস্টগ্রেসকিউএল ট্রানজ্যাকশন, রেডিস ক্যাশিং ও ডকার ডিপ্লয়মেন্ট শিখুন।",
      description: `### Build Production-Grade Backend Architectures That Scale

Learn how real-world enterprise backends are architected from the ground up. This course focuses on writing clean, maintainable, secure server applications using the Node.js runtime and PostgreSQL.

#### What you will master:
- **Node.js Internals:** Event Loop, Libuv, Streams, Buffers, Worker Threads.
- **Express.js Architecture:** Controller-Service-Repository pattern, middleware chains, error handling.
- **Relational Databases & SQL:** Schema design, normalization, ACID transactions, foreign keys, indexes.
- **Authentication & Security:** JWT tokens, refresh token rotation, bcrypt password hashing, CORS, rate limiting.
- **Performance:** Redis caching, connection pooling, database query optimization.
- **DevOps:** Docker containerization, docker-compose, and automated health checks.`,
      descriptionBn: `### তৈরি করুন প্রডাকশন-গ্রেড হাই-পারফরম্যান্স ব্যাকএন্ড সিস্টেম

বাস্তব জীবনের এন্টারপ্রাইজ ব্যাকএন্ড অ্যাপ্লিকেশনগুলো কীভাবে ডিজাইন ও আর্কিটেক্ট করা হয় তা শিখুন। নোড.জেএস রানটাইম, এক্সপ্রেস এবং পোস্টগ্রেসকিউএল দিয়ে ক্লিন ও সিকিউর সার্ভার তৈরি করার নির্ভরযোগ্য গাইডলাইন।

#### মূল বিষয়সমূহ:
- **Node.js Internals:** ইভেন্ট লুপ, স্ট্রিমস, বাফার্স ও নন-ব্লকিং আই/ও।
- **Express.js Architecture:** কন্ট্রোলার-সার্ভিস-রিপোজিটরি প্যাটার্ন ও মিডলওয়্যার।
- **PostgreSQL ও রিলেশনাল ডেটাবেজ:** স্কিমা ডিজাইন, নরমালাইজেশন, ট্রানজ্যাকশন ও ইনডেক্সিং।
- **অথেনটিকেশন ও সিকিউরিটি:** JWT, রিফ্রেশ টোকেন রোটেশন, পাসওয়ার্ড হ্যাশিং ও রেট লিমিটিং।
- **পারফরম্যান্স:** Redis ক্যাশিং, কানেকশন পুলিং ও অপ্টিমাইজেশন।
- **DevOps:** ডকারাইজেশন, docker-compose এবং হেলথ চেক।`,
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
          titleBn: "মডিউল ১: নোড.জেএস কোর ও রেস্ট এপিআই আর্কিটেকচার",
          description: "Writing structured APIs following the Service-Repository pattern.",
          descriptionBn: "সার্ভিস-রিপোজিটরি প্যাটার্ন ও মিডলওয়্যার চেইনিং।",
          lessons: [
            {
              title: "1.1 The Node.js Event Loop & Express Project Scaffolding",
              titleBn: "১.১ নোড.জেএস ইভেন্ট লুপ ও এক্সপ্রেস প্রজেক্ট আর্কিটেকচার",
              description: "Understanding single-threaded event loop, non-blocking I/O, setting up TypeScript, and folder architecture.",
              descriptionBn: "সিঙ্গেল থ্রেডেড ইভেন্ট লুপ, নন-ব্লকিং আই/ও এবং টাইপস্ক্রিপ্ট সেটআপ।",
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
              titleBn: "১.২ এরর হ্যান্ডলিং মিডলওয়্যার, ভ্যালিডেশন ও কনফিগ",
              description: "Centralized error classes, Zod request body validation, and environment validation with envalid.",
              descriptionBn: "সেন্ট্রালাইজড এরর হ্যান্ডলার এবং জড দিয়ে রিকোয়েস্ট ভ্যালিডেশন।",
              duration: "35 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: PostgreSQL, Indexing & Authentication",
          titleBn: "মডিউল ২: পোস্টগ্রেসকিউএল, ইনডেক্সিং ও অথেনটিকেশন",
          description: "Designing schemas, writing parameterized SQL queries, and secure token authentication.",
          descriptionBn: "রিলেশনাল স্কিমা ডিজাইন ও সিকিউর টোকেন ম্যানেজমেন্ট।",
          lessons: [
            {
              title: "2.1 Database Schema Design, Relations & Foreign Keys",
              titleBn: "২.১ ডেটাবেজ স্কিমা ডিজাইন ও ফরেন কি রিলেশনশিপ",
              description: "One-to-many, many-to-many junction tables, cascade deletes, and B-tree indexes.",
              descriptionBn: "ওয়ান-টু-মেনি, মেনি-টু-মেনি টেবিল এবং বি-ট্রি ইনডেক্সিং।",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "2.2 JWT Authentication & Refresh Token Rotation",
              titleBn: "২.২ জেডব্লিউটি অথেনটিকেশন ও রিফ্রেশ টোকেন রোটেশন",
              description: "Issuing short-lived access tokens, persisting refresh tokens in Redis/PostgreSQL, and logout revocation.",
              descriptionBn: "স্বল্পমেয়াদী অ্যাক্সেস টোকেন ও রেডিসে রিফ্রেশ টোকেন সংরক্ষণ।",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
          ],
        },
        {
          title: "Module 3: Caching, Dockerization & Production Readiness",
          titleBn: "মডিউল ৩: ক্যাশিং, ডকার ও প্রডাকশন রেডিনেস",
          description: "High performance caching with Redis, containerization, and deployment.",
          descriptionBn: "রেডিস দিয়ে দ্রুত ক্যাশিং ও ডকার কম্পোজ দিয়ে সার্ভিস ডিপ্লয়মেন্ট।",
          lessons: [
            {
              title: "3.1 Redis In-Memory Caching & Cache Invalidation",
              titleBn: "৩.১ রেডিস ইন-মেমোরি ক্যাশিং ও ক্যাশ ইনভ্যালিডেশন",
              description: "Cache-aside pattern, setting TTL, and invalidating cache on write mutations.",
              descriptionBn: "ক্যাশ-অ্যাসাইড প্যাটার্ন, টিটিএল সেট এবং ডেটা আপডেটে ক্যাশ ক্লিয়ার।",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
              instructors: [{ id: inst1, role: "Lead Instructor" }],
            },
            {
              title: "3.2 Dockerizing Node.js + Postgres with Docker Compose",
              titleBn: "৩.২ ডকার কম্পোজ দিয়ে নোড ও পোস্টগ্রেস ডিপ্লয়মেন্ট",
              description: "Multi-stage Dockerfile, minimizing image size, setting up health checks and docker-compose.yml.",
              descriptionBn: "মাল্টি-স্টেজ ডকারফাইল ও ডকার কম্পোজে ফুল ব্যাকএন্ড চালানো।",
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
      titleBn: "মোবাইল অ্যাপ ডেভেলপমেন্ট: ফ্লাটার ও ডার্ট",
      slug: "mobile-app-development-flutter-dart",
      excerpt: "Build high-performance, beautiful native iOS and Android apps from a single codebase using Flutter and Dart.",
      excerptBn: "একই কোডবেস থেকে অ্যান্ড্রয়েড ও আইওএসের জন্য হাই-পারফরম্যান্স ও দৃষ্টিনন্দন নেটিভ মোবাইল অ্যাপ তৈরি করুন।",
      description: `### Cross-Platform Native Mobile Development Made Easy

Create silky-smooth 60fps and 120fps native mobile apps for Android and iOS using Google's Flutter framework. This course takes you through widgets, state management, offline database storage, and push notifications.

#### Course Curriculum:
- **Dart Language Primer:** null-safety, async/await, futures, streams, collections.
- **Widget Tree:** StatelessWidget vs StatefulWidget, BuildContext, LayoutBuilder.
- **Styling & UI:** Material 3, Cupertino iOS widgets, custom animations, hero transitions.
- **State Management:** Provider, Riverpod, and Bloc architecture.
- **Networking & Persistence:** Dio HTTP client, SharedPreferences, SQLite/Isar local database.
- **Firebase:** Authentication, Firestore database, Cloud Messaging (FCM) notifications.`,
      descriptionBn: `### সহজে শিখুন ক্রস-প্ল্যাটফর্ম নেটিভ মোবাইল অ্যাপ ডেভেলপমেন্ট

গুগলের ফ্লাটার ফ্রেমওয়ার্ক ও ডার্ট ল্যাঙ্গুয়েজ দিয়ে ৬০ ও ১২০ এফপিএস স্মুথ মোবাইল অ্যাপ তৈরি করুন। এই কোর্সে উইজেট আর্কিটেকচার, স্টেট ম্যানেজমেন্ট, অফলাইন ডেটাবেজ স্টোরেজ এবং পুশ নোটিফিকেশন শেখানো হয়েছে।

#### কোর্সের কারিকুলাম:
- **Dart Language:** নাল-সেফটি, অ্যাসিনক্রোনাস প্রোগ্রামিং, ফিউচার ও স্ট্রিমস।
- **Widget Tree:** স্টেটলেস ও স্টেটফুল উইজেট, বিল্ড কনটেক্সট।
- **UI & Animation:** মেটেরিয়াল ৩ ও কিউপারটিনো আইওএস উইজেট, কাস্টম হিরো অ্যানিমেশন।
- **State Management:** রিভারপড (Riverpod) ও প্রোভাইডার আর্কিটেকচার।
- **Networking:** ডায়ো (Dio) ক্লায়েন্ট ও রেস্ট এপিআই কনজিউম করা।
- **Local Storage:** এসকিউএলআইট ও শেয়ার্ড প্রেফারেন্স দিয়ে অফলাইন সাপোর্ট।`,
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
          titleBn: "মডিউল ১: ফ্লাটার ফান্ডামেন্টালস ও উইজেট ট্রি",
          description: "Understanding widgets, layouts, stateful vs stateless components.",
          descriptionBn: "উইজেট, লেআউট এবং স্টেটলেস বনাম স্টেটফুল আর্কিটেকচার।",
          lessons: [
            {
              title: "1.1 Flutter SDK Setup & Your First Material 3 App",
              titleBn: "১.১ ফ্লাটার এসডিকে সেটআপ ও প্রথম মেটেরিয়াল ৩ অ্যাপ",
              description: "Android Studio / VS Code configuration, Flutter doctor, running emulator, and scaffold basics.",
              descriptionBn: "ভিএস কোড কনফিগারেশন, ফ্লাটার ডক্টর এবং এমুলেটরে অ্যাপ রান।",
              duration: "26 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
            {
              title: "1.2 Layout Mastery: Row, Column, Stack & ListView",
              titleBn: "১.২ লেআউট মাস্টারি: রো, কলাম, স্ট্যাক ও লিস্টভিউ",
              description: "Building scrollable feeds, responsive grids, constraints, and custom app bars.",
              descriptionBn: "স্ক্রোলেবল ফিড, রেসপনসিভ গ্রিড এবং কাস্টম অ্যাপবার।",
              duration: "34 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
          ],
        },
        {
          title: "Module 2: State Management with Riverpod & API Calls",
          titleBn: "মডিউল ২: রিভারপড স্টেট ম্যানেজমেন্ট ও এপিআই কলিং",
          description: "Managing app state cleanly and consuming REST APIs.",
          descriptionBn: "অ্যাপ স্টেট পরিচালনা এবং রিমোট এপিআই ডেটা হ্যান্ডলিং।",
          lessons: [
            {
              title: "2.1 Riverpod State Providers & Notifiers",
              titleBn: "২.১ রিভারপড স্টেট প্রোভাইডার ও নোটিফায়ার",
              description: "StateProvider, FutureProvider, and refactoring business logic out of the UI widget tree.",
              descriptionBn: "স্টেটপ্রোভাইডার, ফিউচারপ্রোভাইডার ও বিজনেস লজিক আলাদা করা।",
              duration: "44 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
            {
              title: "2.2 Networking with Dio & JSON Deserialization",
              titleBn: "২.২ ডায়ো নেটওয়ার্কিং ও জেএসন ডেসিরিয়ালাইজেশন",
              description: "Fetching remote data, handling network exceptions, and parsing models with json_serializable.",
              descriptionBn: "এপিআই থেকে ডেটা ফেচ, এক্সেপশন হ্যান্ডলিং ও মডেল ম্যাপিং।",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
          ],
        },
        {
          title: "Module 3: Full App Build & Play Store Deployment",
          titleBn: "মডিউল ৩: ফুল অ্যাপ বিল্ড ও প্লে স্টোর ডেপ্লয়মেন্ট",
          description: "Building an offline-first notes/task application and signing the release APK/AAB.",
          descriptionBn: "অফলাইন-ফার্স্ট অ্যাপ তৈরি এবং রিলিজ এপিকে/এএবি সাইন করা।",
          lessons: [
            {
              title: "3.1 Local Storage with SQLite & SharedPreferences",
              titleBn: "৩.১ এসকিউএলআইট ও শেয়ার্ড প্রেফারেন্স দিয়ে অফলাইন স্টোরেজ",
              description: "Caching user settings, offline CRUD persistence, and synchronizing when back online.",
              descriptionBn: "ইউজার সেটিংস ক্যাশিং ও ইন্টারনেট ছাড়াই অ্যাপ ব্যবহারের সুবিধা।",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8",
              instructors: [{ id: inst1, role: "Mobile Mentor" }],
            },
            {
              title: "3.2 App Signing, Icons, Splash Screens & Release AAB",
              titleBn: "৩.২ অ্যাপ সাইনিং, আইকন, স্প্ল্যাশ স্ক্রিন ও রিলিজ এএবি",
              description: "Generating release keystore, configuring build.gradle, and preparing for Google Play Console submission.",
              descriptionBn: "রিলিজ কিস্টোর তৈরি, গ্রেডল কনফিগারেশন ও প্লে কনসোলের প্রস্তুতি।",
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
      titleBn: "গিট, গিটহাব ও ওপেন সোর্স কোলাবোরেশন বুটক্যাম্প",
      slug: "git-github-open-source-collaboration-bootcamp",
      excerpt: "Master version control, branches, pull requests, merge conflict resolution, and contribute to open-source projects with confidence.",
      excerptBn: "ভার্সন কন্ট্রোল, ব্রাঞ্চিং, পুল রিকোয়েস্ট ও মার্জ কনফ্লিক্ট সমাধান আয়ত্ত করে আত্মবিশ্বাসের সাথে ওপেন সোর্স প্রজেক্টে অবদান রাখুন।",
      description: `### Essential Version Control & Team Collaboration for Every Developer

No developer can work in isolation. Version control with Git is the single most vital skill expected by tech companies and open-source communities. This fast-paced, practical bootcamp demystifies Git commands and GitHub workflows.

#### What you will master:
- **Git Under the Hood:** Commits, snapshots, blobs, trees, commit hashes (SHA).
- **Core Operations:** staging, committing, git diff, git log, git checkout/switch.
- **Branching Strategies:** feature branches, hotfixes, rebasing vs merging.
- **Conflict Resolution:** Safely resolving merge conflicts and cherry-picking commits.
- **GitHub Collaboration:** Forking, Pull Requests (PRs), code reviews, issues, and project boards.
- **Automation:** GitHub Actions for automated linting, test running, and deployments.`,
      descriptionBn: `### প্রতিটি ইঞ্জিনিয়ারের জন্য অপরিহার্য ভার্সন কন্ট্রোল ও টিম কোলাবোরেশন

একটি সফটওয়্যার টিমে কাজ করতে হলে Git জানা অত্যন্ত জরুরি। এই প্র্যাকটিক্যাল বুটক্যাম্পে গিটের অভ্যন্তরীণ মেকানিজম, কমান্ড লাইন এবং গিটহাবের রিয়েল-লাইফ টিম ওয়ার্কফ্লো শেখানো হয়েছে।

#### যা যা শিখবেন:
- **Git Under the Hood:** কমিট, স্ন্যাপশট, ব্লব, ট্রি এবং হ্যাশ কোড।
- **কোর অপারেশন:** স্টেজিং, কমিটিং, গিট ডিফল্ট, লগ ও ব্রাঞ্চ সুইচিং।
- **ব্রাঞ্চিং স্ট্র্যাটেজি:** ফিচার ব্রাঞ্চ, হটফিক্স এবং মার্জ বনাম রিবেস।
- **কনফ্লিক্ট সমাধান:** মার্জ কনফ্লিক্ট শনাক্ত ও নির্ভুলভাবে ফিক্স করা।
- **গিটহাব কোলাবোরেশন:** ফর্ক, পুল রিকোয়েস্ট (PR), কোড রিভিউ এবং ইস্যু ট্র্যাকিং।
- **অটোমেশন:** GitHub Actions দিয়ে স্বয়ংক্রিয় টেস্ট ও বিল্ড চালানো।`,
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
          titleBn: "মডিউল ১: গিট এসেনশিয়ালস ও প্রতিদিনের ওয়ার্কফ্লো",
          description: "Terminal commands, commit anatomy, and local repo management.",
          descriptionBn: "টার্মিনাল কমান্ড, কমিট অ্যানাটমি ও লোকাল রিপোজিটরি পরিচালনা।",
          lessons: [
            {
              title: "1.1 Introduction to Git, Terminal Setup & First Commit",
              titleBn: "১.১ গিট পরিচিতি, টার্মিনাল সেটআপ ও প্রথম কমিট",
              description: "Configuring user.name, user.email, SSH keys for GitHub, git init, add, and commit.",
              descriptionBn: "ইউজার কনফিগারেশন, এসএসএইচ কি সেটআপ ও গিট ইনিশিয়ালাইজেশন।",
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
              titleBn: "১.২ ব্রাঞ্চিং, মার্জিং ও কনফ্লিক্ট সমাধান",
              description: "Creating feature branches, merging with fast-forward vs three-way merge, and solving merge conflicts in VS Code.",
              descriptionBn: "ফিচার ব্রাঞ্চ তৈরি ও ভিএস কোডে সহজে মার্জ কনফ্লিক্ট সমাধান।",
              duration: "28 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=apGV9Kg7ics",
              instructors: [{ id: inst2, role: "Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: GitHub, Pull Requests & Open Source",
          titleBn: "মডিউল ২: গিটহাব, পুল রিকোয়েস্ট ও ওপেন সোর্স",
          description: "Forking repositories, submitting clean PRs, and reviewing code.",
          descriptionBn: "রিপোজিটরি ফর্ক করা, মানসম্মত পিআর তৈরি ও কোড রিভিউ।",
          lessons: [
            {
              title: "2.1 The Open Source Workflow: Fork, Clone, Branch & PR",
              titleBn: "২.১ ওপেন সোর্স ওয়ার্কফ্লো: ফর্ক, ক্লোন, ব্রাঞ্চ ও পিআর",
              description: "How to find beginner-friendly open-source issues (good-first-issue), write descriptive pull requests, and respond to review comments.",
              descriptionBn: "বিগিনার-ফ্রেন্ডলি ইস্যু খোঁজা এবং প্রফেশনাল পুল রিকোয়েস্ট তৈরি।",
              duration: "30 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
              instructors: [{ id: inst2, role: "Instructor" }],
            },
            {
              title: "2.2 Continuous Integration with GitHub Actions",
              titleBn: "২.২ গিটহাব অ্যাকশনস দিয়ে কন্টিনিউয়াস ইন্টিগ্রেশন (CI)",
              description: "Writing YAML workflow files to test and lint code on every pull request automatically.",
              descriptionBn: "ওয়ার্কফ্লো ইয়ামল ফাইল লিখে প্রতিটি পিআরে টেস্ট অটোমেশন।",
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
      titleBn: "লিনাক্স সিস্টেম অ্যাডমিনিস্ট্রেশন ও ডেভঅপস এসেনশিয়ালস",
      slug: "linux-system-administration-devops-essentials",
      excerpt: "Learn Linux server management, Bash scripting, Nginx configuration, SSL certificates, Docker containers, and server security.",
      excerptBn: "লিনাক্স সার্ভার ম্যানেজমেন্ট, ব্যাশ স্ক্রিপ্টিং, এনজিনএক্স কনফিগারেশন, এসএসএল সার্টিফিকেট ও ডকার কন্টেইনারাইজেশন শিখুন।",
      description: `### Master the Operating System That Powers the Modern Internet

Over 90% of the world's cloud servers run on Linux. As a polytechnic computer engineer, mastering the Linux terminal and system administration is your biggest competitive advantage in DevOps and cloud roles.

#### What you will master:
- **Linux Architecture:** Kernel, shell, filesystem hierarchy (FHS), permissions (chmod, chown).
- **Bash Scripting:** Variables, loops, cron jobs for automated system maintenance.
- **Networking & Services:** systemd, journalctl, netstat, ufw firewall, SSH hardening.
- **Web Servers:** Installing and configuring Nginx as a reverse proxy with load balancing.
- **SSL / TLS:** Free HTTPS setup with Let's Encrypt and Certbot auto-renewal.
- **Containerization:** Running containerized workloads with Docker.`,
      descriptionBn: `### আধুনিক ইন্টারনেটের ভিত্তি লিনাক্স অপারেটিং সিস্টেমে দক্ষতা অর্জন করুন

বিশ্বের ৯০ শতাংশের বেশি ক্লাউড সার্ভার লিনাক্সে চালিত হয়। পলিটেকনিক কম্পিউটার ইঞ্জিনিয়ারিং শিক্ষার্থীদের জন্য লিনাক্স টার্মিনাল ও সিস্টেম অ্যাডমিনিস্ট্রেশনে পারদর্শী হওয়া ডেভঅপস ক্যারিয়ারে সবচেয়ে বড় প্লাস পয়েন্ট।

#### এই কোর্সে যা যা শিখবেন:
- **লিনাক্স আর্কিটেকচার:** কার্নেল, শেল, ফাইলসিস্টেম হায়ারার্কি ও পারমিশন (chmod, chown)।
- **ব্যাশ স্ক্রিপ্টিং:** অটোমেশন স্ক্রিপ্ট, লুপ এবং ক্রন জব (Cron Job)।
- **নেটওয়ার্কিং ও সার্ভিস:** systemd, journalctl, ফায়ারওয়াল (ufw) ও SSH সিকিউরিটি।
- **ওয়েব সার্ভার:** Nginx রিভার্স প্রক্সি ও লোড ব্যালেন্সিং সেটআপ।
- **SSL / TLS:** Let's Encrypt ও Certbot দিয়ে ফ্রি অটোমেটিক HTTPS সার্টিফিকেট।
- **কন্টেইনার:** ডকার দিয়ে অ্যাপ্লিকেশন রান ও ম্যানেজ করা।`,
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
          titleBn: "মডিউল ১: লিনাক্স টার্মিনাল ও ফাইলসিস্টেম নেভিগেশন",
          description: "Navigating filesystems, managing user accounts, and file permissions.",
          descriptionBn: "ফাইল ম্যানেজমেন্ট, ইউজার অ্যাকাউন্ট ও পারমিশন কন্ট্রোল।",
          lessons: [
            {
              title: "1.1 Terminal Essentials, File Manipulation & Navigation",
              titleBn: "১.১ টার্মিনাল কমান্ড ও ফাইলসিস্টেম হায়ারার্কি",
              description: "Mastering ls, cd, cp, mv, rm, cat, grep, find, and understanding the Filesystem Hierarchy Standard.",
              descriptionBn: "ls, cd, cp, mv, grep এবং লিনাক্স ডিরেক্টরি কাঠামো।",
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
              titleBn: "১.২ ইউজার, গ্রুপ, সুডো ও ফাইল পারমিশন (chmod, chown)",
              description: "Understanding read/write/execute binary permissions (755, 644), chown, useradd, and securing sudo privileges.",
              descriptionBn: "বাইনারি পারমিশন (৭৫৫, ৬৪৪), ইউজার তৈরি ও সুডো প্রিভিলেজ রক্ষা।",
              duration: "32 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=2a_A20WffoQ",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
          ],
        },
        {
          title: "Module 2: Bash Automation & Process Management",
          titleBn: "মডিউল ২: ব্যাশ অটোমেশন ও প্রসেস ম্যানেজমেন্ট",
          description: "Automating repetitive admin tasks with bash scripts and systemd services.",
          descriptionBn: "স্ক্রিপ্ট ও ক্রন দিয়ে নিয়মিত ব্যাকআপ এবং সিস্টেমডি সার্ভিস ম্যানেজমেন্ট।",
          lessons: [
            {
              title: "2.1 Writing Bash Scripts & Automating Backups with Cron",
              titleBn: "২.১ ব্যাশ স্ক্রিপ্ট লেখা ও ক্রন জব দিয়ে ব্যাকআপ অটোমেশন",
              description: "Conditionals, loops, script arguments, crontab syntax, and automated database backups.",
              descriptionBn: "কন্ডিশনাল, লুপ এবং ক্রনট্যাব দিয়ে ডেটাবেজ ব্যাকআপ অটোমেশন।",
              duration: "38 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=sWbUDq4S6Y8",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
            {
              title: "2.2 Process Monitoring & Systemd Service Management",
              titleBn: "২.২ প্রসেস মনিটরিং ও সিস্টেমডি সার্ভিস তৈরি",
              description: "Managing background daemons with systemctl, reading logs with journalctl, and monitoring with htop.",
              descriptionBn: "systemctl, journalctl লগ রিডিং এবং htop দিয়ে প্রসেস পর্যবেক্ষণ।",
              duration: "35 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=2a_A20WffoQ",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
          ],
        },
        {
          title: "Module 3: Nginx Web Server, SSL & Cloud Deployment",
          titleBn: "মডিউল ৩: এনজিনএক্স ওয়েব সার্ভার, এসএসএল ও ক্লাউড ডিপ্লয়মেন্ট",
          description: "Deploying web applications behind Nginx with Let's Encrypt SSL.",
          descriptionBn: "এনজিনএক্স রিভার্স প্রক্সি কনফিগারেশন এবং ক্লাউড ভিপিএস সুরক্ষা।",
          lessons: [
            {
              title: "3.1 Configuring Nginx as Reverse Proxy & Load Balancer",
              titleBn: "৩.১ এনজিনএক্স রিভার্স প্রক্সি ও লোড ব্যালেন্সার কনফিগারেশন",
              description: "Writing server blocks, proxy_pass to Node.js/Python ports, and configuring gzip compression.",
              descriptionBn: "সার্ভার ব্লক, proxy_pass এবং gzip কম্প্রেশন সেটআপ।",
              duration: "40 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=sWbUDq4S6Y8",
              instructors: [{ id: inst1, role: "DevOps Engineer" }],
            },
            {
              title: "3.2 Securing Cloud VPS: SSH Keys, UFW Firewall & SSL",
              titleBn: "৩.২ ক্লাউড সার্ভার সিকিউরিটি: এসএসএইচ কি, ইউএফডব্লিউ ও এসএসএল",
              description: "Disabling password login, setting up SSH keys, configuring UFW firewall ports, and running certbot.",
              descriptionBn: "পাসওয়ার্ড লগইন বন্ধ করা, ফায়ারওয়াল পোর্ট ও Certbot দিয়ে SSL চালু।",
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
      titleBn: "সাইবার সিকিউরিটি ফান্ডামেন্টালস ও এথিক্যাল হ্যাকিং ১০১",
      slug: "cybersecurity-fundamentals-ethical-hacking-101",
      excerpt: "Explore networking fundamentals, vulnerability assessment, OWASP Top 10 web vulnerabilities, Burp Suite, and defensive security.",
      excerptBn: "নেটওয়ার্কিং ফান্ডামেন্টালস, ভালনারেবিলিটি অ্যাসেসমেন্ট, ওওয়াস্প টপ ১০ ওয়েব নিরাপত্তা ত্রুটি এবং ডিফেন্সিভ সিকিউরিটি শিখুন।",
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
      descriptionBn: `### সিস্টেম ডিফেন্ড করুন এবং জানুন হ্যাকারদের আক্রমণ প্রতিহত করার কৌশল

তথ্যপ্রযুক্তি খাতের অন্যতম সম্ভাবনাময় ও উচ্চ চাহিদাসম্পন্ন ক্ষেত্র সাইবার সিকিউরিটি। এই কোর্সে প্র্যাকটিক্যাল এথিক্যাল হ্যাকিং, সাধারণ ওয়েব দুর্বলতাগুলো শনাক্তকরণ এবং নিরাপদ কোড লেখার কার্যকর কৌশল শেখানো হয়েছে।

#### মূল বিষয়বস্তু:
- **নেটওয়ার্কিং ভিত্তি:** TCP/IP, OSI মডেল, DNS, প্যাকেট অ্যানালাইসিস (Wireshark)।
- **রিকনেসান্স ও স্ক্যানিং:** Nmap পোর্ট স্ক্যানিং, OSINT টুলস ও সাবডোমেন খোঁজা।
- **OWASP Top 10 ওয়েব দুর্বলতা:**
  - এসকিউএল ইনজেকশন (SQLi)
  - ক্রস-সাইট স্ক্রিপ্টিং (XSS)
  - ক্রস-সাইট রিকোয়েস্ট ফোরজেরি (CSRF)
  - ব্রোকেন অ্যাক্সেস কন্ট্রোল (IDOR)
- **টুলস:** Burp Suite Community, Kali Linux এর প্রয়োজনীয় টুলস।
- **ডিফেন্সিভ কৌশল:** ইনপুট স্যানিটাইজেশন, CSP হেডার ও প্রিভিলেজ ম্যানেজমেন্ট।`,
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
          titleBn: "মডিউল ১: নেটওয়ার্কিং ফাউন্ডেশন ও প্যাকেট স্নাইফিং",
          description: "Understanding network protocols, ports, and capturing traffic.",
          descriptionBn: "নেটওয়ার্ক প্রোটোকল, পোর্ট এবং ট্রাফিক ক্যাপচারিং।",
          lessons: [
            {
              title: "1.1 The OSI Model, TCP/IP & Wireshark Packet Analysis",
              titleBn: "১.১ ওএসআই মডেল, টিসিপি/আইপি ও ওয়্যারশার্ক প্যাকেট বিশ্লেষণ",
              description: "Understanding 3-way handshakes, analyzing unencrypted HTTP vs TLS encrypted traffic in Wireshark.",
              descriptionBn: "থ্রি-ওয়ে হ্যান্ডশেক এবং ওয়্যারশার্কে এইচটিটিপি বনাম টিএলএস ট্রাফিক।",
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
              titleBn: "১.২ এনম্যাপ দিয়ে পোর্ট স্ক্যানিং ও রিকনেসান্স",
              description: "SYN scans (-sS), service version detection (-sV), operating system fingerprinting (-O), and vulnerability scripts.",
              descriptionBn: "SYN স্ক্যান, সার্ভিস ভার্সন শনাক্তকরণ ও ভালনারেবিলিটি স্ক্রিপ্ট।",
              duration: "35 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
          ],
        },
        {
          title: "Module 2: Web Application Security & OWASP Top 10",
          titleBn: "মডিউল ২: ওয়েব অ্যাপ্লিকেশন সিকিউরিটি ও ওওয়াস্প টপ ১০",
          description: "Finding and remediating critical web vulnerabilities.",
          descriptionBn: "ওয়েব অ্যাপ্লিকেশনের জটিল নিরাপত্তা ত্রুটি চিহ্নিত ও প্রতিকার।",
          lessons: [
            {
              title: "2.1 Intercepting HTTP Traffic with Burp Suite",
              titleBn: "২.১ বার্প সুইট দিয়ে এইচটিটিপি ট্রাফিক ইন্টারসেপ্ট করা",
              description: "Setting up browser proxy, manipulating requests with Repeater, and fuzzing with Intruder.",
              descriptionBn: "ব্রাউজার প্রক্সি সেটআপ, রিপিটার দিয়ে রিকোয়েস্ট মডিফাই ও ইন্ট্রুডার টেস্ট।",
              duration: "42 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=inWWhr5tnEA",
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
            {
              title: "2.2 SQL Injection (SQLi) & Cross-Site Scripting (XSS)",
              titleBn: "২.২ এসকিউএল ইনজেকশন (SQLi) ও ক্রস-সাইট স্ক্রিপ্টিং (XSS)",
              description: "In-band SQLi, stored vs reflected XSS payloads, and secure coding defenses using parameterized queries.",
              descriptionBn: "ইন-ব্যান্ড এসকিউএলআই, স্টোর্ড বনাম রিফ্লেক্টেড এক্সএসএস এবং প্রতিকার।",
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
          titleBn: "মডিউল ৩: ডিফেন্সিভ সিকিউরিটি ও নিরাপদ সিস্টেম ডিজাইন",
          description: "Implementing defense-in-depth security best practices.",
          descriptionBn: "পাসওয়ার্ড হ্যাশিং, টু-ফ্যাক্টর অথেনটিকেশন ও সিকিউরিটি হেডার।",
          lessons: [
            {
              title: "3.1 Authentication Security, Password Hashing & 2FA",
              titleBn: "৩.১ অথেনটিকেশন সিকিউরিটি, পাসওয়ার্ড হ্যাশিং ও ২এফএ",
              description: "Why MD5/SHA1 are broken, proper Argon2/bcrypt salting, and implementing Time-based One-Time Passwords (TOTP).",
              descriptionBn: "Bcrypt/Argon2 সল্টিং এবং TOTP ভিত্তিক টু-ফ্যাক্টর অথেনটিকেশন।",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=inWWhr5tnEA",
              instructors: [{ id: inst1, role: "Security Instructor" }],
            },
            {
              title: "3.2 Web Security Headers: CSP, HSTS & CORS Best Practices",
              titleBn: "৩.২ ওয়েব সিকিউরিটি হেডার্স: CSP, HSTS ও CORS গাইডলাইন",
              description: "Preventing clickjacking with X-Frame-Options, restricting resource loading with Content-Security-Policy, and CORS misconfiguration pitfalls.",
              descriptionBn: "কনটেন্ট সিকিউরিটি পলিসি, ক্লিকজ্যাকিং প্রতিরোধ ও নিরাপদ সিওআরএস।",
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
      titleBn: "আর্টিফিশিয়াল ইন্টেলিজেন্স ও মেশিন লার্নিং ক্র্যাশ কোর্স",
      slug: "artificial-intelligence-machine-learning-crash-course",
      excerpt: "Step into the world of AI: understand supervised and unsupervised machine learning, train models with Scikit-Learn, and build neural networks.",
      excerptBn: "এআইয়ের জগতে প্রবেশ করুন: সুপারভাইজড ও আনসুপারভাইজড লার্নিং, সাইকিট-লার্ন দিয়ে মডেল তৈরি এবং নিউরাল নেটওয়ার্কের প্রাথমিক ভিত্তি।",
      description: `### Demystifying AI, Deep Learning, and Predictive Models

Artificial Intelligence is reshaping every industry on the planet. This accessible, math-intuitive course bridges the gap between software engineering and machine learning, guiding you step-by-step through real ML pipelines.

#### What you will master:
- **Machine Learning Concepts:** Training sets, validation, testing, overfitting, underfitting, bias-variance tradeoff.
- **Supervised Learning:** Linear Regression, Logistic Regression, Decision Trees, Random Forests.
- **Unsupervised Learning:** K-Means Clustering, Principal Component Analysis (PCA).
- **Model Evaluation:** Confusion Matrix, Precision, Recall, F1-Score, ROC-AUC.
- **Deep Learning Intro:** Perceptrons, activation functions (ReLU, Sigmoid), backpropagation with PyTorch.
- **Computer Vision & NLP:** Convolutional neural networks (CNN) overview, word embeddings, transformer intuition.`,
      descriptionBn: `### সহজ ভাষায় কৃত্রিম বুদ্ধিমত্তা, ডিপ লার্নিং ও প্রেডিক্টিভ মডেলিং

কৃত্রিম বুদ্ধিমত্তা (AI) বিশ্বজুড়ে প্রযুক্তির মোড় ঘুরিয়ে দিচ্ছে। এই কোর্সে প্রোগ্রামার ও শিক্ষার্থীদের জন্য জটিল গণিত ছাড়াই সহজে বাস্তব মেশিন লার্নিং মডেল তৈরি ও ডেটা ট্রেন করা শেখানো হয়েছে।

#### কোর্সে যা যা শিখবেন:
- **মেশিন লার্নিং ধারণা:** ট্রেনিং ও টেস্টিং সেট, ওভারফিটিং, আন্ডারফিটিং, বায়াস-ভ্যারিয়েন্স।
- **সুপারভাইজড লার্নিং:** লিনিয়ার রিগ্রেশন, লজিস্টিক রিগ্রেশন, ডিসিশন ট্রি ও র্যান্ডম ফরেস্ট।
- **আনসুপারভাইজড লার্নিং:** K-Means ক্লাস্টারিং ও প্রিন্সিপাল কম্পোনেন্ট অ্যানালাইসিস (PCA)।
- **মডেল মূল্যায়ন:** কনফিউশন ম্যাট্রিক্স, প্রিসিশন, রিকল ও F1-স্কোর।
- **ডিপ লার্নিং পরিচিতি:** পারসেপট্রন, অ্যাক্টিভেশন ফাংশন (ReLU, Sigmoid) ও পাইটর্চ (PyTorch)।
- **কম্পিউটার ভিশন ও এনএলপি:** কনভোলিউশনাল নিউরাল নেটওয়ার্ক (CNN) ও ট্রান্সফরমারের প্রাথমিক ধারণা।`,
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
          titleBn: "মডিউল ১: মেশিন লার্নিং ফাউন্ডেশন ও লিনিয়ার মডেলস",
          description: "Understanding data preprocessing, training workflows, and linear algorithms.",
          descriptionBn: "ডেটা প্রিপ্রসেসিং, ফিচার ইঞ্জিনিয়ারিং ও লিনিয়ার অ্যালগরিদম।",
          lessons: [
            {
              title: "1.1 The Machine Learning Workflow & Feature Engineering",
              titleBn: "১.১ মেশিন লার্নিং ওয়ার্কফ্লো ও ফিচার ইঞ্জিনিয়ারিং",
              description: "Train/test split, feature scaling (StandardScaler, MinMaxScaler), handling categorical variables with One-Hot Encoding.",
              descriptionBn: "ট্রেন/টেস্ট স্প্লিট, ফিচার স্কেলিং এবং ক্যাটাগরিকাল ভেরিয়েবল এনকোডিং।",
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
              titleBn: "১.২ সাইকিট-লার্ন দিয়ে লিনিয়ার ও লজিস্টিক রিগ্রেশন",
              description: "Fitting continuous lines, predicting probabilities, cost functions (Mean Squared Error, Log Loss), and gradient descent.",
              descriptionBn: "কনটিনিউয়াস লাইন ফিটিং, প্রবাবিলিটি প্রেডিকশন এবং কস্ট ফাংশন।",
              duration: "40 mins",
              isPreview: true,
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
          ],
        },
        {
          title: "Module 2: Decision Trees, Ensemble Methods & Evaluation",
          titleBn: "মডিউল ২: ডিসিশন ট্রি, এনসেম্বল মেথড ও মডেল মূল্যায়ন",
          description: "Building powerful non-linear tree models and properly scoring metrics.",
          descriptionBn: "ট্রি মডেল তৈরি, র্যান্ডম ফরেস্ট এবং যথাযথ ইভ্যালুয়েশন মেট্রিক।",
          lessons: [
            {
              title: "2.1 Decision Trees & Random Forest Classifiers",
              titleBn: "২.১ ডিসিশন ট্রি ও র্যান্ডম ফরেস্ট ক্লাসিফায়ার",
              description: "Information gain, Gini impurity, bagging, feature importance, and tuning hyperparameters.",
              descriptionBn: "ইনফরমেশন গেইন, জিনি ইমপিউরিটি, ব্যাগিং ও হাইপারপ্যারামিটার টিউনিং।",
              duration: "45 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=JMUxmLyrhSk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
            {
              title: "2.2 Evaluation Metrics: Beyond Simple Accuracy",
              titleBn: "২.২ মূল্যায়ন মেট্রিক্স: প্রিসিশন, রিকল ও F1-স্কোর",
              description: "Why 99% accuracy can be misleading in imbalanced datasets, calculating Precision, Recall, and ROC-AUC curves.",
              descriptionBn: "কেন এক্যুরেসি সবসময় নির্ভরযোগ্য নয় এবং কনফিউশন ম্যাট্রিক্স বিশ্লেষণ।",
              duration: "36 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
          ],
        },
        {
          title: "Module 3: Neural Networks & Deep Learning with PyTorch",
          titleBn: "মডিউল ৩: নিউরাল নেটওয়ার্ক ও ডিপ লার্নিং (পাইটর্চ)",
          description: "Constructing artificial neural networks and understanding modern deep learning.",
          descriptionBn: "আর্টিফিশিয়াল নিউরাল নেটওয়ার্ক তৈরি এবং আধুনিক ডিপ লার্নিং।",
          lessons: [
            {
              title: "3.1 Neural Network Architecture & Backpropagation",
              titleBn: "৩.১ নিউরাল নেটওয়ার্ক আর্কিটেকচার ও ব্যাকপ্রোপাগেশন",
              description: "Layers, weights, biases, non-linear activation functions (ReLU), and how gradients propagate backwards.",
              descriptionBn: "লেয়ার, ওয়েট, বায়াস, নন-লিনিয়ার অ্যাক্টিভেশন (ReLU) এবং গ্র্যাডিয়েন্ট ডিসেন্ট।",
              duration: "52 mins",
              isPreview: false,
              videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
              instructors: [{ id: inst1, role: "Lead AI Researcher" }],
            },
            {
              title: "3.2 Training an Image Classifier with PyTorch",
              titleBn: "৩.২ পাইটর্চ দিয়ে ইমেজ ক্লাসিফায়ার মডেল তৈরি",
              description: "Writing training loops, calculating loss with cross-entropy, updating weights with Adam optimizer on GPU/CPU.",
              descriptionBn: "ট্রেনিং লুপ লেখা, লস ক্যালকুলেশন এবং অ্যাডাম অপটিমাইজার ব্যবহার।",
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

    // Upsert course with both English and Bangla support
    const course = await prisma.course.upsert({
      where: { slug: cData.slug },
      update: {
        title: cData.title,
        titleBn: cData.titleBn || null,
        excerpt: cData.excerpt,
        excerptBn: cData.excerptBn || null,
        description: cData.description,
        descriptionBn: cData.descriptionBn || null,
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
        titleBn: cData.titleBn || null,
        slug: cData.slug,
        excerpt: cData.excerpt,
        excerptBn: cData.excerptBn || null,
        description: cData.description,
        descriptionBn: cData.descriptionBn || null,
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

    // Insert sections and lessons with English and Bangla content
    for (let sIdx = 0; sIdx < cData.sections.length; sIdx++) {
      const s = cData.sections[sIdx]
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: s.title,
          titleBn: s.titleBn || null,
          description: s.description,
          descriptionBn: s.descriptionBn || null,
          orderIndex: sIdx,
        },
      })

      for (let lIdx = 0; lIdx < s.lessons.length; lIdx++) {
        const l: any = s.lessons[lIdx]
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: l.title,
            titleBn: l.titleBn || null,
            description: l.description,
            descriptionBn: l.descriptionBn || null,
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
    console.log(`✅ [${count}/10] Seeded: ${cData.title} (${cData.titleBn})`)
  }

  console.log(`\n🎉 Successfully seeded all 10 full size courses with English & Bangla content!`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
