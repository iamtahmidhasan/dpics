import "dotenv/config"

import prisma from "../src/lib/prisma"
import { CategoryType, PostStatus } from "../src/generated/prisma/enums"
import { resolveUserImage } from "../src/lib/user-image"

async function seedDummyProject() {
  console.log("Seeding realistic student engineering project...")

  // 1. Find author user (Member or Admin)
  const authorUser =
    (await prisma.user.findFirst({
      where: {
        roles: { hasSome: ["MEMBER", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] },
      },
    })) ?? (await prisma.user.findFirst())

  if (!authorUser) {
    throw new Error("No user found in the database to author the dummy project.")
  }

  console.log(`Author: ${authorUser.name} (${authorUser.email})`)

  // 2. Ensure Category exists for Project
  let category = await prisma.category.findFirst({
    where: { type: CategoryType.PROJECT, slug: "robotics-iot" },
  })

  if (!category) {
    category = await prisma.category.upsert({
      where: {
        type_slug: {
          type: CategoryType.PROJECT,
          slug: "robotics-iot",
        },
      },
      update: {},
      create: {
        type: CategoryType.PROJECT,
        name: "Robotics & IoT",
        nameBn: "রোবোটিক্স ও আইওটি",
        slug: "robotics-iot",
        description: "Hardware prototypes, embedded systems, microcontrollers, and autonomous robotics projects.",
        isActive: true,
      },
    })
  }

  // 3. Fetch active approved members for Team Members
  const activeMembers = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    include: { user: true },
    take: 3,
  })

  const teamMembers =
    activeMembers.length > 0
      ? activeMembers.map((m, index) => {
          const { avatar } = resolveUserImage(m.user.image, m.user.selactedImg)
          const roles = [
            "Lead Firmware & Hardware Engineer",
            "SLAM & Navigation Algorithm Specialist",
            "Telemetry Dashboard & WebSockets Developer",
          ]
          return {
            name: m.user.name,
            role: roles[index] || "Contributor",
            studentId: m.studentId ?? `2024-DPI-${100 + index}`,
            department: m.department ?? "Computer Technology",
            userId: m.userId,
            avatar: avatar || undefined,
            profileUrl: `/members/${m.userId}`,
            githubUrl: `https://github.com/${m.user.name.toLowerCase().replace(/\s+/g, "")}`,
          }
        })
      : [
          {
            name: "Tahmid Hasan",
            role: "Lead Firmware & Hardware Engineer",
            studentId: "512401",
            department: "Computer Technology",
            githubUrl: "https://github.com/iamtahmidhasan",
          },
          {
            name: "Sabbir Ahmed",
            role: "SLAM & Navigation Algorithm Specialist",
            studentId: "512415",
            department: "Electronics Technology",
            githubUrl: "https://github.com/sabbir-ahmed",
          },
          {
            name: "Ayesha Siddiqua",
            role: "Telemetry Dashboard & WebSockets Developer",
            studentId: "512432",
            department: "Computer Technology",
            githubUrl: "https://github.com/ayesha-siddiqua",
          },
        ]

  // 4. Project Markdown Descriptions
  const descriptionEn = `
## Project Overview

The **Autonomous Obstacle-Avoiding & Warehouse Mapping Robot** is an autonomous mobile robot (AMR) designed and built by student engineers at **Dhaka Polytechnic Institute**. 

The system leverages **ROS 2 (Robot Operating System)** on a single-board computer combined with an **ESP32 microcontroller** for low-level motor PID control, sensor fusion, and real-time obstacle avoidance. The robot autonomously navigates through unknown indoor environments, maps the floor using a 360-degree **RPLiDAR A1M8**, and transmits live telemetry data to a centralized web-based control room.

---

### System Architecture

The robot's architecture is divided into three distinct operational layers:

\`\`\`
+---------------------------------------------------------------+
|                      Cloud / Web Tier                         |
|   Next.js 16 + WebSockets Live Control Dashboard & Mapping    |
+---------------------------------------------------------------+
                               ^
                               | MQTT / WebSockets (Wi-Fi)
                               v
+---------------------------------------------------------------+
|                   High-Level Compute Tier                     |
|           Raspberry Pi 4 (4GB) running ROS 2 Humble           |
|  - Slam Toolbox (2D SLAM Mapping)                            |
|  - Nav2 Navigation Stack (Costmaps, DWB Path Planner)        |
|  - Micro-ROS Agent                                           |
+---------------------------------------------------------------+
                               ^
                               | UART / Serial
                               v
+---------------------------------------------------------------+
|                    Low-Level Hardware Tier                    |
|                      ESP32 Microcontroller                    |
|  - Dual DC Gear Motors with Optical Encoders (PID Control)   |
|  - MPU-6050 6-DOF IMU (Odometry Fusion with Kalman Filter)   |
|  - Ultrasonic & IR Proximity Arrays                          |
+---------------------------------------------------------------+
\`\`\`

---

### Key Technical Features

1. **Simultaneous Localization and Mapping (SLAM):**
   - Utilizes \`slam_toolbox\` in synchronous online mapping mode to produce high-resolution grid maps of campus labs and corridors.
2. **Dynamic Obstacle Avoidance:**
   - Real-time global and local costmap generation with inflation layers to reliably avoid moving personnel and furniture.
3. **Hardware-in-the-Loop PID Tuning:**
   - Wheel encoders provide 1,200 pulses per revolution (PPR), giving 0.5 mm wheel positional accuracy.
4. **Real-time Telemetry Web Interface:**
   - Built with Next.js, HTML5 Canvas, and WebSockets. Operators can set destination waypoints on the canvas map, trigger emergency stops, and monitor battery voltage in real time.

---

### Hardware Bill of Materials (BOM)

| Component | Specification | Function |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32D Dual Core | Motor control & sensor sampling |
| **SBC** | Raspberry Pi 4 Model B (4GB RAM) | High-level ROS 2 navigation & SLAM |
| **LiDAR Sensor** | Slamtec RPLiDAR A1M8 (360° 12m) | Laser scan 2D environmental mapping |
| **IMU** | MPU-6050 (Accelerometer + Gyroscope) | Robot orientation & angular velocity |
| **Motors** | 12V 350 RPM Geared DC Motors with Encoders | Differential drive locomotion |
| **Motor Driver** | L298N Dual H-Bridge Module | High-current PWM motor driving |
| **Power Supply** | 3S 11.1V 2200mAh LiPo Battery + Buck Converter | Regulated 5V & 12V power rails |

---

### Code Highlights: Micro-ROS Velocity Subscriber

Below is a snippet of the ESP32 firmware running Micro-ROS to receive \`geometry_msgs/msg/Twist\` velocity targets:

\`\`\`c
#include <micro_ros_arduino.h>
#include <rcl/rcl.h>
#include <geometry_msgs/msg/twist.h>

rcl_subscription_t subscriber;
geometry_msgs__msg__Twist msg;

void subscription_callback(const void * msin) {
  const geometry_msgs__msg__Twist * twist = (const geometry_msgs__msg__Twist *)msin;
  float linear_x = twist->linear.x;
  float angular_z = twist->angular.z;
  
  // Calculate left and right wheel target velocities
  set_motor_speeds(linear_x, angular_z);
}
\`\`\`

---

### Achievements & Outcomes

- **Lab Testing Accuracy:** Successfully mapped a 1,500 sq. ft. laboratory floor within 4 minutes with less than 2% dimensional error.
- **Battery Life:** Up to 2.5 hours of continuous operation under active LiDAR scanning.
- **Showcase:** Presented at the annual Dhaka Polytechnic Institute Engineering Fair 2026.
`

  const descriptionBn = `
## প্রজেক্টের সারসংক্ষেপ

**স্বয়ংক্রিয় অবস্ট্যাকল এভয়েডিং ও ওয়্যারহাউস ম্যাপিং রোবট** ঢাকা পলিটেকনিক ইনস্টিটিউটের শিক্ষার্থী ইঞ্জিনিয়ারদের দ্বারা উদ্ভাবিত ও নির্মিত একটি স্বয়ংক্রিয় মোবাইল রোবট (AMR)।

সিস্টেমটি উচ্চগতির সেন্সর ফিউশন, লিডার ম্যাপিং এবং পাথ প্ল্যানিংয়ের জন্য **ROS 2 (Robot Operating System)** ব্যবহার করে। রোবটটি অচেনা ক্যাম্পাসের করিডোর ও ওয়্যারহাউসে একা একা ঘুরে বেরাতে পারে, ৩৬০ ডিগ্রি **RPLiDAR A1M8** সেন্সরের সাহায্যে চারপাশের নকশা (2D Grid Map) তৈরি করে এবং ক্লাউড কন্ট্রোল সেন্টারে লাইভ ডেটা পাঠায়।

---

### প্রধান বৈশিষ্ট্যসমূহ

1. **রিয়েল-টাইম স্ল্যাম ম্যাপিং (SLAM):** \`slam_toolbox\` অ্যালগরিদম ব্যবহার করে নিখুঁত ফ্লোর প্ল্যান তৈরি করে।
2. **স্বয়ংক্রিয় বাধা এড়িয়ে চলা:** গতিশীল মানুষ বা আসবাবপত্র শনাক্ত করে নিরাপদ দূরত্ব বজায় রেখে চলাচল করে।
3. **ওয়েব কন্ট্রোল রুম:** নেক্সট.জেএস এবং ওয়েব-সকেটের মাধ্যমে ব্রাউজার থেকেই রোবটের লাইভ অবস্থান দেখা ও ড্রাইভ করা যায়।
4. **হাই-প্রিসিশন পিআইডি কন্ট্রোল:** মোটরের সাথে অপটিক্যাল এনকোডার যুক্ত থাকায় প্রতি মিলিমিটার গতি নিয়ন্ত্রণ সম্ভব।
`

  // 5. Create or Upsert Project
  const slug = "autonomous-obstacle-avoiding-robot"

  const project = await prisma.project.upsert({
    where: { slug },
    update: {
      title: "Autonomous Obstacle-Avoiding & Warehouse Mapping Robot",
      titleBn: "স্বয়ংক্রিয় অবস্ট্যাকল এভয়েডিং ও ওয়্যারহাউস ম্যাপিং রোবট",
      excerpt:
        "A 4WD autonomous mobile robot (AMR) engineered with ROS 2 Humble, RPLiDAR A1, and ESP32 for real-time 2D SLAM floor mapping and smart collision avoidance.",
      excerptBn:
        "আরওএস ২ (ROS 2), লিডার (LiDAR) সেন্সর এবং ইএসপি৩২ মাইক্রোকন্ট্রোলারের সমন্বয়ে তৈরি একটি স্বয়ংক্রিয় রোবট যা ইনডোর ম্যাপিং ও স্বয়ংক্রিয় চলাচলে সক্ষম।",
      description: descriptionEn.trim(),
      descriptionBn: descriptionBn.trim(),
      coverImage:
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
      ],
      liveUrl: "https://dpi-robotics.vercel.app",
      githubUrl: "https://github.com/dpics/autonomous-amr-robot",
      youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      techStack: [
        "ROS 2",
        "ESP32",
        "LiDAR",
        "Python",
        "C++",
        "Next.js",
        "WebSockets",
        "Arduino",
        "Tailwind CSS",
      ],
      tags: ["robotics", "ros2", "slam", "lidar", "esp32", "iot", "autonomous"],
      teamMembers,
      categoryId: category.id,
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: authorUser.id,
    },
    create: {
      title: "Autonomous Obstacle-Avoiding & Warehouse Mapping Robot",
      titleBn: "স্বয়ংক্রিয় অবস্ট্যাকল এভয়েডিং ও ওয়্যারহাউস ম্যাপিং রোবট",
      slug,
      excerpt:
        "A 4WD autonomous mobile robot (AMR) engineered with ROS 2 Humble, RPLiDAR A1, and ESP32 for real-time 2D SLAM floor mapping and smart collision avoidance.",
      excerptBn:
        "আরওএস ২ (ROS 2), লিডার (LiDAR) সেন্সর এবং ইএসপি৩২ মাইক্রোকন্ট্রোলারের সমন্বয়ে তৈরি একটি স্বয়ংক্রিয় রোবট যা ইনডোর ম্যাপিং ও স্বয়ংক্রিয় চলাচলে সক্ষম।",
      description: descriptionEn.trim(),
      descriptionBn: descriptionBn.trim(),
      coverImage:
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
      ],
      liveUrl: "https://dpi-robotics.vercel.app",
      githubUrl: "https://github.com/dpics/autonomous-amr-robot",
      youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      techStack: [
        "ROS 2",
        "ESP32",
        "LiDAR",
        "Python",
        "C++",
        "Next.js",
        "WebSockets",
        "Arduino",
        "Tailwind CSS",
      ],
      tags: ["robotics", "ros2", "slam", "lidar", "esp32", "iot", "autonomous"],
      teamMembers,
      categoryId: category.id,
      isFeatured: true,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: authorUser.id,
    },
  })

  console.log(`Successfully seeded dummy project!`)
  console.log(`ID: ${project.id}`)
  console.log(`Title: ${project.title}`)
  console.log(`Slug: ${project.slug}`)
  console.log(`Status: ${project.status}`)
  console.log(`Category: ${category.name}`)
  console.log(`Team Members: ${teamMembers.length}`)
}

seedDummyProject()
  .catch((err) => {
    console.error("Error seeding dummy project:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
