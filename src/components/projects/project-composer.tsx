"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Code2,
  ExternalLink,
  Globe,
  Plus,
  Trash2,
  Users,
} from "lucide-react"

import { GithubIcon } from "@/components/icons/github-icon"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { COMMON_TECH_STACK } from "@/lib/project-constants"

export function ProjectComposer({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const router = useRouter()
  const { t } = useLanguage()

  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = useState("")
  const [titleBn, setTitleBn] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [techInput, setTechInput] = useState("")
  const [techStack, setTechStack] = useState<string[]>([])
  const [submitForReview, setSubmitForReview] = useState(true)

  // Team Members
  const [teamMembers, setTeamMembers] = useState<
    { name: string; role: string; studentId: string }[]
  >([])
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [memberStudentId, setMemberStudentId] = useState("")

  const handleAddTech = (tech: string) => {
    const trimmed = tech.trim()
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed])
      setTechInput("")
    }
  }

  const handleRemoveTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech))
  }

  const handleAddMember = () => {
    if (memberName.trim()) {
      setTeamMembers([
        ...teamMembers,
        {
          name: memberName.trim(),
          role: memberRole.trim() || "Contributor",
          studentId: memberStudentId.trim(),
        },
      ])
      setMemberName("")
      setMemberRole("")
      setMemberStudentId("")
    }
  }

  const handleRemoveMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError("Title and Project Description are required.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          titleBn: titleBn || null,
          excerpt: excerpt || null,
          description,
          coverImage: coverImage || null,
          liveUrl: liveUrl || null,
          githubUrl: githubUrl || null,
          youtubeUrl: youtubeUrl || null,
          techStack,
          teamMembers,
          submitForReview,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || "Failed to create project")
      }

      setIsOpen(false)
      // Reset
      setTitle("")
      setTitleBn("")
      setExcerpt("")
      setDescription("")
      setCoverImage("")
      setLiveUrl("")
      setGithubUrl("")
      setTechStack([])
      setTeamMembers([])

      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)} className="gap-1.5 font-semibold">
        <Plus className="size-4" />
        {t({ en: "Submit Project", bn: "প্রজেক্ট জমা দিন" })}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t({ en: "Submit a Student Project", bn: "নতুন প্রজেক্ট জমা দিন" })}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t({
              en: "Share your software, robotics, or hardware portfolio with the community and hiring partners.",
              bn: "আপনার তৈরি সফটওয়্যার বা হার্ডওয়্যার প্রজেক্টের বিস্তারিত তথ্য শেয়ার করুন।",
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Title & Bangla Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Project Title (English) *
              </label>
              <Input
                placeholder="e.g. Smart IoT Agriculture Monitor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Title in Bangla (Optional)
              </label>
              <Input
                placeholder="যেমন: স্মার্ট আইওটি কৃষি মনিটর"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Short Excerpt */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">Short Summary / Tagline</label>
            <Input
              placeholder="A brief 1-2 sentence overview of what the project solves..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Markdown Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Full Project Story & Overview (Markdown) *
            </label>
            <Textarea
              placeholder="Describe the problem, key features, hardware components, architecture, and learnings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="text-xs font-mono"
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Globe className="size-3 text-primary" /> Live Demo URL
              </label>
              <Input
                type="url"
                placeholder="https://myproject.vercel.app"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <GithubIcon className="size-3" /> GitHub Repository URL
              </label>
              <Input
                type="url"
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Cover Image & Video Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Cover Image URL</label>
              <Input
                type="url"
                placeholder="https://imagekit.io/... or web image"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Video Demo / YouTube URL</label>
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold">Technologies Used</label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a technology (e.g. Next.js, Arduino) and press Add..."
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTech(techInput)
                  }
                }}
                className="text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs shrink-0"
                onClick={() => handleAddTech(techInput)}
              >
                Add
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 pt-1">
              {COMMON_TECH_STACK.slice(0, 8).map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleAddTech(tech)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  +{tech}
                </button>
              ))}
            </div>

            {/* Selected Tech */}
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1 text-xs">
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" />
              Team Members / Contributors (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="text-xs h-8"
              />
              <Input
                placeholder="Role (e.g. Hardware Lead)"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="text-xs h-8"
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Roll / Student ID"
                  value={memberStudentId}
                  onChange={(e) => setMemberStudentId(e.target.value)}
                  className="text-xs h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2 shrink-0"
                  onClick={handleAddMember}
                >
                  Add
                </Button>
              </div>
            </div>

            {teamMembers.length > 0 && (
              <div className="space-y-1 pt-1">
                {teamMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs"
                  >
                    <span>
                      <strong>{m.name}</strong> • {m.role}{" "}
                      {m.studentId ? `(${m.studentId})` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="text-destructive hover:opacity-80 p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="submitReview"
              checked={submitForReview}
              onChange={(e) => setSubmitForReview(e.target.checked)}
              className="rounded-xs border-border"
            />
            <label htmlFor="submitReview" className="text-xs font-medium cursor-pointer">
              {t({
                en: "Submit for moderator review immediately (otherwise save as Draft)",
                bn: "সরাসরি মডারেটর পর্যালোচনার জন্য জমা দিন (না দিলে খসড়া হিসেবে থাকবে)",
              })}
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}
