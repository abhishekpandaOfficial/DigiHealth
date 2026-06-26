import { X, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useApp } from "@/contexts/app-context"
import { calcAge, bloodGroupColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function MemberTabs() {
  const { members, tabs, activeTabId, openMemberTab, closeTab, setActiveTab } = useApp()

  return (
    <div className="border-b bg-muted/30 px-4">
      <div className="flex items-center gap-1 h-10">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1 h-10">
            {tabs.map(tab => {
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors border-b-2",
                    isActive
                      ? "bg-background border-primary"
                      : "bg-muted/50 border-transparent hover:bg-background/50"
                  )}
                >
                  <Avatar className="size-5 shrink-0">
                    <AvatarImage src={tab.member.photo_url ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                      {tab.member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "text-sm font-medium truncate max-w-[100px]",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {tab.member.name}
                  </span>
                  {tab.member.blood_group && (
                    <Badge className={cn("text-[10px] py-0 px-1", bloodGroupColor(tab.member.blood_group))}>
                      {tab.member.blood_group}
                    </Badge>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                    className="ml-1 p-0.5 rounded hover:bg-muted-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="size-8 shrink-0 ml-1">
              <Plus className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Open Profile in Tab
            </div>
            {members
              .filter(m => !tabs.some(t => t.member.id === m.id))
              .map(member => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => openMemberTab(member)}
                  className="gap-2 cursor-pointer"
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage src={member.photo_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.relation} · {calcAge(member.dob)}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            {members.filter(m => !tabs.some(t => t.member.id === m.id)).length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                All members are open in tabs
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
