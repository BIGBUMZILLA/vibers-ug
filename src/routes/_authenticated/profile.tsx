import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile, type Profile } from "@/lib/chat";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile · VIBER UG" },
      { name: "description", content: "Update your VIBER UG name, photo, username and status." },
      { property: "og:title", content: "Your profile · VIBER UG" },
      { property: "og:description", content: "Update your VIBER UG profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    void getMyProfile(user.id).then(setProfile);
  }, [user]);

  async function save() {
    if (!profile || !user) return;
    const cleanUsername = profile.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!profile.display_name.trim()) {
      toast.error("Add your name");
      return;
    }
    if (cleanUsername.length < 3) {
      toast.error("Username must have at least 3 letters or numbers");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name.trim(),
        username: cleanUsername,
        about: profile.about,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate") ? "That username is taken" : "Couldn't save changes",
      );
      return;
    }
    toast.success("Profile saved");
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) {
      toast.error("Couldn't upload that photo");
      return;
    }
    const reference = `avatars/${path}`;
    await supabase.from("profiles").update({ avatar_url: reference }).eq("id", user.id);
    setProfile((p) => (p ? { ...p, avatar_url: reference } : p));
    toast.success("Photo updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x bg-background">
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/15"
        >
          <Link to="/chats" aria-label="Back to chats">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-display text-lg font-semibold">Your profile</h1>
      </header>

      {profile ? (
        <div className="space-y-6 p-6">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative"
              aria-label="Change photo"
            >
              <UserAvatar name={profile.display_name} avatar={profile.avatar_url} size={104} />
              <span className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground">
                <Camera className="h-4 w-4" />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Account email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">Your secure sign-in email cannot be changed here yet.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display">Name</Label>
            <Input
              id="display"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Friends can find you with @{profile.username}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">Status</Label>
            <Textarea
              id="about"
              rows={2}
              value={profile.about}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" onClick={signOut} className="text-destructive">
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      )}
    </main>
  );
}
