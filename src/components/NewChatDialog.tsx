import { useEffect, useState } from "react";
import { SquarePen } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createGroupChat,
  getOrCreateDirectChat,
  searchProfiles,
  type Profile,
} from "@/lib/chat";

export function NewChatDialog({
  meId,
  onCreated,
}: {
  meId: string;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!open || !meId) return;
    const t = setTimeout(() => {
      void searchProfiles(query, meId).then(setPeople);
    }, 200);
    return () => clearTimeout(t);
  }, [open, query, meId]);

  async function startDirect(other: Profile) {
    try {
      const id = await getOrCreateDirectChat(meId, other.id);
      setOpen(false);
      onCreated(id);
    } catch (e) {
      console.error("start chat failed", e);
      toast.error(e instanceof Error ? e.message : "Couldn't start that chat");
    }
  }

  async function startGroup() {
    if (!groupName.trim() || selected.length === 0) {
      toast.error("Add a group name and at least one person");
      return;
    }
    try {
      const id = await createGroupChat(meId, groupName.trim(), selected);
      setOpen(false);
      onCreated(id);
    } catch {
      toast.error("Couldn't create the group");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="absolute bottom-6 right-6 h-14 w-14 rounded-2xl shadow-lg"
          aria-label="New chat"
        >
          <SquarePen />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{groupMode ? "New group" : "New chat"}</DialogTitle>
        </DialogHeader>
        {groupMode && (
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
          />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username or phone number"
        />
        <p className="text-xs text-muted-foreground">
          Everyone on VIBER UG is listed here — type a phone number to find someone directly.
        </p>
        <ul className="max-h-72 overflow-y-auto">
          {people.map((p) => {
            const picked = selected.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() =>
                    groupMode
                      ? setSelected((s) => (picked ? s.filter((i) => i !== p.id) : [...s, p.id]))
                      : void startDirect(p)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent/50 ${
                    picked ? "bg-accent/60" : ""
                  }`}
                >
                  <UserAvatar name={p.display_name} avatar={p.avatar_url} size={38} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.display_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{p.username}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {people.length === 0 && (
            <li className="px-2 py-4 text-sm text-muted-foreground">No people found yet.</li>
          )}
        </ul>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setGroupMode(!groupMode);
              setSelected([]);
            }}
          >
            {groupMode ? "Single chat" : "Create a group"}
          </Button>
          {groupMode && (
            <Button className="flex-1" onClick={startGroup}>
              Create group
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
