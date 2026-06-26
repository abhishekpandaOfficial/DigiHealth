import { useApp } from "@/contexts/app-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Plus } from "lucide-react"
import { calcAge, bloodGroupColor } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export function MemberSwitcher() {
  const { members, activeMember, openMemberTab } = useApp()
  const navigate = useNavigate()

  if (!activeMember) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-9 px-2">
          <Avatar className="size-6">
            <AvatarImage src={activeMember.photo_url ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {activeMember.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium leading-tight">{activeMember.name}</span>
            <span className="text-xs text-muted-foreground">{activeMember.relation}</span>
          </div>
          {activeMember.blood_group && (
            <Badge className={`text-xs hidden sm:inline-flex ${bloodGroupColor(activeMember.blood_group)}`}>
              {activeMember.blood_group}
            </Badge>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Open Member in Tab</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {members.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => openMemberTab(m)}
            className="gap-2 cursor-pointer"
          >
            <Avatar className="size-6">
              <AvatarImage src={m.photo_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {m.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">{m.relation} · {calcAge(m.dob)}</span>
            </div>
            {activeMember.id === m.id && (
              <span className="ml-auto text-xs text-primary">Active</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/family?action=add")} className="gap-2">
          <Plus className="size-4" />
          <span>Add New Member</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
