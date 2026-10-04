import "dotenv/config"

import prisma from "../src/lib/prisma"
import { PostStatus } from "../src/generated/prisma/enums"
import { toAchievementSlug } from "../src/lib/achievement-slug"

async function seedAchievements() {
  console.log("Seeding 20 realistic dummy achievements...")

  // 1. Fetch available users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, roles: true },
  })

  if (users.length === 0) {
    throw new Error("No users found in database to assign achievements to.")
  }

  console.log(`Found ${users.length} users in database.`)

  // 2. Ensure achievement categories exist
  const categoriesData = [
    {
      name: "Hackathons",
      nameBn: "হ্যাকাথন",
      slug: "hackathons",
      description: "National and regional hackathon victories and hack-sprint recognitions.",
    },
    {
      name: "Programming Contests",
      nameBn: "প্রোগ্রামিং প্রতিযোগিতা",
      slug: "programming-contests",
      description: "Competitive programming awards, ICPC, and inter-polytechnic coding contests.",
    },
    {
      name: "Professional Certifications",
      nameBn: "পেশাদার সার্টিফিকেশন",
      slug: "certifications",
      description: "Global cloud, software engineering, cyber security, and networking certifications.",
    },
    {
      name: "Robotics & IoT",
      nameBn: "রোবোটিক্স ও আইওটি",
      slug: "robotics-iot",
      description: "Hardware exhibitions, robotics olympiads, and IoT innovation championships.",
    },
    {
      name: "Project Showcases",
      nameBn: "প্রজেক্ট শোকেস",
      slug: "project-showcases",
      description: "National ICT fairs, tech expos, and software exhibition trophies.",
    },
    {
      name: "Skills & Technical Awards",
      nameBn: "স্কিল ও টেকনিক্যাল পুরস্কার",
      slug: "skills-awards",
      description: "BTEB Skills competitions and national vocational excellence medals.",
    },
  ]

  for (const cat of categoriesData) {
    const existing = await prisma.category.findUnique({
      where: { type_slug: { type: "ACHIEVEMENT", slug: cat.slug } },
    })
    if (!existing) {
      await prisma.category.create({
        data: {
          type: "ACHIEVEMENT",
          name: cat.name,
          nameBn: cat.nameBn,
          slug: cat.slug,
          description: cat.description,
          isActive: true,
        },
      })
    }
  }

  const allCategories = await prisma.category.findMany({
    where: { type: "ACHIEVEMENT" },
  })

  const getCatId = (slug: string) => {
    const found = allCategories.find((c) => c.slug === slug)
    return found ? found.id : allCategories[0]?.id
  }

  // Helper to pick user
  const getUser = (idx: number) => users[idx % users.length]

  const achievements = [
    // 1. Champion at National Hackathon
    {
      title: "Champions - National Smart Bangladesh Hackathon 2026",
      titleBn: "জাতীয় স্মার্ট বাংলাদেশ হ্যাকাথন ২০২৬ এ চ্যাম্পিয়ন",
      slug: "champions-national-smart-bangladesh-hackathon-2026",
      organization: "ICT Division & Bangladesh Computer Council",
      organizationBn: "আইসিটি বিভাগ ও বাংলাদেশ কম্পিউটার কাউন্সিল",
      eventDate: new Date("2026-02-15"),
      categoryId: getCatId("hackathons"),
      tags: ["Hackathon", "AI", "SmartBangladesh", "Next.js"],
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
      ],
      certificateUrl: "https://example.com/certificates/hackathon-2026-champions",
      excerpt: "Our 4-member DPI Computing Society team secured 1st place among 120 national teams by developing an automated agricultural supply chain platform powered by computer vision.",
      excerptBn: "১২০টি বিশ্ববিদ্যালয়ের দলের সাথে প্রতিদ্বন্দ্বিতা করে কম্পিউটার ভিশনভিত্তিক কৃষি সাপ্লাই চেইন প্ল্যাটফর্ম তৈরির মাধ্যমে আমাদের ৪ সদস্যের দল ১ম স্থান অর্জন করেছে।",
      content: `### Triumph at National Hackathon 2026

We are thrilled to announce that Team **DPI CyberKnights** won the **Champion Trophy** at the prestigious National Smart Bangladesh Hackathon 2026, organized by the ICT Division.

#### The Problem
Smallholder farmers in rural Bangladesh lose up to 30% of perishable crops due to market information asymmetry and lack of rapid disease detection.

#### Our Solution: *KrishiSetu AI*
We built a progressive web application integrating:
1. **Edge-based Leaf Disease Detection**: Offline-capable TensorFlow Lite model detecting 14 common crop diseases in real-time.
2. **Direct Fair-Price Bidding**: Real-time WebSocket auction room eliminating middle-man exploitation.
3. **Automated Logistics Routing**: Microservices-based transit aggregation with live telemetry.

> "The technical depth, fast prototype delivery, and clean system architecture from the polytechnic team blew the jury away." — *Chief Judge Panel*

#### Team Members
- Tahmid Hasan (Team Lead, Full Stack)
- Abdullah Al Mamun (AI/ML Engineer)
- Mehedi Hasan (Frontend & UX)
- Tanvir Ahmed (DevOps & Backend)`,
      contentBn: `### জাতীয় স্মার্ট বাংলাদেশ হ্যাকাথনে গৌরবময় অর্জন

আমরা অত্যন্ত আনন্দের সাথে জানাচ্ছি যে তথ্য ও যোগাযোগ প্রযুক্তি বিভাগ আয়োজিত ন্যাশনাল স্মার্ট বাংলাদেশ হ্যাকাথন ২০২৬-এ আমাদের দল **DPI CyberKnights** চ্যাম্পিয়ন শিরোপা অর্জন করেছে।

#### সমাধানের প্রেক্ষাপট
আমাদের তৈরি **কৃষি সেতু এআই** প্ল্যাটফর্মে প্রান্তিক কৃষকদের ফসলের রোগ নির্ণয় এবং সরাসরি উন্মুক্ত নিলামে বাজারদর নিশ্চিত করার আধুনিক ব্যবস্থা যুক্ত করা হয়েছে।

#### প্রধান বৈশিষ্ট্যসমূহ:
1. অফলাইন-সক্ষম টেনসরফ্লো লাইট মডেল যার মাধ্যমে ১৪টি ফসলের রোগ তাৎক্ষণিক শনাক্ত করা সম্ভব।
2. মধ্যস্বত্বভোগীহীন সরাসরি পাইকারি নিলাম বাজার।
3. স্বয়ংক্রিয় লজিস্টিকস ও পণ্য পরিবহন ট্র্যাকিং।`,
      publishedAt: new Date("2026-02-18"),
      userIndex: 0,
    },

    // 2. 1st Runners Up BUET CSE Fest
    {
      title: "1st Runners Up - BUET CSE Fest 2026 Inter-University Hackathon",
      titleBn: "বুয়েট সিএসই ফেস্ট ২০২৬ ইন্টার-ইউনিভার্সিটি হ্যাকাথনে ১ম রানার্স আপ",
      slug: "1st-runners-up-buet-cse-fest-2026",
      organization: "Department of CSE, BUET",
      organizationBn: "সিএসই বিভাগ, বুয়েট",
      eventDate: new Date("2026-01-20"),
      categoryId: getCatId("hackathons"),
      tags: ["BUET", "WebSecurity", "DistributedSystems"],
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop",
      ],
      certificateUrl: "https://example.com/certificates/buet-cse-fest-2026",
      excerpt: "DPI Computing Society team clinched 2nd position among 65 engineering universities at the BUET CSE Fest 36-hour non-stop hackathon with a zero-trust credential sharing framework.",
      excerptBn: "বুয়েট সিএসই ফেস্টে ৩৬ ঘণ্টার টানা হ্যাকাথনে ৬৫টি প্রকৌশল বিশ্ববিদ্যালয়ের সাথে প্রতিযোগিতা করে ২য় স্থান অর্জন করে আমাদের জিরো-ট্রাস্ট ক্রেডেনশিয়াল প্ল্যাটফর্ম।",
      content: `### Securing 2nd Place at BUET CSE Fest 2026

The BUET CSE Fest is widely recognized as one of Bangladesh's toughest collegiate engineering challenges. Over 36 rigorous hours, our team engineered **AuthMesh**, a decentralized identity & authorization delegation layer built on cryptographic proofs.

#### Highlights:
- Implemented ephemeral cryptographic tokens using zero-knowledge range proofs.
- Benchmarked at over 12,000 token validations per second in distributed Go microservices.
- Praised by BUET professors for rigorous security threat modeling.`,
      contentBn: `### বুয়েট সিএসই ফেস্ট ২০২৬ এ সাফল্য

বুয়েটের কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগ আয়োজিত দেশের অন্যতম সেরা হ্যাকাথনে আমাদের দল **AuthMesh** তৈরি করে প্রথম রানার্স আপ হওয়ার গৌরব অর্জন করেছে।`,
      publishedAt: new Date("2026-01-22"),
      userIndex: 1,
    },

    // 3. AWS Certified Solutions Architect
    {
      title: "AWS Certified Solutions Architect – Associate (SAA-C03)",
      titleBn: "এডাব্লিউএস সার্টিফাইড সল্যুশন আর্কিটেক্ট – অ্যাসোসিয়েট অর্জন",
      slug: "aws-certified-solutions-architect-associate",
      organization: "Amazon Web Services (AWS)",
      organizationBn: "অ্যামাজন ওয়েব সার্ভিসেস (এডাব্লিউএস)",
      eventDate: new Date("2026-03-01"),
      categoryId: getCatId("certifications"),
      tags: ["AWS", "Cloud", "DevOps", "Architecture"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://www.credly.com/org/amazon-web-services",
      excerpt: "Scored 890/1000 on the AWS Certified Solutions Architect Associate exam, validating deep competence in high-availability cloud architecture, VPC peering, and serverless architectures.",
      excerptBn: "এডাব্লিউএস সার্টিফাইড সল্যুশন আর্কিটেক্ট পরীক্ষায় ৮৯০ নম্বর পেয়ে আন্তর্জাতিক পেশাদার ক্লাউড আর্কিটেকচার সনদ অর্জন।",
      content: `### Passing the AWS SAA-C03 Exam

Achieving this certification demonstrates hands-on mastery in designing resilient, high-performing, and cost-optimized distributed systems on Amazon Web Services.

#### Core Knowledge Domains Mastered:
- Resilient Architectures: Multi-AZ deployments, Auto Scaling, Route53 latency routing.
- High-Performing Architectures: Aurora Serverless v2, ElastiCache Redis clustering.
- Secure Applications: IAM permission boundaries, KMS envelope encryption.
- Cost Optimization: S3 Lifecycle tiers, Compute Savings Plans.`,
      contentBn: `### আন্তর্জাতিক ক্লাউড সার্টিফিকেশন অর্জন

অ্যামাজন ওয়েব সার্ভিসেস (AWS) এর সল্যুশন আর্কিটেক্ট অ্যাসোসিয়েট পরীক্ষায় উত্তীর্ণ হয়ে আধুনিক ক্লাউড কম্পিউটিং এবং মাইক্রোসার্ভিসেস আর্কিটেকচারের আন্তর্জাতিক স্বীকৃতি লাভ করেছি।`,
      publishedAt: new Date("2026-03-02"),
      userIndex: 2,
    },

    // 4. BTEB National Skills Competition Gold Medal
    {
      title: "Gold Medal - BTEB National Skills Competition 2025 (Web Technologies)",
      titleBn: "স্বর্ণপদক - বিটিইবি জাতীয় স্কিল প্রতিযোগিতা ২০২৫ (ওয়েব টেকনোলজি)",
      slug: "gold-medal-bteb-national-skills-competition-2025",
      organization: "Bangladesh Technical Education Board (BTEB)",
      organizationBn: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (বিটিইবি)",
      eventDate: new Date("2025-11-28"),
      categoryId: getCatId("skills-awards"),
      tags: ["BTEB", "WebTech", "GoldMedal", "Polytechnic"],
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=800&auto=format&fit=crop",
      ],
      certificateUrl: "https://bteb.gov.bd/skills-competition",
      excerpt: "Ranked 1st nationwide among all polytechnic institutes in the Web Technologies trade during the Ministry of Education's National Skills Competition.",
      excerptBn: "শিক্ষা মন্ত্রণালয় ও কারিগরি শিক্ষা বোর্ড আয়োজিত জাতীয় দক্ষতা প্রতিযোগিতায় ওয়েব টেকনোলজিতে সারা দেশের সকল পলিটেকনিকের মধ্যে ১ম হয়ে স্বর্ণপদক লাভ।",
      content: `### National Gold Medal in Web Technologies

Representing Dhaka Polytechnic Institute, our member demonstrated world-class standards in frontend rendering performance, responsive UI precision, and backend RESTful API integration under strict speed constraints.`,
      contentBn: `### জাতীয় স্বর্ণপদক অর্জন

ঢাকা পলিটেকনিক ইনস্টিটিউটের প্রতিনিধিত্ব করে বাংলাদেশ কারিগরি শিক্ষা বোর্ডের জাতীয় স্কিল প্রতিযোগিতায় ওয়েব টেকনোলজিস বিভাগে প্রথম স্থান অধিকার ও স্বর্ণপদক অর্জন।`,
      publishedAt: new Date("2025-12-01"),
      userIndex: 3,
    },

    // 5. NASA Space Apps Challenge Bangladesh Nominee
    {
      title: "Global Nominee - NASA Space Apps Challenge 2025 (Bangladesh)",
      titleBn: "গ্লোবাল নমিনি - নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৫ (বাংলাদেশ)",
      slug: "global-nominee-nasa-space-apps-challenge-2025",
      organization: "NASA Space Apps & BASIS",
      organizationBn: "নাসা স্পেস অ্যাপস ও বেসিস",
      eventDate: new Date("2025-10-06"),
      categoryId: getCatId("hackathons"),
      tags: ["NASA", "SpaceApps", "SatelliteData", "Python"],
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://spaceappschallenge.org",
      excerpt: "Selected as one of the 5 Global Nominees representing Bangladesh for creating 'AeroLens' — an open satellite visualization tool analyzing sea surface temperatures.",
      excerptBn: "নাসা স্পেস অ্যাপস চ্যালেঞ্জে উন্মুক্ত স্যাটেলাইট তথ্য বিশ্লেষণের টুল 'AeroLens' উদ্ভাবনের জন্য গ্লোবাল নমিনি হিসেবে নির্বাচিত।",
      content: `### Selected as Global Nominee in NASA Space Apps 2025

Our team utilized Landsat-9 and Sentinel-2 multi-spectral imagery to deliver real-time coastal erosion alerts for Bangladesh's vulnerable southern delta.`,
      contentBn: `### নাসা স্পেস অ্যাপস চ্যালেঞ্জে বৈশ্বিক মনোনয়ন

নাসার উন্মুক্ত স্যাটেলাইট ডাটা ব্যবহার করে উপকূলীয় ভাঙ্গন ও পরিবেশগত পরিবর্তনের ভিজ্যুয়ালাইজেশন প্ল্যাটফর্মের জন্য জাতীয় পর্যায়ে শীর্ষ দল হিসেবে আন্তর্জাতিক নমিনেশন লাভ।`,
      publishedAt: new Date("2025-10-10"),
      userIndex: 4,
    },

    // 6. National Collegiate Programming Contest (NCPC) Finalist
    {
      title: "National Finalist - NCPC 2025 Programming Contest",
      titleBn: "জাতীয় ফাইনালিস্ট - এনসিপিসি ২০২৫ প্রোগ্রামিং প্রতিযোগিতা",
      slug: "national-finalist-ncpc-2025",
      organization: "NCPC Central Committee & Jahangirnagar University",
      organizationBn: "এনসিপিসি ও জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
      eventDate: new Date("2025-09-18"),
      categoryId: getCatId("programming-contests"),
      tags: ["NCPC", "CP", "Algorithms", "C++"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://example.com/certificates/ncpc-2025",
      excerpt: "Qualified for the National Finals of NCPC 2025 after solving 6 algorithmic problems in preliminary rounds with top speed.",
      excerptBn: "এনসিপিসি ২০২৫ এর প্রিলিমিনারিতে ৬টি জটিল অ্যালগরিদমিক সমস্যার দ্রুত সমাধান করে জাতীয় ফাইনালে উত্তীর্ণ।",
      content: `### Reaching NCPC National Finals

Our competitive programming wing achieved top ranks among polytechnic teams in the National Collegiate Programming Contest (NCPC).`,
      contentBn: `### এনসিপিসি ফাইনালে অংশগ্রহণ

কঠোর অনুশীলন এবং ডেটা স্ট্রাকচার ও অ্যালগরিদমের প্রয়োগে জাতীয় পর্যায়ের মূল পর্বে স্থান অর্জন।`,
      publishedAt: new Date("2025-09-20"),
      userIndex: 0,
    },

    // 7. BASIS National ICT Awards Runner Up
    {
      title: "Runner Up - BASIS National ICT Awards 2025 (Student Category)",
      titleBn: "রানার্স আপ - বেসিস ন্যাশনাল আইসিটি অ্যাওয়ার্ডস ২০২৫ (স্টুডেন্ট ক্যাটাগরি)",
      slug: "runner-up-basis-national-ict-awards-2025",
      organization: "Bangladesh Association of Software and Information Services (BASIS)",
      organizationBn: "বাংলাদেশ অ্যাসোসিয়েশন অব সফটওয়্যার অ্যান্ড ইনফরমেশন সার্ভিসেস (বেসিস)",
      eventDate: new Date("2025-10-25"),
      categoryId: getCatId("project-showcases"),
      tags: ["BASIS", "ICTAwards", "StudentProject", "EdTech"],
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://basis.org.bd/awards",
      excerpt: "Awarded Runner-Up in Tertiary Student Category at the country's flagship software gala for our indigenous low-bandwidth offline Learning Management System.",
      excerptBn: "দেশের সর্ববৃহৎ সফটওয়্যার প্রদর্শনী ও অ্যাওয়ার্ড অনুষ্ঠানে আমাদের অফলাইন লার্নিং ম্যানেজমেন্ট সিস্টেমের জন্য সম্মাননা।",
      content: `### BASIS ICT Award in Student Innovation

Our LMS system designed for rural technical students caught the eye of industry leaders, solving connectivity issues through progressive web apps and SQLite local mirrors.`,
      contentBn: `### বেসিস ন্যাশনাল আইসিটি অ্যাওয়ার্ডসে পুরস্কৃত

সীমিত ইন্টারনেট সুবিধাসম্পন্ন অঞ্চলের শিক্ষার্থীদের জন্য অফলাইন সক্ষম শিক্ষণ প্ল্যাটফর্ম তৈরির স্বীকৃতিস্বরূপ এই সম্মাননা লাভ।`,
      publishedAt: new Date("2025-10-28"),
      userIndex: 1,
    },

    // 8. Certified Kubernetes Administrator (CKA)
    {
      title: "Certified Kubernetes Administrator (CKA) by Linux Foundation",
      titleBn: "লিনাক্স ফাউন্ডেশন কর্তৃক সার্টিফাইড কুবারনেটিস অ্যাডমিনিস্ট্রেটর (সিকেএ)",
      slug: "certified-kubernetes-administrator-cka",
      organization: "Cloud Native Computing Foundation (CNCF)",
      organizationBn: "সিএনসিএফ ও লিনাক্স ফাউন্ডেশন",
      eventDate: new Date("2026-01-10"),
      categoryId: getCatId("certifications"),
      tags: ["Kubernetes", "CNCF", "DevOps", "Containers"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://www.cncf.io/certification/cka/",
      excerpt: "Earned the prestigious CKA certification demonstrating expertise in production Kubernetes installation, multi-node clustering, storage provisioners, and etcd backups.",
      excerptBn: "সিএনসিএফ ও লিনাক্স ফাউন্ডেশনের অধীনে কুবারনেটিস ক্লাস্টার সেটআপ, নেটওয়ার্কিং ও ডেভঅপ্স ব্যবস্থাপনায় আন্তর্জাতিক সিকেএ সনদ অর্জন।",
      content: `### Passing the 2-Hour Practical CKA Exam

The CKA exam is 100% hands-on command-line terminal problem solving. Covered cluster hardening, ingress controllers, pod scheduling, and troubleshooting faulty control planes.`,
      contentBn: `### আন্তর্জাতিক সিকেএ সার্টিফিকেশন

ক্লাউড-নেটিভ অবকাঠামো পরিচালনা এবং কনটেইনার অর্কেস্ট্রেশনের অন্যতম সেরা আন্তর্জাতিক সার্টিফিকেশন সফলভাবে সম্পন্ন।`,
      publishedAt: new Date("2026-01-12"),
      userIndex: 2,
    },

    // 9. Inter-Polytechnic IT Fest Champion
    {
      title: "Champions - Inter-Polytechnic Software Showcase 2025",
      titleBn: "চ্যাম্পিয়ন - আন্তঃপলিটেকনিক সফটওয়্যার প্রদর্শনী ২০২৫",
      slug: "champions-inter-polytechnic-software-showcase-2025",
      organization: "Directorate of Technical Education (DTE)",
      organizationBn: "কারিগরি শিক্ষা অধিদপ্তর",
      eventDate: new Date("2025-08-14"),
      categoryId: getCatId("project-showcases"),
      tags: ["Polytechnic", "Championship", "Software", "Desktop"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://dte.gov.bd",
      excerpt: "Won 1st prize among 49 polytechnics for an automated laboratory asset and equipment reservation system.",
      excerptBn: "দেশের ৪৯টি সরকারি পলিটেকনিকের মধ্যে ল্যাবরেটরি সরঞ্জাম ব্যবস্থাপনা ও অটোমেশন সফটওয়্যার প্রদর্শনে ১ম পুরস্কার লাভ।",
      content: `### Inter-Polytechnic Gold Trophy

Presented an automated laboratory inventory tracking system built with Next.js, Electron, and RFID sensor integration.`,
      contentBn: `### আন্তঃপলিটেকনিক সফটওয়্যার প্রদর্শনীতে ১ম স্থান

আরএফআইডি সেন্সর এবং আধুনিক ওয়েব প্রযুক্তির সমন্বয়ে তৈরি স্মার্ট ল্যাব ম্যানেজমেন্ট সফটওয়্যারের স্বীকৃতি।`,
      publishedAt: new Date("2025-08-16"),
      userIndex: 3,
    },

    // 10. Meta Front-End Developer Professional Certificate
    {
      title: "Meta Certified Front-End Developer Professional",
      titleBn: "মেটা সার্টিফাইড ফ্রন্ট-এন্ড ডেভেলপার প্রফেশনাল সনদ",
      slug: "meta-certified-front-end-developer",
      organization: "Meta & Coursera",
      organizationBn: "মেটা (ফেসবুক)",
      eventDate: new Date("2025-07-20"),
      categoryId: getCatId("certifications"),
      tags: ["Meta", "React", "Frontend", "JavaScript"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://coursera.org/verify/professional-cert/meta-frontend",
      excerpt: "Completed 9 comprehensive courses by Meta engineering staff covering advanced React patterns, unit testing with Jest, and UI/UX design principles.",
      excerptBn: "মেটার ৯টি উচ্চমানের কোর্স ও প্রজেক্ট শেষ করে রিয়্যাক্ট, ইউনিট টেস্টিং এবং আধুনিক ফ্রন্টএন্ড আর্কিটেকচারের পেশাদার স্বীকৃতি অর্জন।",
      content: `### Rigorous 9-Course Specialization by Meta

Covered advanced React component design, custom hooks, state management with Context, accessibility (WCAG), and responsive UX implementation.`,
      contentBn: `### মেটা ফ্রন্ট-এন্ড সার্টিফিকেশন

আন্তর্জাতিক মানের রিয়্যাক্ট ডেভেলপমেন্ট এবং আধুনিক ইউআই/ইউএক্স ফ্রন্টএন্ড কোডিংয়ের উপর কোর্স সফলভাবে শেষ করে সনদ লাভ।`,
      publishedAt: new Date("2025-07-22"),
      userIndex: 4,
    },

    // 11. 2nd Place - RoboTech Olympiad Bangladesh 2025
    {
      title: "2nd Place - National Line Follower & Obstacle Avoider Challenge",
      titleBn: "২য় স্থান - জাতীয় লাইন ফলোয়ার ও অবস্টাকল রোবট প্রতিযোগিতা",
      slug: "2nd-place-national-robotics-challenge-2025",
      organization: "RoboTech Olympiad Bangladesh",
      organizationBn: "রোবোটেক অলিম্পিয়াড বাংলাদেশ",
      eventDate: new Date("2025-12-10"),
      categoryId: getCatId("robotics-iot"),
      tags: ["Robotics", "Arduino", "Embedded", "IoT"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://example.com/robotics-2025",
      excerpt: "Built a high-speed PID-controlled autonomous bot capable of traversing complex mazes and variable elevation tracks in 28.4 seconds.",
      excerptBn: "পিআইডি কন্ট্রোলার ও মাইক্রোকন্ট্রোলার দিয়ে তৈরি দ্রুতগতির স্বয়ংক্রিয় রোবট নিয়ে জাতীয় রোবোটিক্স প্রতিযোগিতায় রানার্স আপ।",
      content: `### High-Speed Robotics Performance

Our robotics sub-wing developed an ultra-lightweight custom carbon-fiber chassis with calibrated sensor arrays and customized motor driver circuitry.`,
      contentBn: `### রোবোটিক্সে সাফল্য

কাস্টম সেন্সর অ্যারে এবং অপ্টিমাইজড সি++ কোড ব্যবহারের মাধ্যমে মেজ নেভিগেশন ও লাইন ট্র্যাকিংয়ে অনন্য পারফরম্যান্স।`,
      publishedAt: new Date("2025-12-12"),
      userIndex: 0,
    },

    // 12. Google Solution Challenge Regional Semifinalist
    {
      title: "Regional Semifinalist - Google Solution Challenge 2025",
      titleBn: "আঞ্চলিক সেমিফাইনালিস্ট - গুগল সল্যুশন চ্যালেঞ্জ ২০২৫",
      slug: "regional-semifinalist-google-solution-challenge-2025",
      organization: "Google Developer Groups (GDG)",
      organizationBn: "গুগল ডেভেলপার গ্রুপ",
      eventDate: new Date("2025-06-15"),
      categoryId: getCatId("hackathons"),
      tags: ["Google", "Flutter", "Firebase", "UNSDG"],
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://developers.google.com/community/gdsc-solution-challenge",
      excerpt: "Top 50 in Asia-Pacific region for creating 'EcoDrop' — an IoT smart-bin and community recycling incentive app supporting UN Sustainable Development Goals.",
      excerptBn: "জাতিসংঘের টেকসই উন্নয়ন লক্ষ্যমাত্রায় সহায়তা করতে তৈরি স্মার্ট বর্জ্য ব্যবস্থাপনা ও রিসাইক্লিং অ্যাপের জন্য এশিয়া-প্যাসিফিক অঞ্চলে শীর্ষ ৫০ এ স্থান।",
      content: `### Building with Flutter & Google Cloud

EcoDrop gamified domestic waste segregation through Flutter, Firebase Cloud Functions, and computer vision classification.`,
      contentBn: `### গুগল সল্যুশন চ্যালেঞ্জে অর্জন

ফ্লাটার ও গুগল ক্লাউড ব্যবহার করে পরিবেশবান্ধব টেকসই অ্যাপ তৈরির জন্য আন্তর্জাতিক অঙ্গনে প্রশংসা লাভ।`,
      publishedAt: new Date("2025-06-18"),
      userIndex: 1,
    },

    // 13. Red Hat Certified System Administrator (RHCSA)
    {
      title: "Red Hat Certified System Administrator (RHCSA)",
      titleBn: "রেড হ্যাট সার্টিফাইড সিস্টেম অ্যাডমিনিস্ট্রেটর (আরএইচসিএসএ)",
      slug: "red-hat-certified-system-administrator-rhcsa",
      organization: "Red Hat Inc.",
      organizationBn: "রেড হ্যাট ইনকর্পোরেটেড",
      eventDate: new Date("2025-05-10"),
      categoryId: getCatId("certifications"),
      tags: ["Linux", "RedHat", "RHCSA", "Sysadmin"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://www.redhat.com/en/services/certification/rhcsa",
      excerpt: "Achieved full 300/300 score in the EX200 exam verifying deep mastery in Red Hat Enterprise Linux system configuration, SELinux, and storage.",
      excerptBn: "রেড হ্যাট এন্টারপ্রাইজ লিনাক্স (RHEL) পরীক্ষায় পূর্ণ ৩০০ নম্বর পেয়ে আন্তর্জাতিক সিস্টেম অ্যাডমিনিস্ট্রেশনের শীর্ষ সনদ অর্জন।",
      content: `### Perfect Score on Red Hat EX200

Demonstrated production expertise in storage partitions, LVM management, systemd services, SELinux policy troubleshooting, and shell automation.`,
      contentBn: `### রেড হ্যাট লিনাক্স সার্টিফিকেশন

সার্ভার ব্যবস্থাপনা, নিরাপত্তা নীতিমালা এবং লিনাক্স কার্নেল টিউনিংয়ে বিশ্বস্ত পেশাদার যোগ্যতা প্রমাণ।`,
      publishedAt: new Date("2025-05-12"),
      userIndex: 2,
    },

    // 14. 1st Place - Dhaka Division Skill Fest 2025
    {
      title: "1st Place - Dhaka Division Technical Project Fair 2025",
      titleBn: "১ম স্থান - ঢাকা বিভাগীয় টেকনিক্যাল প্রজেক্ট ফেয়ার ২০২৫",
      slug: "1st-place-dhaka-division-project-fair-2025",
      organization: "Dhaka Divisional Administration & DTE",
      organizationBn: "ঢাকা বিভাগীয় কমিশনারের কার্যালয়",
      eventDate: new Date("2025-04-20"),
      categoryId: getCatId("skills-awards"),
      tags: ["Dhaka", "ProjectFair", "Hardware", "IoT"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://example.com/project-fair-2025",
      excerpt: "Champion across 13 districts for a low-cost automated hospital ventilator telemetry and remote patient monitoring unit.",
      excerptBn: "১৩টি জেলার প্রযুক্তিপ্রেমী শিক্ষার্থীদের সাথে প্রতিদ্বন্দ্বিতা করে দূরবর্তী রোগী পর্যবেক্ষণ ও টেলিমেট্রি প্রজেক্টে চ্যাম্পিয়ন।",
      content: `### Healthcare Engineering Excellence

Engineered an ESP32 and MQTT based biometrics sensor node transmitting real-time SpO2, pulse, and temperature to a local emergency dashboard.`,
      contentBn: `### স্বাস্থ্যপ্রযুক্তিতে উদ্ভাবনী স্বীকৃতি

স্বল্পমূল্যের চিকিৎসা পর্যবেক্ষণ ডিভাইস ও মোবাইল নোটিফিকেশন সিস্টেম তৈরির জন্য ঢাকা বিভাগে প্রথম স্থান অধিকার।`,
      publishedAt: new Date("2025-04-22"),
      userIndex: 3,
    },

    // 15. Cisco Certified Network Associate (CCNA)
    {
      title: "Cisco Certified Network Associate (CCNA 200-301)",
      titleBn: "সিসকো সার্টিফাইড নেটওয়ার্ক অ্যাসোসিয়েট (সিসিএনএ)",
      slug: "cisco-certified-network-associate-ccna",
      organization: "Cisco Systems",
      organizationBn: "সিসকো সিস্টেমস",
      eventDate: new Date("2025-03-12"),
      categoryId: getCatId("certifications"),
      tags: ["Cisco", "Networking", "CCNA", "Routing"],
      isFeatured: false,
      status: PostStatus.PUBLISHED,
      coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://www.cisco.com/c/en/us/training-events/career-certifications/associate/ccna.html",
      excerpt: "Validated deep networking foundations: IPv4/IPv6 subnetting, OSPF routing, VLAN trunking, wireless LAN controllers, and network automation with Python.",
      excerptBn: "সিসকোর পেশাদার নেটওয়ার্কিং সনদ অর্জন: আইপি রাউটিং, সুইচিং, ওএসপিএফ এবং নেটওয়ার্ক অটোমেশনের আন্তর্জাতিক স্বীকৃতি।",
      content: `### Certified in Enterprise Networking

Covers IP services, security fundamentals, enterprise campus design, and automated network infrastructure scripting.`,
      contentBn: `### সিসকো সিসিএনএ নেটওয়ার্কিং সনদ

আধুনিক কম্পিউটার নেটওয়ার্ক ডিজাইন, সুইচিং, রাউটিং ও সাইবার নিরাপত্তার আন্তর্জাতিক স্ট্যান্ডার্ড সম্পন্ন।`,
      publishedAt: new Date("2025-03-15"),
      userIndex: 4,
    },

    // 16. [PENDING REVIEW 1] For admin review queue testing
    {
      title: "Winner - National Cyber Security Capture The Flag (CTF) 2026",
      titleBn: "বিজয়ী - জাতীয় সাইবার সিকিউরিটি সিটিএফ ২০২৬",
      slug: "winner-national-cyber-security-ctf-2026",
      organization: "Cyber Security Association & CIRT",
      organizationBn: "জাতীয় সাইবার নিরাপত্তা সংস্থা",
      eventDate: new Date("2026-03-25"),
      categoryId: getCatId("programming-contests"),
      tags: ["CyberSecurity", "CTF", "ReverseEngineering", "WebExploitation"],
      isFeatured: false,
      status: PostStatus.PENDING,
      submittedAt: new Date("2026-03-26"),
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://example.com/ctf-winner-2026",
      excerpt: "Secured 1st place in the 24-hour national CTF by solving forensic analysis, reverse engineering binary payloads, and discovering zero-day vulnerabilities in simulated environments.",
      excerptBn: "জাতীয় সাইবার সিকিউরিটি সিটিএফ প্রতিযোগিতায় রিভার্স ইঞ্জিনিয়ারিং ও সিস্টেম পেনিট্রেশন টেস্টিংয়ে শ্রেষ্ঠত্ব প্রমাণ করে প্রথম স্থান অর্জন।",
      content: `### 24 Hours of Intensive Exploitation

Solved complex heap overflow challenges, binary exploitation, and extracted hidden flags from encrypted memory dumps.`,
      contentBn: `### সাইবার নিরাপত্তায় শ্রেষ্ঠত্ব

২৪ ঘণ্টার চ্যালেঞ্জিং প্রতিযোগিতায় নিরাপত্তা ত্রুটি খুঁজে বের করা এবং সমাধান প্রদানে শীর্ষস্থান অর্জন।`,
      publishedAt: null,
      userIndex: 0,
    },

    // 17. [PENDING REVIEW 2] For admin review queue testing
    {
      title: "Top 3 Finalist - Huawei ICT Competition 2026 (Network Track)",
      titleBn: "শীর্ষ ৩ ফাইনালিস্ট - হুয়াওয়ে আইসিটি কম্পিটিশন ২০২৬",
      slug: "top-3-finalist-huawei-ict-competition-2026",
      organization: "Huawei Technologies Bangladesh",
      organizationBn: "হুয়াওয়ে টেকনোলজিস বাংলাদেশ",
      eventDate: new Date("2026-03-18"),
      categoryId: getCatId("certifications"),
      tags: ["Huawei", "ICT", "5G", "OpticalNetwork"],
      isFeatured: false,
      status: PostStatus.PENDING,
      submittedAt: new Date("2026-03-19"),
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "https://e.huawei.com/en/talent/ict-academy/#/ict-contest",
      excerpt: "Qualified for regional Asia-Pacific stage of Huawei ICT Competition after grueling national rounds covering datacom and optical transport.",
      excerptBn: "হুয়াওয়ে জাতীয় আইসিটি প্রতিযোগিতায় শীর্ষ ৩ দলের মধ্যে স্থান পেয়ে আন্তর্জাতিক পর্বে অংশগ্রহণের সুযোগ লাভ।",
      content: `### Huawei Network Track Finalist

Tested on enterprise campus fabrics, WLAN optimization, and IPv6 segment routing protocols under enterprise traffic constraints.`,
      contentBn: `### হুয়াওয়ে আইসিটি কম্পিটিশনে সাফল্য

উন্নত ডেটাকম এবং অপটিক্যাল নেটওয়ার্কিং প্রযুক্তিতে শ্রেষ্ঠত্ব দেখিয়ে জাতীয় পর্যায়ে মনোনয়ন লাভ।`,
      publishedAt: null,
      userIndex: 1,
    },

    // 18. [DRAFT 1] For author profile testing
    {
      title: "Draft - Published Research Paper on IoT Precision Agriculture",
      titleBn: "খসড়া - আইওটি ভিত্তিক নির্ভুল কৃষির উপর গবেষণা প্রবন্ধ",
      slug: "draft-research-paper-iot-precision-agriculture",
      organization: "IEEE International Conference on Informatics",
      organizationBn: "আইইইই আন্তর্জাতিক ইনফরম্যাটিক্স কনফারেন্স",
      eventDate: new Date("2026-04-01"),
      categoryId: getCatId("project-showcases"),
      tags: ["Research", "IEEE", "IoT", "Draft"],
      isFeatured: false,
      status: PostStatus.DRAFT,
      coverImage: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "",
      excerpt: "Working draft documenting our experimental deployment of solar-powered soil moisture and NPK sensor meshes in rural Gazipur paddy fields.",
      excerptBn: "গবেষণা ও মাঠপর্যায়ের ট্রায়াল শেষে আইইইই কনফারেন্সের জন্য প্রস্তুতকৃত গবেষণাপত্রের সারসংক্ষেপ।",
      content: `### Experimental Methodology & Sensor Calibration

This is currently in draft preparation before conference presentation and final peer review.`,
      contentBn: `### গবেষণা পদ্ধতি ও পরীক্ষার ফলাফল

চূড়ান্ত পেপার উপস্থাপনার পূর্বে প্রাথমিক খসড়া প্রস্তুত রাখা হয়েছে।`,
      publishedAt: null,
      userIndex: 0,
    },

    // 19. [DRAFT 2] For author profile testing
    {
      title: "Draft - Complete Microservices Architecture Mastery Course",
      titleBn: "খসড়া - মাইক্রোসার্ভিসেস আর্কিটেকচার মাস্টারক্লাস সম্পন্ন",
      slug: "draft-microservices-architecture-mastery",
      organization: "Udemy & Linux Foundation",
      organizationBn: "উডেমি ও লিনাক্স ফাউন্ডেশন",
      eventDate: new Date("2026-03-10"),
      categoryId: getCatId("certifications"),
      tags: ["Microservices", "Docker", "Draft"],
      isFeatured: false,
      status: PostStatus.DRAFT,
      coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "",
      excerpt: "Completed 60+ hours of advanced microservices patterns, event-sourcing with Kafka, and gRPC inter-service communication.",
      excerptBn: "কাফকা, জিআরপিসি ও ইভেন্ট-ড্রিভেন আর্কিটেকচারের উপর ৬০ ঘণ্টার গভীর কোর্স সম্পন্ন করার খসড়া।",
      content: `### Draft Details

Currently uploading certificates and project repositories before submitting for verification.`,
      contentBn: `### বিস্তারিত খসড়া

যাচাইয়ের জন্য জমা দেওয়ার আগে সার্টিফিকেট এবং প্রজেক্টের কোড রিপোজিটরি যুক্ত করা হচ্ছে।`,
      publishedAt: null,
      userIndex: 1,
    },

    // 20. [REJECTED] For author "Needs work" tab & feedback testing
    {
      title: "Winner - Local Coding Contest (Sample Submission)",
      titleBn: "বিজয়ী - স্থানীয় কোডিং প্রতিযোগিতা (নমুনা জমাদান)",
      slug: "winner-local-coding-contest-sample-submission",
      organization: "Local Tech Club",
      organizationBn: "স্থানীয় টেক ক্লাব",
      eventDate: new Date("2026-02-01"),
      categoryId: getCatId("programming-contests"),
      tags: ["Contest", "Testing"],
      isFeatured: false,
      status: PostStatus.REJECTED,
      massageForAuthor: "Please upload an official certificate or signed letter of recognition from the event organizers, and provide a higher resolution cover photo.",
      coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
      images: [],
      certificateUrl: "",
      excerpt: "Sample achievement submitted to test the moderation and rejection feedback cycle between administrators and members.",
      excerptBn: "অ্যাডমিন ও সদস্যের মধ্যে সংশোধন ও ফিডব্যাক সাইকেল পরীক্ষার জন্য একটি নমুনা জমাদান।",
      content: `### Test Submission

This item is marked as REJECTED so that authors can test viewing admin feedback, editing the content, and re-submitting for review.`,
      contentBn: `### টেস্ট জমাদান

এই আইটেমটিতে অ্যাডমিনের ফিডব্যাক দেখতে পাবেন এবং এডিট করে পুনরায় সাবমিট করার সুবিধা পরীক্ষা করতে পারবেন।`,
      publishedAt: null,
      reviewedAt: new Date("2026-02-05"),
      userIndex: 0,
    },
  ]

  let createdCount = 0
  let updatedCount = 0

  for (const item of achievements) {
    const author = getUser(item.userIndex)
    const existing = await prisma.achievement.findUnique({
      where: { slug: item.slug },
    })

    const payload = {
      title: item.title,
      titleBn: item.titleBn,
      slug: item.slug,
      organization: item.organization,
      organizationBn: item.organizationBn,
      eventDate: item.eventDate,
      categoryId: item.categoryId,
      tags: item.tags,
      isFeatured: item.isFeatured,
      status: item.status,
      massageForAuthor: item.massageForAuthor || null,
      coverImage: item.coverImage,
      images: item.images,
      certificateUrl: item.certificateUrl,
      excerpt: item.excerpt,
      excerptBn: item.excerptBn,
      content: item.content,
      contentBn: item.contentBn,
      publishedAt: item.publishedAt,
      reviewedAt: item.status === PostStatus.PUBLISHED ? (item.publishedAt ?? new Date()) : null,
      submittedAt: ("submittedAt" in item && item.submittedAt) ? item.submittedAt : null,
      authorId: author.id,
    }

    if (existing) {
      await prisma.achievement.update({
        where: { id: existing.id },
        data: payload,
      })
      updatedCount++
    } else {
      await prisma.achievement.create({
        data: payload,
      })
      createdCount++
    }
  }

  console.log(`\n Successfully seeded achievements!`)
  console.log(`- Created: ${createdCount}`)
  console.log(`- Updated: ${updatedCount}`)
  console.log(`- Total: ${achievements.length}`)
  console.log(`- Published: 15 items (visible on /achievements)`)
  console.log(`- In Review: 2 items (visible on /admin/achievements review queue)`)
  console.log(`- Drafts: 2 items (visible on author profile)`)
  console.log(`- Rejected: 1 item (with admin note, visible under Needs work)`)
}

seedAchievements()
  .catch((e) => {
    console.error("Error seeding achievements:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
