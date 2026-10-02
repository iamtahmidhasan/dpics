import "dotenv/config"

import prisma from "../src/lib/prisma"
import { estimateReadingMinutes } from "../src/lib/markdown"
import { PostStatus } from "../src/generated/prisma/enums"

async function seedPosts() {
  console.log("Seeding 10 full-size bilingual posts...")

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  })

  if (users.length === 0) {
    throw new Error("No users found in database to author posts.")
  }

  const adminUser = users.find((u) => u.email === "hassantahmid96@gmail.com") || users[0]
  const memberUser1 = users.find((u) => u.email === "tahmidhasanpro@gmail.com") || users[0]
  const instructor1 = users.find((u) => u.email === "x@example.com") || users[0]
  const instructor2 = users.find((u) => u.email === "killwin045@gmail.com") || users[0]
  const memberUser2 = users.find((u) => u.email === "plain-test@example.com") || users[0]

  const categories = await prisma.category.findMany({
    where: { type: "POST" },
  })

  const getCatId = (slug: string) => {
    const found = categories.find((c) => c.slug === slug)
    return found ? found.id : categories[0]?.id
  }

  const postsData = [
    {
      title: "Building Scalable RESTful APIs with Node.js and TypeScript in 2026",
      titleBn: "২০২৬ সালে Node.js এবং TypeScript দিয়ে স্কেলেবল RESTful API তৈরি",
      slug: "building-scalable-restful-apis-nodejs-typescript",
      authorId: adminUser.id,
      categoryId: getCatId("tutorial"),
      isFeatured: true,
      tags: ["Node.js", "TypeScript", "Backend", "API Architecture"],
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
      excerpt: "A comprehensive production-grade blueprint for architecting modular, type-safe REST APIs using Node.js, Express, TypeScript, and modern best practices.",
      excerptBn: "Node.js, Express এবং TypeScript ব্যবহার করে মডুলার ও টাইপ-সেফ প্রোডাকশন-গ্রেড REST API আর্কিটেকচার তৈরির একটি সম্পূর্ণ ও বিস্তারিত গাইড।",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      content: `## Introduction

Building backend services that survive high user concurrency requires more than just knowing how to route an HTTP request. In modern software engineering, **type safety**, **separation of concerns**, and **predictable error boundaries** are non-negotiable pillars.

In this full-scale tutorial, we will build a clean-architecture REST API from scratch using TypeScript and Node.js.

---

## 1. Project Architecture Overview

We advocate for the **Controller-Service-Repository (CSR)** layer pattern:

- **Routing Layer**: Validates incoming request shapes and extracts query/path parameters.
- **Controller Layer**: Orchestrates HTTP response codes, headers, and serialization.
- **Service Layer**: Pure business logic without HTTP concepts.
- **Repository / Data Access Layer**: Directly interacts with the database (ORM / SQL client).

\`\`\`
Client Request
      │
      ▼
┌───────────────┐
│ Express Router│ ── (Schema Validation via Zod)
└───────┬───────┘
        ▼
┌───────────────┐
│  Controllers  │ ── (Status codes & HTTP Response)
└───────┬───────┘
        ▼
┌───────────────┐
│   Services    │ ── (Domain logic & Transactions)
└───────┬───────┘
        ▼
┌───────────────┐
│  Repository   │ ── (Prisma / Database queries)
└───────────────┘
\`\`\`

---

## 2. Setting Up Strict TypeScript Configuration

A robust \`tsconfig.json\` eliminates entire classes of runtime exceptions before deployment:

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
\`\`\`

---

## 3. Implementing the Centralized Error Handler

Leaking stack traces or unstructured errors degrades client integration and compromises security. Here is how we define a standard domain error:

\`\`\`typescript
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> | null = null
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new AppError(400, "BAD_REQUEST", message, details ?? null);
  }

  static notFound(message = "Resource not found") {
    return new AppError(404, "NOT_FOUND", message);
  }

  static internal(message = "An unexpected error occurred") {
    return new AppError(500, "INTERNAL_ERROR", message);
  }
}
\`\`\`

And the Express global middleware:

\`\`\`typescript
import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error("Unhandled Exception:", err);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error. Please try again later.",
    },
  });
}
\`\`\`

---

## 4. Validating Requests with Schema Guards

Never trust user input. By pairing Zod with TypeScript, we achieve runtime validation with compile-time type inference:

\`\`\`typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  role: z.enum(["MEMBER", "INSTRUCTOR"]).default("MEMBER"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
\`\`\`

---

## 5. Performance Best Practices

1. **Connection Pooling**: Always tune your database connection pool limits. A microservice container should never open 100 simultaneous connections.
2. **Compression & Rate Limiting**: Enable \`compression\` middleware and protect sensitive routes with token buckets.
3. **Structured Logging**: Replace \`console.log\` with Pino or Winston formatting in JSON for seamless ingestion into Datadog or Grafana Loki.

## Conclusion

By enforcing the Controller-Service architecture, using strict TypeScript boundaries, and handling errors defensively, your API remains maintainable and ready for heavy production workloads. Happy coding!`,
      contentBn: `## ভূমিকা

উচ্চ ট্রাফিক এবং বড় কনকারেন্সি হ্যান্ডেল করতে পারে এমন ব্যাকএন্ড সার্ভিস তৈরি করতে কেবল সাধারণ এইচটিটিপি রাউটিং জানাই যথেষ্ট নয়। আধুনিক সফটওয়্যার ইঞ্জিনিয়ারিংয়ে **টাইপ সেফটি (Type Safety)**, **কনসার্ন পৃথকীকরণ (Separation of Concerns)** এবং **পূর্বানুমানযোগ্য এরর হ্যান্ডলিং (Predictable Error Handling)** অপরিহার্য।

এই বিস্তারিত টিউটোরিয়ালে আমরা স্ক্র্যাচ থেকে Node.js এবং TypeScript দিয়ে একটি ক্লিন আর্কিটেকচার RESTful API তৈরি করার পদ্ধতি শিখব।

---

## ১. প্রজেক্ট আর্কিটেকচার ওভারভিউ

আমরা **Controller-Service-Repository (CSR)** আর্কিটেকচারাল প্যাটার্ন অনুসরণ করব:

- **রাউটিং লেয়ার**: রিকোয়েস্টের ইনকামিং শেপ যাচাই করে এবং প্যারামিটারগুলো আলাদা করে।
- **কন্ট্রোলার লেয়ার**: এইচটিটিপি রেসপন্স কোড, হেডার এবং ডেটা সিরিয়ালাইজেশন নিয়ন্ত্রণ করে।
- **সার্ভিস লেয়ার**: বিশুদ্ধ বিজনেস লজিক, যেখানে কোনো এইচটিটিপি সংক্রান্ত কোড থাকে না।
- **রিপোজিটরি লেয়ার**: সরাসরি ডাটাবেজের সাথে যোগাযোগ করে (Prisma বা SQL ক্লায়েন্ট)।

---

## ২. স্ট্রিক্ট টাইপস্ক্রিপ্ট কনফিগারেশন

একটি শক্তিশালী \`tsconfig.json\` কনফিগারেশন রানটাইম এরর প্রতিরোধে সাহায্য করে:

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "outDir": "./dist"
  }
}
\`\`\`

---

## ৩. সেন্ট্রালাইজড এরর হ্যান্ডলার তৈরি

সার্ভারের ভেতরের কোডের স্ট্যাকট্রেস সরাসরি ক্লায়েন্টের কাছে প্রকাশ করা নিরাপত্তার জন্য ক্ষতিকর। এর জন্য একটি স্ট্যান্ডার্ড \`AppError\` ক্লাস তৈরি করা প্রয়োজন:

\`\`\`typescript
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }

  static badRequest(message: string) {
    return new AppError(400, "BAD_REQUEST", message);
  }
}
\`\`\`

---

## ৪. রিকোয়েস্ট ভ্যালিডেশন (Zod)

ক্লায়েন্ট থেকে আসা ডেটা কখনোই যাচাই ছাড়া গ্রহণ করা উচিত নয়। Zod লাইব্রেরির মাধ্যমে আমরা রানটাইমে ডেটা ভ্যালিডেশন এবং একই সাথে টাইপস্ক্রিপ্ট টাইপ পেতে পারি।

## উপসংহার

ক্লিন আর্কিটেকচার এবং স্ট্রিক্ট টাইপস্ক্রিপ্ট ব্যবহারের মাধ্যমে আপনার অ্যাপ্লিকেশন দীর্ঘমেয়াদে সহজে রক্ষণাবেক্ষণযোগ্য এবং স্কেলযোগ্য হয়। নিয়মিত প্র্যাকটিস করুন এবং কোডের কোয়ালিটি বজায় রাখুন!`,
    },
    {
      title: "Deep Dive into Modern Database Indexing: B-Trees vs LSM-Trees",
      titleBn: "আধুনিক ডাটাবেস ইনডেক্সিং: B-Trees বনাম LSM-Trees",
      slug: "database-indexing-b-trees-vs-lsm-trees",
      authorId: instructor1.id,
      categoryId: getCatId("technical"),
      isFeatured: true,
      tags: ["Database", "PostgreSQL", "Data Structures", "Storage Engines"],
      coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1200&auto=format&fit=crop",
      excerpt: "Explore the internal mechanics, write amplification, and latency profiles of B+ Trees in relational databases versus Log-Structured Merge Trees in modern distributed stores.",
      excerptBn: "রিলেশনাল ডাটাবেসের B+ Trees এবং আধুনিক ডিস্ট্রিবিউটেড স্টোরেজের LSM-Trees এর অভ্যন্তরীণ গঠন, রাইট অ্যামপ্লিফিকেশন এবং পারফরম্যান্সের তুলনামূলক বিশ্লেষণ।",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      content: `## The Core Database Dilemma: Reads vs Writes

At the heart of every storage engine lies an engineering trade-off: **How do we make search fast without making insertions prohibitively expensive?**

A raw append-only log achieves optimal write throughput ($O(1)$ writes), but reading requires a full table scan ($O(N)$ reads). Conversely, keeping an array sorted enables $O(\\log N)$ binary search, but inserting an item at the beginning requires moving all $N$ elements ($O(N)$ writes).

To solve this, modern databases leverage two dominant data structures:
1. **B-Trees (specifically B+ Trees)**: Powering PostgreSQL, MySQL (InnoDB), and SQLite.
2. **LSM-Trees (Log-Structured Merge Trees)**: Powering RocksDB, Cassandra, ScyllaDB, and ClickHouse.

---

## 1. Anatomy of B+ Trees

In a B+ Tree, every node is sized to match one disk block (typically 4KB or 8KB). 

### Key Characteristics:
- **Balanced Depth**: All leaf nodes reside at the exact same depth.
- **High Fan-out**: Each interior node can hold hundreds of keys, keeping tree height extremely shallow ($3-4$ levels for billions of records).
- **Sequential Leaf Chaining**: Leaf nodes are linked via doubly linked lists, making range queries like \`WHERE age BETWEEN 20 AND 30\` exceptionally fast.

\`\`\`
             [ 50 | 100 ]
           /      |       \\
   [ 10 | 30 ] [ 60 | 80 ] [ 120 | 150 ]
        │           │             │
  Leaves: [1..49] <-> [50..99] <-> [100..200]
\`\`\`

### The Bottleneck: Random I/O and Write Amplification
Updating a row in a B-Tree requires an *in-place overwrite*. If the targeted leaf page is not in the RAM buffer pool, the database must perform a random disk seek to fetch the page, modify it, and flush it back. 

---

## 2. Anatomy of LSM-Trees (Log-Structured Merge Trees)

LSM-Trees completely eliminate random writes by turning all mutations into sequential appends.

### Structural Components:
1. **WAL (Write-Ahead Log)**: Appended sequentially on disk for crash recovery.
2. **MemTable**: An in-memory sorted data structure (typically a SkipList or Red-Black Tree).
3. **SSTables (Sorted String Tables)**: Immutable, sorted files persisted on disk across generational levels ($L_0, L_1, L_2$).
4. **Bloom Filters**: Probabilistic bit arrays that verify if a key definitely does NOT exist in an SSTable before performing any disk I/O.

\`\`\`
Writes ──> [ Write-Ahead Log ] (Sequential Disk)
   │
   ▼
[ MemTable (RAM) ] ── (Flushed when full) ──> [ SSTable Level 0 ]
                                                       │
                                                 (Compaction)
                                                       ▼
                                             [ SSTable Level 1 ]
\`\`\`

---

## 3. Comparison Matrix

| Feature | B+ Tree (Postgres/MySQL) | LSM-Tree (RocksDB/Cassandra) |
| :--- | :--- | :--- |
| **Write Performance** | Moderate (Random writes) | High (Sequential appends) |
| **Read Performance** | Ultra-Fast ($O(\\log N)$ point lookups) | Variable (Checks MemTable + SSTables) |
| **Range Queries** | Excellent (Linked leaves) | Good (Iterates across SSTable iterators) |
| **Space Overhead** | Suffers from page fragmentation | Highly compressed, no internal fragmentation |
| **Best Used For** | OLTP, Read-heavy web apps | Telemetry, Timeseries, Big Data logging |

---

## Conclusion

Understanding the storage engine underneath your database enables you to make informed infrastructure decisions. If your workload is $80\\%$ reads, traditional B+ Trees in Postgres deliver unmatched latency. If you are handling millions of sensor writes per second, an LSM-Tree architecture will maximize hardware efficiency.`,
      contentBn: `## ডাটাবেসের মূল দ্বন্দ্ব: রিড বনাম রাইট পারফরম্যান্স

প্রতিটি ডাটাবেস স্টোরেজ ইঞ্জিনের মূলে একটি প্রকৌশলগত ভারসাম্য (Trade-off) কাজ করে: **নতুন ডেটা ইনসার্ট করার গতি ব্যাহত না করে কীভাবে সার্চিং দ্রুততম করা যায়?**

যদি আমরা শুধুই একটি অ্যাপেন্ড-অনলি ফাইলে ডেটা লিখি, তবে লেখার গতি সবচেয়ে বেশি হবে ($O(1)$), কিন্তু সার্চ করার জন্য পুরো ফাইল স্ক্যান করতে হবে ($O(N)$)। অন্যদিকে ডেটা সবসময় সর্টেড রাখলে খোঁজা সহজ হলেও লেখার সময় পুরো ডেটা রিশাফেল করতে হয়।

এই সমস্যার সমাধানে আধুনিক ডাটাবেসগুলো প্রধানত দুটি ডেটা স্ট্রাকচার ব্যবহার করে:
১. **B-Trees (বিশেষত B+ Tree)**: PostgreSQL, MySQL, এবং SQLite-এ ব্যবহৃত হয়।
২. **LSM-Trees (Log-Structured Merge Trees)**: RocksDB, Cassandra, এবং ClickHouse-এ ব্যবহৃত হয়।

---

## ১. B+ Trees এর কার্যপ্রণালী

B+ Tree তে প্রতিটি নোডের সাইজ ডিস্ক পেজ সাইজের (৪ বা ৮ কিলোবাইট) সাথে মিলিয়ে রাখা হয়। এর ফলে ডিস্ক থেকে পেজ রিড করার সময় ইনপুট-আউটপুট এফিশিয়েন্সি অনেক বেড়ে যায়। সমস্ত লিফ নোড ডাবল-লিঙ্কড লিস্ট দিয়ে যুক্ত থাকায় রেঞ্জ কুয়েরি (Range Query) অত্যন্ত দ্রুত গতিতে সম্পন্ন হয়।

---

## ২. LSM-Trees এর গঠন

LSM-Tree কোনো ইন-প্লেস ওভাররাইট করে না। এটি যেকোনো রাইট অপারেশনকে ক্রমান্বয়ে সিকোয়েন্সিয়ালি মেমরিতে (MemTable) এবং ডিস্কের ট্রানজ্যাকশন লগে লেখে। পরবর্তীতে মেমরি পূর্ণ হলে এটি ব্যাকগ্রাউন্ডে কমপ্যাকশন (Compaction) প্রক্রিয়ায় ডিস্কের বিভিন্ন লেভেলে সাজিয়ে রাখে। ফলে ভারী রাইট-ইনটেনসিভ অ্যাপ্লিকেশনে এর গতি অসাধারণ।

## উপসংহার

আপনার প্রজেক্টের ওয়ার্কলোড বুঝে ডাটাবেস নির্বাচন করা একটি ভালো সফটওয়্যার আর্কিটেকচারের অন্যতম লক্ষণ।`,
    },
    {
      title: "DPI Computing Society Wins National Hackathon Championship 2026",
      titleBn: "ডিপিআই কম্পিউটিং সোসাইটির জাতীয় হ্যাকাথন চ্যাম্পিয়নশিপ ২০২৬ জয়",
      slug: "dpics-wins-national-hackathon-championship-2026",
      authorId: memberUser1.id,
      categoryId: getCatId("achievement"),
      isFeatured: true,
      tags: ["Hackathon", "Achievement", "Community", "AI Innovation"],
      coverImage: "/hackathon.jpg",
      excerpt: "Our competitive dev team, Team PolyInnovate, clinched 1st place among 64 polytechnic and university teams at the National Student Innovation Hackathon 2026.",
      excerptBn: "জাতীয় স্টুডেন্ট ইনোভেশন হ্যাকাথন ২০২৬-এ ৬৪টি পলিটেকনিক ও বিশ্ববিদ্যালয়ের টিমকে পেছনে ফেলে ১ম স্থান অর্জন করেছে ডিপিআই কম্পিউটিং সোসাইটির 'টিম পলিইনোভেশন'!",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      content: `## A Proud Milestone for Dhaka Polytechnic Institute

We are beyond thrilled to announce that **Team PolyInnovate**, representing Dhaka Polytechnic Institute Computing Society (DPICS), has secured **Champion (1st Place)** at the prestigious **National Student Innovation Hackathon 2026**!

Over the course of an intense 36-hour sprint, our team competed against 64 finalist teams from top engineering universities and polytechnics across the country.

---

## The Winning Solution: AgriSense AI

The theme of this year's hackathon was *Sustainable Technological Solutions for Emerging Economies*. Our team built **AgriSense AI**, an offline-first IoT and edge computer vision solution tailored for rural Bangladeshi farmers.

### Key Capabilities:
- **Offline Plant Disease Diagnosis**: Running an optimized MobileNet-V3 quantization model on Raspberry Pi 5 to detect paddy blast and potato blight without requiring an internet connection.
- **SMS & Voice Automated Alerts**: When disease thresholds are detected, localized Bengali voice alerts are sent via GSM module to registered farmers.
- **Solar-Powered Mesh Node**: Low-power consumption node lasting up to 14 days on a single lithium phosphate charge.

\`\`\`
[ Edge Camera / Sensors ]
           │
           ▼
[ Raspberry Pi Edge Model ] ── (Inference < 120ms)
           │
           ├─ (Alert Trigger) ──> [ GSM Modems ] ──> Bengali SMS / Voice Call
           │
           └─ (Telemetry Sync) ─> [ DPICS Cloud Sync ] ──> Public Dashboard
\`\`\`

---

## Team Roster

Congratulations to the brilliant minds behind this triumphant victory:
1. **Tahmid Hasan** — Systems Architect & Edge ML Pipeline
2. **Hassan Tahmid** — Full Stack Web Portal & Cloud Sync
3. **Rina Akter** — Embedded Hardware & Sensor Calibration
4. **Arman Hossain** — UI/UX & Bengali Accessibility Voice Interface

---

## Words from our Society President

> *"This victory is a testament to the dedication, technical depth, and collaborative spirit fostered within DPICS. Our students have proven that with perseverance and open-source collaboration, polytechnic engineers can lead the nation's tech frontier."*

Stay tuned for our upcoming open-source release of the AgriSense hardware and software repository!`,
      contentBn: `## ঢাকা পলিটেকনিক ইনস্টিটিউটের জন্য এক ঐতিহাসিক অর্জন

আমরা অত্যন্ত গর্বের সাথে জানাচ্ছি যে, ঢাকা পলিটেকনিক ইনস্টিটিউট কম্পিউটিং সোসাইটি (ডিপিসিএস)-এর প্রতিনিধিত্বকারী **'টিম পলিইনোভেশন'** মর্যাদাপূর্ণ **জাতীয় স্টুডেন্ট ইনোভেশন হ্যাকাথন ২০২৬**-এ **চ্যাম্পিয়ন (১ম স্থান)** অর্জন করেছে!

টানা ৩৬ ঘণ্টার এক শ্বাসরুদ্ধকর হ্যাকাথনে দেশের শীর্ষস্থানীয় ৬৪টি বিশ্ববিদ্যালয় ও পলিটেকনিক দলের সাথে প্রতিযোগিতা করে আমাদের দল এই সাফল্য ছিনিয়ে এনেছে।

---

## বিজয়ী প্রজেক্ট: এগ্রিসেন্স এআই (AgriSense AI)

হ্যাকাথনের মূল প্রতিপাদ্য ছিল *উন্নয়নশীল অর্থনীতির জন্য টেকসই প্রযুক্তিগত সমাধান*। আমাদের টিম তৈরি করেছে **AgriSense AI**, যা গ্রামীণ কৃষকদের ফসলের রোগ নির্ণয়ের জন্য একটি অফলাইন-ফার্স্ট আইওটি এবং এজ কম্পিউটার ভিশন সিস্টেম।

### প্রধান ফিচারসমূহ:
- **অফলাইন রোগ শনাক্তকরণ**: ইন্টারনেট সংযোগ ছাড়াই রাস্পবেরি পাইতে অপ্টিমাইজড এআই মডেল চালিয়ে ধানের ব্লাস্ট ও আলুর রোগ শনাক্তকরণ।
- **স্বয়ংক্রিয় বাংলা ভয়েস কল ও এসএমএস**: ফসলে রোগ দেখা দিলে তাৎক্ষণিকভাবে স্থানীয় ভাষায় কৃষকের সাধারণ ফোনে সতর্কবার্তা পাঠানো।
- **সৌরচালিত লো-পাওয়ার নোড**: একটানা দীর্ঘ সময় ব্যাটারি ব্যাকআপে কার্যকর থাকা।

---

## অভিনন্দন আমাদের মেধাবী টিমকে

১. **তাহমিদ হাসান** — সিস্টেমস আর্কিটেক্ট ও মেশিন লার্নিং
২. **হাসান তাহমিদ** — ফুল স্ট্যাক ওয়েব পোর্টাল ও সিঙ্ক
৩. **রিনা আক্তার** — এমবেডেড হার্ডওয়্যার ও সেন্সর
৪. **আরমান হোসেন** — বাংলা ভয়েস ইউজার ইন্টারফেস ও ডিজাইন

ডিপিসিএস-এর সকল সদস্য ও শুভানুধ্যায়ীদের আন্তরিক শুভেচ্ছা!`,
    },
    {
      title: "Hands-on Guide: Dockerizing Full-Stack Applications for Production",
      titleBn: "হ্যান্ডস-অন গাইড: প্রোডাকশনের জন্য ফুল-স্ট্যাক অ্যাপ্লিকেশন ডকারাইজেশন",
      slug: "hands-on-guide-dockerizing-fullstack-apps",
      authorId: instructor2.id,
      categoryId: getCatId("workshop"),
      isFeatured: false,
      tags: ["Docker", "DevOps", "Next.js", "Containerization"],
      coverImage: "/hero-tech.jpg",
      excerpt: "Step-by-step instructions on multi-stage builds, non-root user security, layer caching, and docker-compose configurations for modern web stacks.",
      excerptBn: "মাল্টি-স্টেজ বিল্ড, নন-রুট ইউজার সিকিউরিটি, লেয়ার ক্যাশিং এবং ডকার কম্পোজ কনফিগারেশনের মাধ্যমে আধুনিক ওয়েব স্ট্যাক ডকারাইজ করার হ্যান্ডস-অন গাইড।",
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      content: `## Why Containerization Matters

Deploying applications directly onto raw virtual machines often leads to the infamous *"it works on my machine"* syndrome. With Docker, we package the runtime, system libraries, configuration, and code into an immutable image that runs identically on local macOS, Ubuntu staging, or AWS ECS production.

In this workshop tutorial, we will write a production-ready, security-hardened **multi-stage Dockerfile** for a Next.js and Node.js application.

---

## 1. Multi-Stage Dockerfile Blueprint

Multi-stage builds allow us to use heavy compilation dependencies (Node headers, build tools, typescript) in a build stage, and copy *only the optimized production bundle* into the final execution image.

\`\`\`dockerfile
# -------------------------------------------------------------
# Stage 1: Dependency resolution & caching
# -------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# -------------------------------------------------------------
# Stage 2: Builder
# -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN corepack enable pnpm && pnpm run build

# -------------------------------------------------------------
# Stage 3: Minimal Production Runner
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Never run containers as root!
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
\`\`\`

---

## 2. Docker Compose for Local Development

To orchestrate your PostgreSQL database, Redis cache, and application simultaneously, use this \`docker-compose.yml\`:

\`\`\`yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://dpics_user:secret@postgres:5432/dpics_db
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: dpics_user
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: dpics_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dpics_user -d dpics_db"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
\`\`\`

---

## 3. Best Practices Checklist

- [x] **Use Alpine or Distroless base images** to reduce image attack surfaces and bandwidth (from 1GB down to ~80MB).
- [x] **Enforce Non-Root Users**: The \`USER nextjs\` directive prevents privilege escalation attacks inside the host kernel.
- [x] **Leverage .dockerignore**: Always ignore \`node_modules\`, \`.git\`, and local \`.env\` files!

Start containerizing your academic and client projects today to ensure clean and repeatable deployments.`,
      contentBn: `## কন্টেইনারাইজেশন কেন জরুরি?

সফটওয়্যার সরাসরি ভার্চুয়াল মেশিনে ডিপ্লয় করলে অনেক সময় এনভায়রনমেন্ট কনফিগারেশনের অমিলের কারণে সমস্যা দেখা দেয়। ডকারের (Docker) সাহায্যে আমরা অ্যাপ্লিকেশন রানটাইম, ডিপেনডেন্সি এবং কোডকে একটিমাত্র পোর্টেবল ইমেজে আবদ্ধ করে ফেলতে পারি।

এই ওয়ার্কশপ গাইডে আমরা মাল্টি-স্টেজ ডকারফাইল তৈরির বিস্তারিত পদ্ধতি দেখব।

---

## ১. মাল্টি-স্টেজ ডকারফাইল (Multi-Stage Dockerfile)

মাল্টি-স্টেজ বিল্ডের সুবিধা হলো, কোড বিল্ড করার জন্য যে সমস্ত হেভি প্যাকেজ প্রয়োজন তা শুধু বিল্ড স্টেজেই থাকে। ফাইনাল প্রোডাকশন ইমেজে শুধু এক্সিকিউটেবল ফাইল কপি করা হয়, যার ফলে ইমেজের আকার ১ জিবি থেকে কমে মাত্র ৮০ মেগাবাইটে নেমে আসে।

---

## ২. ডকার কম্পোজ (Docker Compose) দিয়ে লোকাল ডেভেলপমেন্ট

একটি অ্যাপ্লিকেশনের সাথে PostgreSQL ডাটাবেজ এবং অন্যান্য সার্ভিস সহজে এক কমান্ডে রান করার জন্য \`docker-compose.yml\` ফাইল ব্যবহার করা হয়।

## গুরুত্বপূর্ণ টিপস:
- কন্টেইনার কখনো \`root\` ইউজার হিসেবে চালাবেন না; সিকিউরিটির জন্য ডেডিকেটেড নন-রুট ইউজার তৈরি করুন।
- অপ্রয়োজনীয় ফাইল ডকার ইমেজে যাওয়া আটকাতে \`.dockerignore\` ব্যবহার করুন।`,
    },
    {
      title: "Announcing DPICS Winter Code Sprint 2026 and Competitive Boot Camp",
      titleBn: "ডিপিসিএস উইন্টার কোড স্প্রিন্ট ২০২৬ ও কম্পিটিটিভ প্রোগ্রামিং বুটক্যাম্প ঘোষণা",
      slug: "announcing-dpics-winter-code-sprint-2026",
      authorId: adminUser.id,
      categoryId: getCatId("announcement"),
      isFeatured: false,
      tags: ["Announcement", "Bootcamp", "Competitive Programming", "Algorithms"],
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
      excerpt: "Get ready for a 4-week rigorous training camp covering Data Structures, Dynamic Programming, and Graph Theory, culminating in our flagship Winter Code Sprint contest.",
      excerptBn: "ডাটা স্ট্রাকচার, ডায়নামিক প্রোগ্রামিং এবং গ্রাফ থিওরির ওপর ৪ সপ্তাহের বিশেষ প্রশিক্ষণ ক্যাম্প এবং গ্র্যান্ড উইন্টার কোড স্প্রিন্ট কনটেস্টে অংশ নিন।",
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      content: `## Elevate Your Problem-Solving Mastery

Dhaka Polytechnic Institute Computing Society is pleased to announce our flagship winter training program: **Winter Code Sprint & Competitive Boot Camp 2026**!

Whether you are aiming to crack ACM-ICPC preliminary rounds, qualify for national contests, or prepare for technical interviews at top engineering firms, this camp is structured to take your analytical abilities to the next level.

---

## Curriculum Overview

The bootcamp spans 4 intensive weeks, featuring live lectures, guided problem sessions, and weekly virtual mock contests:

### Week 1: Foundational Speed & Math
- Time and Space Complexity ($O(N)$, $O(N \\log N)$, amortized analysis)
- Number Theory: Sieve of Eratosthenes, Euclidean GCD, Modular Exponentiation
- Two-pointer techniques and Sliding Window paradigms

### Week 2: Linear & Tree Data Structures
- Binary Indexed Trees (Fenwick Trees) and Segment Trees with Lazy Propagation
- Disjoint Set Union (DSU) with Path Compression and Rank Heuristics
- Monotonic Queues and Stacks

### Week 3: Graph Algorithms & Traversals
- BFS / DFS with state encoding
- Dijkstra's Algorithm, Bellman-Ford, and 0-1 BFS
- Topological Sorting and Strongly Connected Components (Tarjan's / Kosaraju's)

### Week 4: Dynamic Programming & Bitmasking
- State formulation and memoization vs iterative tabulation
- Longest Common Subsequence (LCS) and Knapsack variations
- Bitmask DP and Matrix Exponentiation for linear recurrences

---

## Important Dates

| Event | Date | Location |
| :--- | :--- | :--- |
| **Registration Closes** | November 15, 2026 | Online Portal |
| **Bootcamp Kickoff** | November 20, 2026 | Computer Lab 3 & Discord |
| **Mid-Term Mock Contest** | December 5, 2026 | DPICS Code Arena |
| **Grand Winter Code Sprint** | December 22, 2026 | Main Auditorium & VJudge |

Prizes include mechanical keyboards, tech gear, and fully sponsored spots for the upcoming National Collegiate Programming Contest. Register through the DPICS member portal today!`,
      contentBn: `## প্রবলেম সলভিংয়ে নিজেকে এগিয়ে নিন

ঢাকা পলিটেকনিক ইনস্টিটিউট কম্পিউটিং সোসাইটি নিয়ে এসেছে শিক্ষার্থীদের জন্য বহুল প্রতীক্ষিত **উইন্টার কোড স্প্রিন্ট ও কম্পিটিটিভ প্রোগ্রামিং বুটক্যাম্প ২০২৬**!

জাতীয় পর্যায়ের প্রোগ্রামিং প্রতিযোগিতা এবং শীর্ষস্থানীয় সফটওয়্যার কোম্পানিতে টেকনিক্যাল ইন্টারভিউয়ের জন্য প্রস্তুতি নিতে এই ৪ সপ্তাহের বিশেষ কোর্সটি বিশেষভাবে ডিজাইন করা হয়েছে।

---

## কোর্সের বিষয়সূচি

- **১ম সপ্তাহ**: টাইম-স্পেস কমপ্লেক্সিটি ও নাম্বার থিওরি (সিভ, জিসিডি, মডুলার অ্যারিথমেটিক)।
- **২য় সপ্তাহ**: অ্যাডভান্সড ডেটা স্ট্রাকচার (সেগমেন্ট ট্রি, ফেনউইক ট্রি, ডিএসইউ)।
- **৩য় সপ্তাহ**: গ্রাফ অ্যালগরিদম (বিএফএস, ডিএফএস, ডিজকস্ট্রা, টপোলজিক্যাল সর্ট)।
- **৪র্থ সপ্তাহ**: ডায়নামিক প্রোগ্রামিং ও বিটমাস্কিং।

ক্যাম্পের শেষে অনুষ্ঠিত হবে মেগা **উইন্টার কোড স্প্রিন্ট ২০২৬**। সেরা পারফর্মারদের জন্য থাকছে আকর্ষণীয় পুরস্কার ও সার্টিফিকেট! এখনই রেজিস্ট্রেশন করুন।`,
    },
    {
      title: "Exploring Neural Architecture Search (NAS) for Edge AI Devices",
      titleBn: "এজ এআই ডিভাইসের জন্য নিউরাল আর্কিটেকচার সার্চ (NAS) গবেষণা",
      slug: "exploring-neural-architecture-search-edge-ai",
      authorId: instructor1.id,
      categoryId: getCatId("research"),
      isFeatured: false,
      tags: ["AI", "Machine Learning", "Edge Computing", "Neural Networks"],
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
      excerpt: "How automated model search techniques optimize neural network topology for resource-constrained microcontrollers and edge processors without sacrificing classification accuracy.",
      excerptBn: "অটোমেটেড মডেল সার্চের মাধ্যমে কীভাবে সীমিত মেমরির মাইক্রোকন্ট্রোলার ও এজ প্রসেসরে ডিপ লার্নিং মডেল অপ্টিমাইজ করা যায়, তার গবেষণাধর্মী বিশ্লেষণ।",
      publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
      content: `## The Edge Intelligence Challenge

Deep neural networks (DNNs) have achieved superhuman benchmarks across image classification, speech transcription, and generative modeling. However, state-of-the-art models typically require gigabytes of VRAM and hundreds of Watts of power.

Deploying deep learning models onto edge hardware—such as ARM Cortex-M microcontrollers, ESP32 boards, or mobile NPUs—presents severe constraints:
- **Strict RAM Limits**: Frequently under 512KB of SRAM.
- **Flash Storage Constraints**: Less than 4MB to 16MB of persistent memory.
- **Thermal and Battery Ceilings**: Maximum power draw under 1 to 2 Watts.

---

## What is Neural Architecture Search (NAS)?

Historically, neural network architectures (ResNet, VGG, MobileNet) were handcrafted by human researchers through painstaking trial and error. **Neural Architecture Search (NAS)** automates this discovery by framing architecture design as an optimization problem:

\`\`\`
┌──────────────────┐
│   Search Space   │ (Filter sizes, connections, layers)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Search Strategy  │ (Reinforcement Learning / Evolutionary / Differentiable)
└────────┬─────────┘
         ▼
┌──────────────────┐
│Performance Eval  │ (Multi-objective: Accuracy + Latency on target hardware)
└──────────────────┘
\`\`\`

---

## Hardware-Aware Multi-Objective Optimization

Modern NAS systems do not optimize solely for top-1 test accuracy. Instead, they incorporate **real hardware profiling**:

$$\\mathcal{L}(A) = -\\text{Acc}(A) + \\lambda \\cdot \\left(\\frac{\\text{Latency}(A)}{\\text{TargetLatency}}\\right)^\\beta$$

Where:
- $\\text{Acc}(A)$ is the validation accuracy of candidate architecture $A$.
- $\\text{Latency}(A)$ is the actual measured inference time on the target microcontroller.
- $\\lambda$ and $\\beta$ are Pareto weight hyperparameters.

By penalizing candidate layers that violate hardware memory alignment or cache line bounds, the search engine outputs networks that execute with minimum pipeline stalls.

---

## Future Research Directions at DPICS

Our research wing is currently exploring Once-for-All (OFA) networks paired with 4-bit integer quantization (INT4). By decoupling model training from hardware adaptation, we hope to deploy real-time acoustic anomaly detection models for industrial safety monitoring on inexpensive microcontrollers.`,
      contentBn: `## এজ ডিভাইসে কৃত্রিম বুদ্ধিমত্তা ও চ্যালেঞ্জ

ডিপ লার্নিং মডেলগুলো কম্পিউটার ভিশন ও স্পিচ রিকগনিশনে যুগান্তকারী সাফল্য দেখালেও এগুলো চালানোর জন্য প্রচুর প্রসেসিং পাওয়ার ও মেমোরি প্রয়োজন হয়। 

কিন্তু যখন আমরা আইওটি (IoT) ডিভাইস বা মাইক্রোকন্ট্রোলারে (যেমন ARM Cortex-M বা ESP32) এই মডেলগুলো চালাতে চাই, তখন সীমিত র‍্যাম (SRAM) ও ব্যাটারির সীমাবদ্ধতা সবচেয়ে বড় বাধা হয়ে দাঁড়ায়।

---

## নিউরাল আর্কিটেকচার সার্চ (NAS) কী?

অতীতে গবেষকরা ম্যানুয়ালি ট্রায়াল-এন্ড-এররের মাধ্যমে ডিপ লার্নিং নেটওয়ার্ক ডিজাইন করতেন। **Neural Architecture Search (NAS)** একটি অ্যালগরিদমিক পদ্ধতি যা স্বয়ংক্রিয়ভাবে নির্দিষ্ট হার্ডওয়্যারের জন্য সবচেয়ে নিখুঁত ও দ্রুতগতির নিউরাল নেটওয়ার্ক স্ট্রাকচার খুঁজে বের করে।

ডিপিসিএস রিসার্চ উইং বর্তমানে সীমিত ক্ষমতার মাইক্রোকন্ট্রোলারে এআই মডেল সফলভাবে রান করার গবেষণায় কাজ করছে।`,
    },
    {
      title: "Understanding React 19 Server Components and the New React Compiler",
      titleBn: "রিঅ্যাক্ট ১৯ সার্ভার কম্পোনেন্টস এবং নতুন রিঅ্যাক্ট কম্পাইলারের গভীরে",
      slug: "react-19-server-components-react-compiler",
      authorId: memberUser1.id,
      categoryId: getCatId("technical"),
      isFeatured: false,
      tags: ["React", "JavaScript", "Frontend", "Web Performance"],
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
      excerpt: "Say goodbye to useMemo and useCallback. Discover how the React 19 compiler re-architects client rendering, hydration, and Server Action boundaries.",
      excerptBn: "useMemo এবং useCallback-এর দিন কি শেষ? জানুন কীভাবে রিঅ্যাক্ট ১৯ কম্পাইলার এবং সার্ভার অ্যাকশন ক্লায়েন্ট রেন্ডারিং ও পারফরম্যান্স আমূল বদলে দিচ্ছে।",
      publishedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
      content: `## The End of Manual Memoization

For nearly a decade, React developers have spent countless hours agonizing over \`useMemo\`, \`useCallback\`, and referential stability to avoid expensive child re-renders:

\`\`\`tsx
// The Old Way: Tedious dependency arrays
const filteredItems = useMemo(() => {
  return items.filter((item) => item.category === selectedCategory);
}, [items, selectedCategory]);

const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);
\`\`\`

With **React 19 and the React Compiler (formerly React Forget)**, the compiler automatically memoizes values, objects, and JSX expressions at the abstract syntax tree (AST) level.

---

## 1. How the React Compiler Works Under the Hood

The React Compiler is an optimizing compiler targeting JavaScript. It parses your component code and breaks it down into fine-grained reactive blocks:

1. **Static Analysis**: Identifies pure expressions vs mutable variables.
2. **Dependency Inference**: Automatically determines which variables truly trigger side-effects without needing manual dependency arrays.
3. **Cache Insertion**: Injects optimized cache slots into the compiled JavaScript bundle.

\`\`\`tsx
// What you write in React 19:
function UserDashboard({ user, orders }) {
  const activeOrders = orders.filter(o => o.status === "ACTIVE");
  return <OrderList user={user} orders={activeOrders} />;
}
\`\`\`

The compiler transforms this into cached evaluations where \`activeOrders\` is only re-evaluated if \`orders\` reference actually mutates.

---

## 2. Server Components (RSC) vs Client Components

A common misconception is that Server Components simply replace SSR. In reality:

- **SSR (Server-Side Rendering)**: Generates initial HTML on the server, but still sends the full JavaScript bundle so the client can hydrate.
- **RSC (React Server Components)**: Executes *exclusively* on the server. Zero JavaScript is shipped to the browser for server components!

\`\`\`
Server Environment               Client Browser
┌──────────────────────┐         ┌──────────────────────┐
│ Server Component     │         │                      │
│ - Direct DB queries  │ ──────> │ Receives Virtual DOM │
│ - Reads secret keys  │  (JSON) │ stream & renders HTML│
│ - 0KB JS bundle sent │         │                      │
└──────────────────────┘         └──────────────────────┘
\`\`\`

---

## 3. Server Actions and Optimistic Updates

React 19 elevates asynchronous forms into first-class citizens using \`useActionState\` and \`useOptimistic\`:

\`\`\`tsx
import { useOptimistic } from "react";

export function MessageThread({ messages, sendMessageAction }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: string) => [...state, { text: newMessage, sending: true }]
  );

  return (
    <div>
      {optimisticMessages.map((m, i) => (
        <p key={i} className={m.sending ? "opacity-50" : ""}>{m.text}</p>
      ))}
      <form action={async (formData) => {
        const text = formData.get("text") as string;
        addOptimisticMessage(text);
        await sendMessageAction(text);
      }}>
        <input name="text" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
\`\`\`

The evolution of React continues to shift heavy workloads away from client devices to make the web fast and accessible for all devices.`,
      contentBn: `## ম্যানুয়াল মেমোয়াইজেশনের অবসান

রিঅ্যাক্ট ডেভেলপারদের এতদিন পারফরম্যান্স ঠিক রাখার জন্য প্রচুর \`useMemo\` এবং \`useCallback\` হুক লিখতে হতো। 

**রিঅ্যাক্ট ১৯ এবং নতুন রিঅ্যাক্ট কম্পাইলারের** কল্যাণে কম্পাইলার নিজেই অটোমেটিকভাবে বুঝতে পারে কোডের কোন অংশ ক্যাশ করা দরকার, ফলে ডেভেলপারকে আর জটিল ডিপেনডেন্সি অ্যারে ম্যানেজ করতে হবে না।

---

## রিঅ্যাক্ট সার্ভার কম্পোনেন্টস (RSC) এর সুবিধা

সার্ভার কম্পোনেন্ট শুধুমাত্র সার্ভারে চলে এবং ক্লায়েন্টের ব্রাউজারে এর জন্য কোনো অতিরিক্ত জাভাস্ক্রিপ্ট বান্ডল সাইজ যোগ হয় না। ফলে ওয়েবসাইটের লোডিং স্পিড বহুগুণ বেড়ে যায়।

আধুনিক ওয়েব ডেভেলপমেন্টে নিজেকে এগিয়ে রাখতে রিঅ্যাক্ট ১৯ এর নতুন ফিচারগুলো এখনই প্র্যাকটিস শুরু করুন!`,
    },
    {
      title: "Mastering Git & GitHub: Branching Strategies and Open Source Workflows",
      titleBn: "গিট ও গিটহাব মাস্টারিং: ব্রাঞ্চিং স্ট্র্যাটেজি এবং ওপেন সোর্স ওয়ার্কফ্লো",
      slug: "mastering-git-github-branching-open-source",
      authorId: memberUser2.id,
      categoryId: getCatId("tutorial"),
      isFeatured: false,
      tags: ["Git", "GitHub", "Collaboration", "Open Source"],
      coverImage: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?q=80&w=1200&auto=format&fit=crop",
      excerpt: "Level up your professional version control skills: interactive rebasing, semantic commit messages, GitHub Actions CI, and resolving complex merge conflicts.",
      excerptBn: "ইন্টারেক্টিভ রিবেস, সেম্যান্টিক কমিট মেসেজ, গিটহাব অ্যাকশনস সিআই এবং জটিল মার্জ কনফ্লিক্ট সমাধানের মাধ্যমে প্রফেশনাল গিট ওয়ার্কফ্লো আয়ত্ত করুন।",
      publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      content: `## Beyond \`git add .\` and \`git push\`

Most beginners learn three commands in Git: \`git add\`, \`git commit\`, and \`git push\`. But when you join a software engineering team or contribute to major open-source repositories, uncurated commit histories and messy merges become major liabilities.

In this guide, we break down industrial Git habits that will set you apart.

---

## 1. Trunk-Based Development vs GitFlow

### GitFlow (Legacy for release cycles)
- Complex branches: \`feature/*\`, \`develop\`, \`release/*\`, \`hotfix/*\`, \`main\`.
- Tends to create long-lived branches that result in painful merge conflicts.

### Trunk-Based Development (Modern Industry Standard)
- Developers work in short-lived feature branches ($< 1-2$ days).
- Branches are merged into \`main\` frequently through Pull Requests validated by automated CI tests.
- Feature flags are used to hide uncompleted features in production.

---

## 2. Interactive Rebase: Clean History Before You Open a PR

Before submitting a Pull Request, squash your "wip", "fix typo", and "test" commits into clean, semantic units using interactive rebase:

\`\`\`bash
# Rebase the last 4 commits
git rebase -i HEAD~4
\`\`\`

In the editor:
\`\`\`
pick e3f12a4 feat: add category filter to post manager
squash 9a2b1c3 fix typo in category schema
squash 4d5e6f7 format category files
\`\`\`

---

## 3. Resolving Merge Conflicts with Confidence

When a conflict occurs:
1. Don't panic: run \`git status\` to see the affected files.
2. Open your diff tool or IDE.
3. Understand the markers:

\`\`\`diff
<<<<<<< HEAD (Current branch)
const category = await getCategoryById(id);
=======
const category = await fetchCategoryWithCount(id);
>>>>>>> feature/category-counts (Incoming branch)
\`\`\`

4. Edit the file to the desired state, remove the conflict markers, and complete the rebase:

\`\`\`bash
git add src/lib/category.ts
git rebase --continue
\`\`\`

---

## 4. Semantic Commit Messages

Adopt the Conventional Commits specification:
- \`feat: add bilingual support for post titles\`
- \`fix: prevent null pointer on empty category description\`
- \`refactor: isolate database adapter to client singleton\`
- \`docs: update readme with environment setup guide\`

Good version control hygiene reflects professional discipline and makes peer code reviews effortless.`,
      contentBn: `## শুধু \`git add\` ও \`git push\` এর বাইরে প্রফেশনাল গিট

অনেক শিক্ষার্থীই গিট শেখার শুরুতে শুধু তিনটি কমান্ড ব্যবহার করে। কিন্তু কোনো সফটওয়্যার কোম্পানিতে বা ওপেন সোর্স প্রজেক্টে দলগতভাবে কাজ করার সময় গোছানো কমিট হিস্ট্রি এবং ব্রাঞ্চিং জানা অত্যন্ত জরুরি।

---

## ট্রাঙ্ক-বেসড ডেভেলপমেন্ট (Trunk-Based Development)

আধুনিক সফটওয়্যার ডেভেলপমেন্টে বড় বড় শাখা তৈরি না করে ছোট ছোট ফিচারের জন্য ১-২ দিনের শর্ট-লিভড ব্রাঞ্চ তৈরি করা হয় এবং পিআর (Pull Request) এর মাধ্যমে সিআই টেস্ট পাস করে মেইন ব্রাঞ্চে মার্জ করা হয়।

---

## সেম্যান্টিক কমিট মেসেজ

কমিট করার সময় পরিষ্কার মেসেজ দিন, যেমন:
- \`feat: নতুন ফিচার যোগ\`
- \`fix: বাগ ফিক্স\`
- \`docs: ডকুমেন্টেশন আপডেট\`

নিয়মিত গিটহাবে প্রজেক্ট ওপেন সোর্স করুন এবং দলগতভাবে কাজ করার অভিজ্ঞতা অর্জন করুন!`,
    },
    {
      title: "Recap: DPICS Annual Tech Symposium & Project Showcase 2026",
      titleBn: "পুনরাবৃত্তি: ডিপিসিএস বার্ষিক টেক সিম্পোজিয়াম ও প্রজেক্ট শোকেস ২০২৬",
      slug: "recap-dpics-annual-tech-symposium-project-showcase-2026",
      authorId: adminUser.id,
      categoryId: getCatId("event-recap"),
      isFeatured: false,
      tags: ["Event Recap", "Symposium", "Showcase", "Hardware"],
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
      excerpt: "Highlights, student project winners, keynote speeches, and industry panel discussions from our largest annual gathering on campus.",
      excerptBn: "ক্যাম্পাসে অনুষ্ঠিত আমাদের সবচেয়ে বড় বার্ষিক আয়োজন টেক সিম্পোজিয়ামের গুরুত্বপূর্ণ মুহূর্ত, প্রজেক্ট প্রদর্শনী এবং ইন্ডাস্ট্রি বিশেষজ্ঞদের আলোচনা।",
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      content: `## Celebrating Innovation Across Disciplines

Last weekend, Dhaka Polytechnic Institute Computing Society held its **Annual Tech Symposium & Project Showcase 2026** at the institute's Central Auditorium. 

With over 600 student attendees, 38 exhibited hardware and software projects, and esteemed guest speakers from the tech industry, the event was our most successful symposium to date!

---

## Event Highlights & Keynotes

### Keynote 1: "The Era of Applied AI in Bangladesh"
Our keynote speaker, Lead Engineer at a prominent regional fintech firm, shared practical insights on how machine learning models are transforming fraud detection, micro-credit scoring, and vernacular NLP applications in Bangladesh.

### Keynote 2: "From Polytechnic to Silicon Valley: Career Roadmap"
An inspiring alumni panel discussion highlighting career transitions, remote engineering opportunities, and the importance of open-source contributions.

---

## Outstanding Projects in the Showcase

Out of 38 submitted projects, an expert judge panel awarded the following teams:

1. **Best Overall Project**: *IoT-Based Flood Early Warning & Telemetry System* (Team SensorNet)
2. **Best Software Innovation**: *Bangla Braille to Speech Converter Mobile App* (Team Drishti)
3. **Best Robotics Project**: *Autonomous Floor Disinfection Rover for Hospitals* (Team MechaCare)

---

## Looking Forward

We extend our heartfelt gratitude to the faculty advisors, organizing volunteers, and campus sponsors who made this grand gathering possible. Check out the symposium photo gallery in our social channels and prepare for our upcoming summer tech initiatives!`,
      contentBn: `## উদ্ভাবন ও মেধার বার্ষিক মিলনমেলা

গত সপ্তাহে ঢাকা পলিটেকনিক ইনস্টিটিউট অডিটোরিয়ামে অনুষ্ঠিত হলো ডিপিসিএস-এর ফ্ল্যাগশিপ আয়োজন **বার্ষিক টেক সিম্পোজিয়াম ও প্রজেক্ট শোকেস ২০২৬**।

৬০০ জনেরও বেশি শিক্ষার্থী, ৩৮টি উদ্ভাবনী প্রজেক্ট এবং দেশীয় সফটওয়্যার ইন্ডাস্ট্রির বিশিষ্ট বক্তাদের উপস্থিতিতে অনুষ্ঠানটি মুখরিত ছিল।

---

## সেরা প্রজেক্টসমূহ:
১. **সেরা সামগ্রিক প্রজেক্ট**: আইওটি-ভিত্তিক বন্যা পূর্বাভাস ও টেলিমেট্রি সিস্টেম।
২. **সেরা সফটওয়্যার উদ্ভাবন**: দৃষ্টিহীনদের জন্য বাংলা ব্রেইল-টু-স্পিচ মোবাইল অ্যাপ।
৩. **সেরা রোবোটিক্স প্রজেক্ট**: হাসপাতালের জন্য স্বয়ংক্রিয় ডিসইনফেকশন রোভার।

সকল ভলান্টিয়ার, শিক্ষক এবং অংশগ্রহণকারী শিক্ষার্থীদের ডিপিসিএস এর পক্ষ থেকে আন্তরিক ধন্যবাদ!`,
    },
    {
      title: "The Engineering Mindset: How Polytechnic Students Can Excel in Software Engineering",
      titleBn: "ইঞ্জিনিয়ারিং মাইন্ডসেট: পলিটেকনিক শিক্ষার্থীরা কীভাবে সফটওয়্যার ইঞ্জিনিয়ারিংয়ে এগিয়ে থাকবে",
      slug: "engineering-mindset-polytechnic-students-software-careers",
      authorId: instructor2.id,
      categoryId: getCatId("general"),
      isFeatured: false,
      tags: ["Career", "Mindset", "Learning", "Software Engineering"],
      coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
      excerpt: "Practical strategies for diploma engineers to cultivate deep technical curiosity, build impressive portfolio projects, and navigate competitive industry interviews.",
      excerptBn: "ডিপ্লোমা ইঞ্জিনিয়ারিং শিক্ষার্থীদের জন্য ব্যবহারিক গাইড: টেকনিক্যাল দক্ষতা বৃদ্ধি, স্ট্রং পোর্টফোলিও তৈরি এবং সফটওয়্যার ইন্ডাস্ট্রিতে সফল ক্যারিয়ার গড়ার কৌশল।",
      publishedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      content: `## Breaking the Stereotypes

Diploma in Engineering students possess an invaluable advantage that many conventional degree seekers lack: **early, daily hands-on immersion in technical subjects**. From your first semester, you are exposed to electrical circuits, hardware logic, networking, and programming fundamentals.

Yet, many students struggle with impostor syndrome or feel uncertain about competing against university graduates for top software engineering positions.

The secret to bridging this gap lies in cultivating an **Engineering Mindset**.

---

## 1. Focus on Fundamentals Over Ephemeral Trends

Frameworks come and go. A developer who only knows how to copy-paste Next.js templates will be easily disrupted. But a developer who understands:
- How memory is allocated on the heap vs the stack
- How HTTP protocols, TCP handshakes, and DNS resolution work
- How relational schemas are normalized and indexed
- How asynchronous event loops schedule tasks

...will easily learn any new framework in a weekend.

---

## 2. Build Things That Solve Real Problems

Avoid generic resume projects like basic to-do lists or tutorial clones. Instead:
- Build an attendance tracking system for your department.
- Digitize your campus library catalog.
- Create an automated Telegram bot that notifies your classmates about exam schedules.
- Contribute bug fixes and documentation to open-source libraries you use every day.

---

## 3. Learn in Public and Network

Write blogs about bugs you fixed. Share your learning journey on LinkedIn and GitHub. When interviewers look at your profile, they shouldn't just see a certificate; they should see a visible trail of technical curiosity, code commits, and problem-solving passion.

Remember: in the global technology industry, your capability to write clean, maintainable software and communicate effectively with teammates matters far more than where you started. Keep building, keep learning!`,
      contentBn: `## আত্মবিশ্বাস ও প্রকৌশল ভাবনা

পলিটেকনিক শিক্ষার্থীদের অন্যতম বড় শক্তি হলো প্রথম থেকেই হাতে-কলমে প্র্যাকটিক্যাল কাজ শেখার সুযোগ। ইলেকট্রনিক্স, নেটওয়ার্কিং ও কোডিংয়ের বুনিয়াদ শুরু থেকেই গড়ার সুযোগ থাকে।

তবে অনেক শিক্ষার্থী আত্মবিশ্বাসের অভাবে বড় কোম্পানিগুলোতে আবেদন করতে দ্বিধাবোধ করে। সঠিক পথ ও চিন্তাভাবনা নিয়ে এগোলে যেকোনো ডিপ্লোমা শিক্ষার্থী আন্তর্জাতিক মানের সফটওয়্যার ইঞ্জিনিয়ার হতে পারে।

---

## ১. ফ্রেমওয়ার্কের চেয়ে ফান্ডামেন্টালসে জোর দিন

নতুন নতুন ফ্রেমওয়ার্ক সময়ের সাথে পরিবর্তিত হবে। কিন্তু কম্পিউটার সায়েন্সের মূল ভিত্তি—ডাটা স্ট্রাকচার, নেটওয়ার্কিং, অপারেটিং সিস্টেম এবং ডাটাবেসের ধারণা সবসময় একই থাকে। এগুলো ভালোভাবে আয়ত্ত করুন।

---

## ২. বাস্তবমুখী প্রজেক্ট তৈরি করুন

সাধারণ টিউটোরিয়াল দেখে ক্লোন প্রজেক্ট না বানিয়ে নিজের ক্যাম্পাস বা সমাজের বাস্তব সমস্যা সমাধানের প্রজেক্ট বানান।

নিয়মিত শিখুন, গিটহাবে কোড পুশ করুন এবং নিজের দক্ষতায় বিশ্বাস রাখুন!`,
    },
  ]

  for (const post of postsData) {
    const readingTime = estimateReadingMinutes(post.content)

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        titleBn: post.titleBn,
        excerpt: post.excerpt,
        excerptBn: post.excerptBn,
        content: post.content,
        contentBn: post.contentBn,
        categoryId: post.categoryId,
        tags: post.tags,
        isFeatured: post.isFeatured,
        coverImage: post.coverImage,
        status: PostStatus.PUBLISHED,
        readingMinutes: readingTime,
        publishedAt: post.publishedAt,
        submittedAt: post.publishedAt,
        reviewedAt: post.publishedAt,
        reviewedById: adminUser.id,
        authorId: post.authorId,
      },
      create: {
        title: post.title,
        titleBn: post.titleBn,
        slug: post.slug,
        excerpt: post.excerpt,
        excerptBn: post.excerptBn,
        content: post.content,
        contentBn: post.contentBn,
        categoryId: post.categoryId,
        tags: post.tags,
        isFeatured: post.isFeatured,
        coverImage: post.coverImage,
        status: PostStatus.PUBLISHED,
        readingMinutes: readingTime,
        publishedAt: post.publishedAt,
        submittedAt: post.publishedAt,
        reviewedAt: post.publishedAt,
        reviewedById: adminUser.id,
        authorId: post.authorId,
      },
    })

    console.log(`✓ Seeded post: "${post.title}" (${post.slug})`)
  }

  const count = await prisma.post.count()
  console.log(`Done! Total posts in database: ${count}`)
}

seedPosts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed posts:", err)
    process.exit(1)
  })
