import "dotenv/config"

import prisma from "../src/lib/prisma"
import {
  Department,
  EventRegistrationStatus,
  EventStatus,
  EventType,
  PaymentMethod,
  Semester,
  Shift,
} from "../src/generated/prisma/enums"
import { toEventSlug } from "../src/lib/event-slug"

async function seedEvents() {
  console.log("Seeding realistic dummy events and registrations...")

  // 1. Fetch author user
  const adminUser = await prisma.user.findFirst({
    where: { roles: { has: "ADMIN" } },
  }) ?? await prisma.user.findFirst()

  if (!adminUser) {
    throw new Error("No user found in database to author events.")
  }

  console.log(`Using author: ${adminUser.name} (${adminUser.id})`)

  // 2. Ensure categories exist
  const categoriesData = [
    {
      name: "Workshops",
      nameBn: "ওয়ার্কশপ",
      slug: "workshops",
      description: "Hands-on technical workshops and practical learning sessions.",
    },
    {
      name: "Hackathons",
      nameBn: "হ্যাকাথন",
      slug: "hackathons",
      description: "Fast-paced collaborative innovation, hack-sprints and prototyping competitions.",
    },
    {
      name: "Competitive Programming",
      nameBn: "কম্পিটিটিভ প্রোগ্রামিং",
      slug: "competitive-programming",
      description: "Problem solving sessions, mock contests and algorithm bootcamps.",
    },
    {
      name: "Bootcamps",
      nameBn: "বুটক্যাম্প",
      slug: "bootcamps",
      description: "Multi-day intensive skill development sprints for web and software development.",
    },
    {
      name: "Tech Seminars",
      nameBn: "টেক সেমিনার",
      slug: "tech-seminars",
      description: "Keynote tech sessions, career roadmaps and industry insights.",
    },
  ]

  const categoryMap = new Map<string, string>()

  for (const cat of categoriesData) {
    const existing = await prisma.category.findUnique({
      where: {
        type_slug: {
          type: "EVENT",
          slug: cat.slug,
        },
      },
    })

    if (existing) {
      categoryMap.set(cat.slug, existing.id)
    } else {
      const created = await prisma.category.create({
        data: {
          type: "EVENT",
          name: cat.name,
          nameBn: cat.nameBn,
          slug: cat.slug,
          description: cat.description,
          isActive: true,
        },
      })
      categoryMap.set(cat.slug, created.id)
    }
  }

  console.log("Categories ensured.")

  // Current base dates
  const now = new Date()

  const eventsData = [
    {
      title: "Intro to Competitive Programming & Codeforces Setup",
      titleBn: "কম্পিটিটিভ প্রোগ্রামিং পরিচিতি ও কোডফোর্সেস সেটআপ",
      slug: "intro-to-competitive-programming",
      excerpt:
        "A beginner-friendly session on competitive programming fundamentals, Codeforces setup, time complexity analysis, and solving your first rated problems.",
      excerptBn:
        "বিগিনার-বান্ধব এই সেশনে কম্পিটিটিভ প্রোগ্রামিংয়ের মূল ধারণা, কোডফোর্সেস প্ল্যাটফর্ম সেটআপ এবং প্রথম রেটেড প্রবলেম সলভ করার দিকনির্দেশনা দেওয়া হবে।",
      content: `### Welcome to Competitive Programming!

Are you eager to level up your algorithmic thinking and prepare for ICPC or National Collegiate contests? This hands-on workshop is curated specifically for diploma students who want to embark on their competitive coding journey.

#### What you will learn:
- **Foundations**: Why problem solving is the bedrock of software engineering.
- **Environment**: Setting up VS Code, GCC, and fast I/O templates for C++.
- **Platforms**: Registering and navigating Codeforces, VJudge, and AtCoder.
- **Core Concepts**: Time & Space Complexity ($O(1)$ to $O(N \\log N)$), prefix sums, two pointers, and basic binary search.
- **Live Practice**: We will solve 3 beginner problems together step-by-step.

#### Prerequisites:
- Basic C or C++ knowledge (loops, conditions, arrays, functions).
- Bring your own laptop with charger.`,
      contentBn: `### কম্পিটিটিভ প্রোগ্রামিংয়ে স্বাগতম!

আপনার অ্যালগরিদমিক চিন্তা এবং সমস্যা সমাধানের দক্ষতা বাড়ানোর জন্য এই কর্মশালাটি বিশেষভাবে সাজানো হয়েছে।

#### যা যা শিখবেন:
- **মৌলিক ভিত্তি**: সফটওয়্যার ইঞ্জিনিয়ারিংয়ে সমস্যা সমাধানের গুরুত্ব।
- **এনভায়রনমেন্ট**: C++ এর জন্য VS Code সেটআপ ও ফাস্ট I/O টেমপ্লেট।
- **প্ল্যাটফর্ম পরিচিতি**: Codeforces, VJudge এবং AtCoder এর ব্যবহার।
- **লাইভ প্র্যাকটিস**: ৩টি বিগিনার প্রবলেম একসাথে সমাধান করা হবে।`,
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
      eventType: EventType.IN_PERSON,
      status: EventStatus.UPCOMING,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      venue: "Computer Lab 301, Dhaka Polytechnic Institute",
      venueBn: "কম্পিউটার ল্যাব ৩০১, ঢাকা পলিটেকনিক ইনস্টিটিউট",
      locationMapUrl: "https://maps.google.com/?q=Dhaka+Polytechnic+Institute",
      categorySlug: "competitive-programming",
      tags: ["competitive-programming", "c++", "codeforces", "algorithms"],
      isFeatured: true,
      isRegistrationOpen: true,
      isFree: true,
      registrationFee: 0,
      maxParticipants: 40,
      guestSpeakers: [
        {
          name: "Tahmid Hassan",
          nameBn: "তাহমিদ হাসান",
          role: "Competitive Programmer & Mentor",
          roleBn: "কম্পিটিটিভ প্রোগ্রামার ও মেন্টর",
          company: "DPI Computing Society",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
          bio: "Specialist on Codeforces with 1000+ problems solved across multiple online judges.",
        },
      ],
    },
    {
      title: "DPI Hackathon 2026: Innovate for Society",
      titleBn: "ডিপিআই হ্যাকাথন ২০২৬: ইনোভেট ফর সোসাইটি",
      slug: "dpi-hackathon-2026",
      excerpt:
        "A 24-hour national hackathon where teams of 3–4 compete to build impactful software solutions for smart campus, climate tech, and education.",
      excerptBn:
        "২৪ ঘণ্টার জাতীয় হ্যাকাথন যেখানে ৩–৪ জনের দল স্মার্ট ক্যাম্পাস, ক্লাইমেট টেক এবং শিক্ষার জন্য উদ্ভাবনী সফটওয়্যার সমাধান তৈরি করতে প্রতিদ্বন্দ্বিতা করবে।",
      content: `## Build the Future in 24 Hours

Join the biggest student hackathon in the polytechnic community! Bring your team, pitch bold ideas, write clean code, and demo your product before leading industry CTOs.

### Tracks & Themes
1. **Smart Campus & Education Tech**: Modern portals, LMS enhancements, lab automation.
2. **Climate & Green ICT**: Carbon tracking, energy awareness, renewable integration.
3. **Open Innovation**: Any problem that tackles public benefit or productivity.

### Prize Pool
- **Champion**: ৳ 25,000 + Trophy + Crests
- **1st Runner Up**: ৳ 15,000 + Crests
- **2nd Runner Up**: ৳ 10,000 + Crests

Food, high-speed Wi-Fi, mentorship clinics, and swag bags provided for all participants!`,
      contentBn: `## ২৪ ঘণ্টায় তৈরি করুন ভবিষ্যৎ

পলিটেকনিক কমিউনিটির সবচেয়ে বড় স্টুডেন্ট হ্যাকাথনে যোগ দিন! আপনার টিম নিয়ে আসুন, নতুন আইডিয়া বাস্তবায়ন করুন এবং অভিজ্ঞ বিচারকদের সামনে প্রজেক্ট উপস্থাপন করুন।`,
      coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
      eventType: EventType.HYBRID,
      status: EventStatus.UPCOMING,
      startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // +20 days
      endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      venue: "Main Auditorium, Dhaka Polytechnic Institute",
      venueBn: "কেন্দ্রীয় মিলনায়তন, ঢাকা পলিটেকনিক ইনস্টিটিউট",
      locationMapUrl: "https://maps.google.com/?q=Dhaka+Polytechnic+Institute",
      onlineJoinUrl: "https://discord.gg/dpi-hackathon",
      categorySlug: "hackathons",
      tags: ["hackathon", "innovation", "react", "nextjs", "team"],
      isFeatured: true,
      isRegistrationOpen: true,
      isFree: false,
      registrationFee: 200,
      maxParticipants: 100,
      guestSpeakers: [
        {
          name: "Tanvir Ahmed",
          nameBn: "তানভীর আহমেদ",
          role: "Senior Staff Engineer",
          roleBn: "সিনিয়র স্টাফ ইঞ্জিনিয়ার",
          company: "Pathao",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
          bio: "Hackathon veteran and tech lead passionate about scalable distributed systems.",
        },
        {
          name: "Sadia Rahman",
          nameBn: "সাদিয়া রহমান",
          role: "Product Designer & Mentor",
          roleBn: "প্রোডাক্ট ডিজাইনার ও মেন্টর",
          company: "ShopUp",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
          bio: "Specializes in UX prototyping, design systems and design sprints.",
        },
      ],
    },
    {
      title: "Web Dev Bootcamp: Modern Fullstack with Next.js & PostgreSQL",
      titleBn: "ওয়েব ডেভ বুটক্যাম্প: নেক্সট জেএস ও পোস্টগ্রেসকিউএল",
      slug: "web-dev-bootcamp-nextjs",
      excerpt:
        "An intensive weekend bootcamp covering Next.js App Router, React Server Components, Prisma ORM, and authentications from scratch.",
      excerptBn:
        "উইকএন্ডের নিবিড় বুটক্যাম্প যেখানে Next.js App Router, Server Components, Prisma ORM এবং সিকিউর অথেন্টিকেশন স্ক্র্যাচ থেকে শেখানো হবে।",
      content: `### Build Full-Stack Apps Confidently

Master the tools used by global tech startups. In this two-day immersive weekend sprint, you will build and deploy a complete production-ready application.

#### What will be covered:
- TypeScript for modern React development.
- Next.js 16 App Router architecture and Server Actions.
- Relational schema design with PostgreSQL and Prisma 7.
- Authentication patterns (Credentials, OAuth, Session cookies).
- Responsive UI crafting with Tailwind CSS and Radix/shadcn primitives.
- Cloud deployment on Vercel and Neon Serverless.`,
      contentBn: `### পূর্ণাঙ্গ ফুলস্ট্যাক ওয়েব অ্যাপ্লিকেশন তৈরি করুন

বর্তমান সময়ের সবচেয়ে জনপ্রিয় প্রযুক্তিগুলো ব্যবহার করে দুই দিনের নিবিড় প্রশিক্ষণে তৈরি করুন আপনার নিজের প্রজেক্ট।`,
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
      eventType: EventType.IN_PERSON,
      status: EventStatus.UPCOMING,
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 days
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      venue: "Computer Lab 302, Dhaka Polytechnic Institute",
      venueBn: "কম্পিউটার ল্যাব ৩০২, ঢাকা পলিটেকনিক ইনস্টিটিউট",
      categorySlug: "bootcamps",
      tags: ["nextjs", "react", "postgresql", "prisma", "typescript"],
      isFeatured: true,
      isRegistrationOpen: true,
      isFree: true,
      registrationFee: 0,
      maxParticipants: 35,
      guestSpeakers: [
        {
          name: "Nahid Hasan",
          nameBn: "নাহিদ হাসান",
          role: "Fullstack Web Engineer",
          roleBn: "ফুলস্ট্যাক ওয়েব ইঞ্জিনিয়ার",
          company: "Brain Station 23",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
          bio: "Specialist in React architectures and cloud-native Node.js applications.",
        },
      ],
    },
    {
      title: "Mastering Git, GitHub & Open Source Collaboration",
      titleBn: "গিট, গিটহাব ও ওপেন সোর্স কলাবোরেশন মাস্টারক্লাস",
      slug: "mastering-git-and-github",
      excerpt:
        "Learn professional version control, resolving merge conflicts, crafting meaningful pull requests, and contributing to open source repositories.",
      excerptBn:
        "প্রফেশনাল ভার্সন কন্ট্রোল, মার্জ কনফ্লিক্ট সমাধান, পুল রিকোয়েস্ট তৈরি এবং ওপেন সোর্স প্রজেক্টে কনট্রিবিউট করার নিয়ম জানুন।",
      content: `### Level Up Your Developer Workflow

Git is the universal language of software teams. This online interactive masterclass will guide you through branching strategies, interactive rebasing, SSH keys, and building an impressive GitHub profile that recruiters notice.

Live demo will guide participants to make their first pull request to an active repository!`,
      contentBn: `### সফটওয়্যার টিমওয়ার্কের মূল চাবিকাঠি গিট

গিট ব্রাঞ্চিং, মার্জিং, পিআর এবং গিটহাব প্রোফাইল সমৃদ্ধ করার উপায় নিয়ে সরাসরি অনলাইন সেশন।`,
      coverImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&auto=format&fit=crop&q=80",
      eventType: EventType.ONLINE,
      status: EventStatus.UPCOMING,
      startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // +4 days
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      onlineJoinUrl: "https://meet.google.com/dpi-cs-git",
      categorySlug: "workshops",
      tags: ["git", "github", "open-source", "collaboration"],
      isFeatured: false,
      isRegistrationOpen: true,
      isFree: true,
      registrationFee: 0,
      maxParticipants: 100,
      guestSpeakers: [
        {
          name: "Farhan Kabir",
          nameBn: "ফারহান কবির",
          role: "DevOps & Cloud Engineer",
          roleBn: "ডেভঅপস ও ক্লাউড ইঞ্জিনিয়ার",
          company: "Optimizely",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
          bio: "Open source contributor and cloud automation advocate.",
        },
      ],
    },
    {
      title: "Artificial Intelligence & Machine Learning Roadmaps for Polytechnic Students",
      titleBn: "পলিটেকনিক শিক্ষার্থীদের জন্য এআই ও মেশিন লার্নিং রোডম্যাপ",
      slug: "ai-and-ml-roadmap-seminar",
      excerpt:
        "Understand real-world AI applications, essential mathematics, Python data science ecosystems, and career paths in Machine Learning.",
      excerptBn:
        "বাস্তব জীবনের এআই অ্যাপ্লিকেশন, প্রয়োজনীয় গণিত, পাইথন ডেটা সায়েন্স ইকোসিস্টেম এবং মেশিন লার্নিং ক্যারিয়ার গাইডলাইন।",
      content: `### Navigating the AI Revolution

AI is transforming every industry. What does it take for a computing student to build practical machine learning capabilities?

#### Topics Discussed:
- Classical Machine Learning vs Modern Deep Learning & LLMs.
- Mathematics you actually need (Linear Algebra & Calculus decoded).
- Python toolkit: NumPy, Pandas, Scikit-learn, PyTorch.
- Building hands-on showcase projects to stand out.
- Q&A session with industry practitioners.`,
      contentBn: `### এআই বিপ্লব ও আপনার প্রস্তুতি

আধুনিক বিশ্বে এআই এর গুরুত্ব এবং পলিটেকনিক শিক্ষার্থীরা কীভাবে এই ফিল্ডে ক্যারিয়ার গড়তে পারে তার বিস্তারিত রোডম্যাপ।`,
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80",
      eventType: EventType.IN_PERSON,
      status: EventStatus.UPCOMING,
      startDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // +28 days
      endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      venue: "Auditorium Room 204, Dhaka Polytechnic Institute",
      venueBn: "মিলনায়তন কক্ষ ২০৪, ঢাকা পলিটেকনিক ইনস্টিটিউট",
      categorySlug: "tech-seminars",
      tags: ["ai", "machine-learning", "python", "data-science"],
      isFeatured: false,
      isRegistrationOpen: true,
      isFree: true,
      registrationFee: 0,
      maxParticipants: 80,
      guestSpeakers: [
        {
          name: "Dr. Kazi Mahfuz",
          nameBn: "ড. কাজী মাহফুজ",
          role: "AI Researcher",
          roleBn: "এআই গবেষক",
          company: "BRAC University",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
          bio: "Specialist in natural language processing and computer vision.",
        },
      ],
    },
    {
      title: "Winter Inter-Polytechnic Programming Contest 2025 (Recap)",
      titleBn: "উইন্টার ইন্টার-পলিটেকনিক প্রোগ্রামিং প্রতিযোগিতা ২০২৫",
      slug: "winter-programming-contest-2025",
      excerpt:
        "Over 60 teams from 12 polytechnic institutes competed in a 4-hour high-intensity algorithmic showdown.",
      excerptBn:
        "১২টি পলিটেকনিক ইনস্টিটিউট থেকে ৬০টিরও বেশি দল ৪ ঘণ্টার তীব্র প্রতিযোগিতায় অংশ নিয়েছিল।",
      content: `### Contest Recap & Highlights

The Winter Inter-Polytechnic Programming Contest (WIPPC) 2025 brought together brilliant young problem solvers from all over the country.

Congratulations to team **DPI CodeBreakers** for claiming the Championship trophy after solving 7 out of 9 problems within 3 hours and 20 minutes!

We express our gratitude to the advisors, faculty mentors, and volunteer wings for making this milestone event a roaring success.`,
      contentBn: `### প্রতিযোগিতার সারসংক্ষেপ

দেশজুড়ে পলিটেকনিক শিক্ষার্থীদের স্বতঃস্ফূর্ত অংশগ্রহণে অনুষ্ঠিত হলো উইন্টার প্রোগ্রামিং কনটেস্ট ২০২৫। বিজয়ী দলগুলোকে আন্তরিক অভিনন্দন!`,
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
      eventType: EventType.IN_PERSON,
      status: EventStatus.COMPLETED,
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // -60 days
      endDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      venue: "Central Auditorium, DPI",
      venueBn: "কেন্দ্রীয় মিলনায়তন, ডিপিআই",
      categorySlug: "competitive-programming",
      tags: ["contest", "icpc", "awards", "bteb"],
      isFeatured: false,
      isRegistrationOpen: false,
      isFree: true,
      registrationFee: 0,
      maxParticipants: 90,
      guestSpeakers: [],
    },
  ]

  for (const item of eventsData) {
    const categoryId = categoryMap.get(item.categorySlug) ?? null

    const event = await prisma.event.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        titleBn: item.titleBn,
        excerpt: item.excerpt,
        excerptBn: item.excerptBn,
        content: item.content,
        contentBn: item.contentBn,
        coverImage: item.coverImage,
        eventType: item.eventType,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        registrationDeadline: item.registrationDeadline,
        venue: item.venue,
        venueBn: item.venueBn,
        locationMapUrl: item.locationMapUrl,
        onlineJoinUrl: item.onlineJoinUrl,
        categoryId,
        tags: item.tags,
        isFeatured: item.isFeatured,
        isRegistrationOpen: item.isRegistrationOpen,
        isFree: item.isFree,
        registrationFee: item.registrationFee,
        maxParticipants: item.maxParticipants,
        guestSpeakers: item.guestSpeakers,
        authorId: adminUser.id,
      },
      create: {
        title: item.title,
        titleBn: item.titleBn,
        slug: item.slug,
        excerpt: item.excerpt,
        excerptBn: item.excerptBn,
        content: item.content,
        contentBn: item.contentBn,
        coverImage: item.coverImage,
        eventType: item.eventType,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        registrationDeadline: item.registrationDeadline,
        venue: item.venue,
        venueBn: item.venueBn,
        locationMapUrl: item.locationMapUrl,
        onlineJoinUrl: item.onlineJoinUrl,
        categoryId,
        tags: item.tags,
        isFeatured: item.isFeatured,
        isRegistrationOpen: item.isRegistrationOpen,
        isFree: item.isFree,
        registrationFee: item.registrationFee,
        maxParticipants: item.maxParticipants,
        guestSpeakers: item.guestSpeakers,
        authorId: adminUser.id,
      },
    })

    console.log(`Event created/updated: ${event.title} (${event.slug})`)

    // Add some sample registrations for upcoming events
    if (item.status === EventStatus.UPCOMING) {
      const sampleAttendees = [
        {
          name: "Sabbir Hossain",
          email: "sabbir.cs@dpi.edu.bd",
          phone: "01711223344",
          studentId: "712891",
          department: Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
          semester: Semester.SIXTH,
          shift: Shift.MORNING,
          status: EventRegistrationStatus.CONFIRMED,
          ticketCode: `EVT-SAB-${Math.floor(1000 + Math.random() * 9000)}`,
        },
        {
          name: "Mst. Rina Akter",
          email: "rina.akter@dpi.edu.bd",
          phone: "01812334455",
          studentId: "713402",
          department: Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
          semester: Semester.FOURTH,
          shift: Shift.DAY,
          status: EventRegistrationStatus.CONFIRMED,
          ticketCode: `EVT-RIN-${Math.floor(1000 + Math.random() * 9000)}`,
        },
        {
          name: "Arifur Rahman",
          email: "arif.electrical@dpi.edu.bd",
          phone: "01999887766",
          studentId: "714520",
          department: Department.ELECTRICAL_TECHNOLOGY,
          semester: Semester.SIXTH,
          shift: Shift.MORNING,
          status: EventRegistrationStatus.PENDING,
          ticketCode: `EVT-ARI-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      ]

      for (const attendee of sampleAttendees) {
        const existingReg = await prisma.eventRegistration.findFirst({
          where: {
            eventId: event.id,
            email: attendee.email,
          },
        })

        if (!existingReg) {
          await prisma.eventRegistration.create({
            data: {
              eventId: event.id,
              name: attendee.name,
              email: attendee.email,
              phone: attendee.phone,
              studentId: attendee.studentId,
              department: attendee.department,
              semester: attendee.semester,
              shift: attendee.shift,
              institution: "Dhaka Polytechnic Institute",
              status: attendee.status,
              ticketCode: attendee.ticketCode,
              paymentMethod: item.isFree ? null : PaymentMethod.BKASH,
              amountPaid: item.isFree ? 0 : item.registrationFee,
              transactionId: item.isFree ? null : "TRX882910AA",
              senderNumber: item.isFree ? null : attendee.phone,
              confirmedAt: attendee.status === EventRegistrationStatus.CONFIRMED ? new Date() : null,
            },
          })
        }
      }
    }
  }

  console.log("Seeding completed successfully!")
}

seedEvents()
  .catch((e) => {
    console.error("Error seeding events:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
