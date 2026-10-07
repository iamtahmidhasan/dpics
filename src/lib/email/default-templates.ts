import { EmailCategory } from "@/generated/prisma/enums"

export interface SystemTemplateDefinition {
  key: string
  name: string
  category: EmailCategory
  description: string
  subject: string
  bodyHtml: string
  variables: string[]
}

export const DEFAULT_EMAIL_TEMPLATES: SystemTemplateDefinition[] = [
  // ==========================================
  // A. COURSE ENROLLMENTS
  // ==========================================
  {
    key: "COURSE_ENROLLMENT_SUBMITTED",
    name: "Course Enrollment Submitted (Paid)",
    category: EmailCategory.ENROLLMENT,
    description: "Sent to student when they submit payment details for a paid course",
    subject: "Enrollment Received for {{courseTitle}} - Verification Pending",
    variables: ["userName", "courseTitle", "amountPaid", "paymentMethod", "transactionId", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Thank you for enrolling in <strong>{{courseTitle}}</strong> at DPI Computing Society.</p>
<p>We have received your payment details:</p>
<div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
  <p style="margin: 4px 0;"><strong>Course:</strong> {{courseTitle}}</p>
  <p style="margin: 4px 0;"><strong>Amount:</strong> ৳{{amountPaid}}</p>
  <p style="margin: 4px 0;"><strong>Method:</strong> {{paymentMethod}}</p>
  <p style="margin: 4px 0;"><strong>Transaction ID:</strong> {{transactionId}}</p>
</div>
<p>Our team is verifying your transaction. You will receive an email as soon as your access is activated.</p>
<p><a href="{{siteUrl}}/dashboard" class="button">Go to Dashboard</a></p>
    `,
  },
  {
    key: "COURSE_ENROLLMENT_ACTIVE",
    name: "Course Enrollment Approved",
    category: EmailCategory.ENROLLMENT,
    description: "Sent to student when their course enrollment is approved or for free courses",
    subject: "Enrollment Approved: You now have full access to {{courseTitle}}!",
    variables: ["userName", "courseTitle", "courseUrl", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Great news! Your enrollment in <strong>{{courseTitle}}</strong> has been verified and approved.</p>
<p>You can now access all course materials, video lessons, quizzes, and resources.</p>
<p style="margin: 24px 0;">
  <a href="{{courseUrl}}" class="button">Start Learning Now</a>
</p>
<p>If you encounter any issues accessing the curriculum, please reply to this email or reach out to community instructors.</p>
    `,
  },
  {
    key: "COURSE_ENROLLMENT_REJECTED",
    name: "Course Enrollment Rejected",
    category: EmailCategory.ENROLLMENT,
    description: "Sent to student when paid enrollment could not be verified",
    subject: "Notice regarding your enrollment for {{courseTitle}}",
    variables: ["userName", "courseTitle", "adminNote", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>We were unable to approve your enrollment request for <strong>{{courseTitle}}</strong>.</p>
<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #991b1b;">
  <p style="margin: 4px 0;"><strong>Reason:</strong> {{adminNote}}</p>
</div>
<p>Please check your payment information or transaction ID. You can resubmit your enrollment request from the course page.</p>
<p><a href="{{siteUrl}}/courses" class="button">Browse Courses</a></p>
    `,
  },
  {
    key: "COURSE_ENROLLMENT_CANCELLED",
    name: "Course Enrollment Cancelled",
    category: EmailCategory.ENROLLMENT,
    description: "Sent to student if their course enrollment was cancelled",
    subject: "Enrollment Cancelled for {{courseTitle}}",
    variables: ["userName", "courseTitle", "reason", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>This is to inform you that your enrollment in <strong>{{courseTitle}}</strong> has been cancelled.</p>
<p>If you believe this was an error, please contact the DPICS administration.</p>
    `,
  },

  // ==========================================
  // B. MEMBERSHIPS & VERIFICATION
  // ==========================================
  {
    key: "MEMBERSHIP_APPLICATION_SUBMITTED",
    name: "Membership Application Received",
    category: EmailCategory.MEMBERSHIP,
    description: "Sent when a user completes onboarding as a Member",
    subject: "DPICS Membership Application Received",
    variables: ["userName", "studentId", "department", "session", "semester", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Welcome to <strong>DPI Computing Society</strong>! Your membership application has been submitted successfully.</p>
<div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
  <p style="margin: 4px 0;"><strong>Assigned ID / Ref:</strong> {{studentId}}</p>
  <p style="margin: 4px 0;"><strong>Department:</strong> {{department}}</p>
  <p style="margin: 4px 0;"><strong>Semester:</strong> {{semester}}</p>
  <p style="margin: 4px 0;"><strong>Session:</strong> {{session}}</p>
</div>
<p>Our executive committee will review your student identification details. You will receive an email once verification is completed.</p>
    `,
  },
  {
    key: "MEMBERSHIP_VERIFIED",
    name: "Membership Verified & Approved",
    category: EmailCategory.MEMBERSHIP,
    description: "Sent to member when verification is approved and status is ACTIVE",
    subject: "Congratulations! Your DPICS Membership is Verified (ID: {{studentId}})",
    variables: ["userName", "studentId", "department", "portalUrl", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>We are delighted to welcome you as an official member of the <strong>DPI Computing Society (DPICS)</strong>!</p>
<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #065f46;">
  <p style="margin: 4px 0; font-size: 16px;"><strong>Member ID:</strong> <span style="font-family: monospace; font-size: 18px;">{{studentId}}</span></p>
  <p style="margin: 4px 0;"><strong>Department:</strong> {{department}}</p>
  <p style="margin: 4px 0;"><strong>Status:</strong> Active Member</p>
</div>
<p>As a verified member, you now have full access to member-only workshops, tech sessions, mentorship programs, and society voting privileges.</p>
<p style="margin: 24px 0;">
  <a href="{{portalUrl}}" class="button">Visit Member Portal</a>
</p>
    `,
  },
  {
    key: "MEMBERSHIP_REJECTED",
    name: "Membership Verification Rejected",
    category: EmailCategory.MEMBERSHIP,
    description: "Sent to member when verification is rejected",
    subject: "Action Required: DPICS Membership Verification Update",
    variables: ["userName", "rejectionReason", "supportEmail", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Your DPI Computing Society membership verification could not be approved at this time.</p>
<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #991b1b;">
  <p style="margin: 4px 0;"><strong>Note from Admin:</strong> {{rejectionReason}}</p>
</div>
<p>Please update your student ID card photo or roll number in your profile, or reply to this email for assistance.</p>
<p><a href="{{siteUrl}}/profile" class="button">Update Profile</a></p>
    `,
  },
  {
    key: "MEMBERSHIP_SUSPENDED",
    name: "Membership Suspended",
    category: EmailCategory.MEMBERSHIP,
    description: "Sent when an admin suspends a member",
    subject: "Notice: DPICS Membership Suspension",
    variables: ["userName", "suspensionReason", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>This is to inform you that your membership status at DPI Computing Society has been temporarily suspended.</p>
<p><strong>Reason:</strong> {{suspensionReason}}</p>
<p>If you have any questions regarding this action, please contact the executive committee.</p>
    `,
  },
  {
    key: "MEMBERSHIP_EXPIRED",
    name: "Membership Expired / Renewal Notice",
    category: EmailCategory.MEMBERSHIP,
    description: "Sent when member validity has ended",
    subject: "Your DPICS Membership Has Expired - Renewal Available",
    variables: ["userName", "studentId", "renewalUrl", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Your membership validity for Member ID <strong>{{studentId}}</strong> has ended.</p>
<p>To continue enjoying uninterrupted member benefits, please renew your membership.</p>
<p><a href="{{renewalUrl}}" class="button">Renew Membership</a></p>
    `,
  },
  {
    key: "MEMBERSHIP_FEE_CONFIRMED",
    name: "Membership Fee Payment Received",
    category: EmailCategory.MEMBERSHIP,
    description: "Sent to member when their annual/registration fee is confirmed by administration",
    subject: "Membership Fee Confirmed - DPI Computing Society",
    variables: ["userName", "studentId", "department", "amount", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>We are pleased to inform you that your membership fee payment for Member ID <strong>{{studentId}}</strong> has been confirmed.</p>
<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #065f46;">
  <p style="margin: 4px 0;"><strong>Member ID:</strong> {{studentId}}</p>
  <p style="margin: 4px 0;"><strong>Department:</strong> {{department}}</p>
  <p style="margin: 4px 0;"><strong>Payment Status:</strong> Paid & Verified</p>
</div>
<p>Your membership is fully active. Thank you for your continued contribution to the community!</p>
<p><a href="{{siteUrl}}/profile" class="button">View Member Profile</a></p>
    `,
  },

  // ==========================================
  // C. INSTRUCTORS
  // ==========================================
  {
    key: "INSTRUCTOR_APPLICATION_SUBMITTED",
    name: "Instructor Application Received",
    category: EmailCategory.INSTRUCTOR,
    description: "Sent when an instructor registers",
    subject: "DPICS Instructor Application Received",
    variables: ["userName", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Thank you for applying to be an Instructor with <strong>DPI Computing Society</strong>.</p>
<p>Our academic lead and admin team will review your qualifications and experience. We will notify you once your application is processed.</p>
    `,
  },
  {
    key: "INSTRUCTOR_APPROVED",
    name: "Instructor Application Approved",
    category: EmailCategory.INSTRUCTOR,
    description: "Sent when instructor is approved and active",
    subject: "Welcome as a DPICS Instructor! (ID: {{instructorId}})",
    variables: ["userName", "instructorId", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>Congratulations! Your application to teach and mentor at <strong>DPI Computing Society</strong> has been approved.</p>
<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #065f46;">
  <p style="margin: 4px 0;"><strong>Instructor ID:</strong> {{instructorId}}</p>
  <p style="margin: 4px 0;"><strong>Status:</strong> Active Instructor</p>
</div>
<p>You can now manage assigned course lessons and share your knowledge with fellow students.</p>
<p><a href="{{siteUrl}}/admin/courses" class="button">Access Instructor Portal</a></p>
    `,
  },
  {
    key: "INSTRUCTOR_REJECTED",
    name: "Instructor Application Rejected",
    category: EmailCategory.INSTRUCTOR,
    description: "Sent when instructor application is rejected",
    subject: "DPICS Instructor Application Update",
    variables: ["userName", "reason", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Thank you for your interest in becoming an instructor at DPI Computing Society. After careful review, we are unable to accept your application at this time.</p>
<p><strong>Note:</strong> {{reason}}</p>
    `,
  },

  // ==========================================
  // D. POSTS & ARTICLES
  // ==========================================
  {
    key: "POST_SUBMITTED",
    name: "Post Submitted for Review",
    category: EmailCategory.POST,
    description: "Sent to author when their post is submitted for editorial review",
    subject: "Post Received for Review: '{{postTitle}}'",
    variables: ["userName", "postTitle", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Your article <strong>"{{postTitle}}"</strong> has been submitted to the DPICS editorial board for moderation.</p>
<p>Our team will review the content according to community guidelines and notify you when it is published.</p>
    `,
  },
  {
    key: "POST_PUBLISHED",
    name: "Post Approved & Published",
    category: EmailCategory.POST,
    description: "Sent to author when their post goes live",
    subject: "Your post '{{postTitle}}' is now published!",
    variables: ["userName", "postTitle", "postUrl", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Great news! Your article <strong>"{{postTitle}}"</strong> has been reviewed, approved, and published on the DPI Computing Society blog.</p>
<p style="margin: 24px 0;">
  <a href="{{postUrl}}" class="button">Read Published Post</a>
</p>
<p>Thank you for contributing valuable content to the community!</p>
    `,
  },
  {
    key: "POST_REJECTED",
    name: "Post Rejected with Feedback",
    category: EmailCategory.POST,
    description: "Sent to author when changes are requested or post is rejected",
    subject: "Feedback on your post: '{{postTitle}}'",
    variables: ["userName", "postTitle", "massageForAuthor", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>The editorial team reviewed your article <strong>"{{postTitle}}"</strong> and has requested modifications:</p>
<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #991b1b;">
  <p style="margin: 4px 0;"><strong>Editorial Feedback:</strong></p>
  <p style="margin: 4px 0; white-space: pre-wrap;">{{massageForAuthor}}</p>
</div>
<p>You can edit your draft and resubmit it whenever you are ready.</p>
<p><a href="{{siteUrl}}/dashboard" class="button">Edit Draft</a></p>
    `,
  },

  // ==========================================
  // E. ACHIEVEMENTS
  // ==========================================
  {
    key: "ACHIEVEMENT_SUBMITTED",
    name: "Achievement Submitted for Review",
    category: EmailCategory.ACHIEVEMENT,
    description: "Sent to author when achievement is submitted",
    subject: "Achievement Submission Received: '{{achievementTitle}}'",
    variables: ["userName", "achievementTitle", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Your achievement submission <strong>"{{achievementTitle}}"</strong> has been received and is pending verification.</p>
<p>We will feature it in the society achievements showcase once reviewed.</p>
    `,
  },
  {
    key: "ACHIEVEMENT_PUBLISHED",
    name: "Achievement Approved & Published",
    category: EmailCategory.ACHIEVEMENT,
    description: "Sent to author when achievement is featured on the site",
    subject: "Congratulations! Your achievement '{{achievementTitle}}' is now live!",
    variables: ["userName", "achievementTitle", "achievementUrl", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>Congratulations on your accomplishment! Your milestone <strong>"{{achievementTitle}}"</strong> has been approved and published on the DPI Computing Society showcase.</p>
<p style="margin: 24px 0;">
  <a href="{{achievementUrl}}" class="button">View Showcase</a>
</p>
    `,
  },
  {
    key: "ACHIEVEMENT_REJECTED",
    name: "Achievement Rejected with Feedback",
    category: EmailCategory.ACHIEVEMENT,
    description: "Sent when achievement cannot be approved",
    subject: "Update on your achievement submission: '{{achievementTitle}}'",
    variables: ["userName", "achievementTitle", "massageForAuthor", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Thank you for sharing your achievement <strong>"{{achievementTitle}}"</strong>.</p>
<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #991b1b;">
  <p style="margin: 4px 0;"><strong>Moderator Notes:</strong></p>
  <p style="margin: 4px 0; white-space: pre-wrap;">{{massageForAuthor}}</p>
</div>
<p>Feel free to update the details and resubmit.</p>
    `,
  },

  // ==========================================
  // F. EVENTS & TICKETS
  // ==========================================
  {
    key: "EVENT_REGISTRATION_RECEIVED",
    name: "Event Registration Received (Pending)",
    category: EmailCategory.EVENT,
    description: "Sent when user registers for paid or gated event",
    subject: "Registration Received for {{eventTitle}}",
    variables: ["userName", "eventTitle", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>We received your registration request for <strong>{{eventTitle}}</strong>.</p>
<p>Our event organizing committee is processing your ticket. You will receive an official entry pass once confirmed.</p>
    `,
  },
  {
    key: "EVENT_REGISTRATION_CONFIRMED",
    name: "Event Ticket Confirmed",
    category: EmailCategory.EVENT,
    description: "Sent with ticketCode and event details when confirmed",
    subject: "Your Ticket is Confirmed for {{eventTitle}}! (Ticket: {{ticketCode}})",
    variables: ["userName", "eventTitle", "ticketCode", "eventDate", "venue", "ticketUrl", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>Your registration for <strong>{{eventTitle}}</strong> is confirmed! Here is your entry pass:</p>
<div style="background-color: #f0fdf4; border: 2px dashed #16a34a; padding: 16px; margin: 20px 0; border-radius: 8px; text-align: center;">
  <p style="margin: 0; color: #166534; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Official Entry Code</p>
  <p style="margin: 8px 0; font-family: monospace; font-size: 26px; font-weight: bold; color: #15803d; letter-spacing: 2px;">{{ticketCode}}</p>
  <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Date:</strong> {{eventDate}}</p>
  <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Venue:</strong> {{venue}}</p>
</div>
<p style="text-align: center; margin: 24px 0;">
  <a href="{{ticketUrl}}" class="button">View & Download Ticket</a>
</p>
<p>Please present this ticket code at the entrance.</p>
    `,
  },
  {
    key: "EVENT_REGISTRATION_REJECTED",
    name: "Event Registration Rejected",
    category: EmailCategory.EVENT,
    description: "Sent if registration is rejected or capacity full",
    subject: "Notice regarding your registration for {{eventTitle}}",
    variables: ["userName", "eventTitle", "notes", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>We regret to inform you that your registration for <strong>{{eventTitle}}</strong> could not be accommodated.</p>
<p><strong>Note:</strong> {{notes}}</p>
<p>We hope to see you in our upcoming events!</p>
    `,
  },
  {
    key: "EVENT_REGISTRATION_CANCELLED",
    name: "Event Registration Cancelled",
    category: EmailCategory.EVENT,
    description: "Sent when an event registration is cancelled",
    subject: "Registration Cancelled for {{eventTitle}}",
    variables: ["userName", "eventTitle", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>This is to confirm that your registration for <strong>{{eventTitle}}</strong> has been cancelled.</p>
<p>If you did not request this cancellation or would like to re-register, please visit the event page.</p>
<p><a href="{{siteUrl}}/events" class="button">Browse Events</a></p>
    `,
  },
  {
    key: "EVENT_REGISTRATION_ATTENDED",
    name: "Event Attendance Certificate / Thanks",
    category: EmailCategory.EVENT,
    description: "Sent after attendee checks in at event",
    subject: "Thank you for attending {{eventTitle}}!",
    variables: ["userName", "eventTitle", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>Thank you for participating in <strong>{{eventTitle}}</strong> hosted by DPI Computing Society!</p>
<p>We hope you gained valuable insights and networking opportunities. Session slides, photos, and resources are available on our website.</p>
<p><a href="{{siteUrl}}/events" class="button">Explore More Events</a></p>
    `,
  },

  // ==========================================
  // G. COMMITTEE & ACCOUNT LIFECYCLE
  // ==========================================
  {
    key: "COMMITTEE_ROLE_ASSIGNED",
    name: "Committee Appointment Notice",
    category: EmailCategory.ACCOUNT,
    description: "Sent when a user is appointed to a society committee role",
    subject: "Congratulations on your appointment to {{committeeName}}!",
    variables: ["userName", "committeeName", "roleName", "siteUrl"],
    bodyHtml: `
<p>Dear <strong>{{userName}}</strong>,</p>
<p>We are proud to announce your official appointment to the <strong>{{committeeName}}</strong> of DPI Computing Society in the role of <strong>{{roleName}}</strong>.</p>
<p>We appreciate your dedication to advancing computing education and leadership among polytechnic students.</p>
<p><a href="{{siteUrl}}/admin" class="button">Go to Society Portal</a></p>
    `,
  },
  {
    key: "ACCOUNT_DEACTIVATED",
    name: "Account Deactivated Notice",
    category: EmailCategory.ACCOUNT,
    description: "Sent when admin disables a user account",
    subject: "Notice: Your DPICS Account has been Deactivated",
    variables: ["userName", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>This is to inform you that your account at DPI Computing Society has been deactivated by administration.</p>
<p>If you believe this is in error, please contact society administration for assistance.</p>
    `,
  },
  {
    key: "ACCOUNT_REACTIVATED",
    name: "Account Reactivated Notice",
    category: EmailCategory.ACCOUNT,
    description: "Sent when admin re-enables a user account",
    subject: "Your DPICS Account has been Reactivated",
    variables: ["userName", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<p>Your account at DPI Computing Society has been reactivated. You may now sign in and access society services.</p>
<p><a href="{{siteUrl}}/login" class="button">Sign In</a></p>
    `,
  },

  // ==========================================
  // H. GENERAL BULK CAMPAIGN TEMPLATE
  // ==========================================
  {
    key: "BULK_ANNOUNCEMENT_DEFAULT",
    name: "General Announcement (Bulk Default)",
    category: EmailCategory.BULK,
    description: "Default template for custom filtered bulk broadcasts",
    subject: "Important Announcement from DPI Computing Society",
    variables: ["userName", "department", "semester", "studentId", "customMessage", "siteUrl"],
    bodyHtml: `
<p>Hello <strong>{{userName}}</strong>,</p>
<div style="margin: 16px 0; line-height: 1.6;">
  {{customMessage}}
</div>
<p style="margin: 24px 0;">
  <a href="{{siteUrl}}" class="button">Visit DPICS Website</a>
</p>
    `,
  },
]
