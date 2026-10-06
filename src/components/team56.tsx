import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Team56Props {
  heading: string;
  description: string;
  members: TeamMember[];
  className?: string;
}

const defaultProps: Team56Props = {
  heading: "Meet The Team",
  description:
    "Our diverse team of experts brings together decades of experience in design, engineering, and product development.",
  members: [
    {
      id: "member-1",
      name: "Sarah Chen",
      role: "CEO & Founder",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar5.jpg",
    },
    {
      id: "member-2",
      name: "Marcus Rodriguez",
      role: "CTO",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar8.jpg",
    },
    {
      id: "member-3",
      name: "Emily Watson",
      role: "Head of Design",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar7.jpg",
    },
    {
      id: "member-4",
      name: "David Kim",
      role: "Lead Engineer",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar9.jpg",
    },
    {
      id: "member-5",
      name: "Lisa Thompson",
      role: "Product Manager",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar13.jpg",
    },
    {
      id: "member-6",
      name: "Alex Johnson",
      role: "UX Designer",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar1.jpg",
    },
    {
      id: "member-7",
      name: "Camila Reyes",
      role: "Head of Marketing",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar10.jpg",
    },
    {
      id: "member-8",
      name: "Andre Wallace",
      role: "Head of Operations",
      avatar:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/avatars/avatar4.jpg",
    },
  ],
};

type Props = Partial<Team56Props>;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

const Team56 = (props: Props) => {
  const { heading, description, members, className } = {
    ...defaultProps,
    ...props,
  };

  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
              {heading}
            </h2>
            <p className="max-w-5xl text-muted-foreground lg:text-lg">
              {description}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
              <Card
                key={member.id}
                className="items-center border-0 bg-muted text-center shadow-none ring-0"
              >
                <CardContent className="flex flex-col items-center gap-4">
                  <Avatar className="size-20 border lg:size-24">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-muted-foreground">{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Team56 };
