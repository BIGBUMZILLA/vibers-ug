import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CatBrand } from "@/components/CatBrand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { askGarry } from "@/lib/garry.functions";
import { useAuth } from "@/hooks/useAuth";
const GarryContext = createContext({ openGarry: () => {} });
export const useGarry = () => useContext(GarryContext);
export function GarryProvider({children}: {children: ReactNode}) {
 const [open, setOpen] = useState(false);
 return <GarryContext.Provider value={{openGarry: () => setOpen(true)}}>{children}<Button variant="outline" onClick={() => setOpen(true)} title="Ask Garry AI" aria-label="Ask Garry AI" className="fixed bottom-20 right-4 z-30 h-12 gap-2 rounded-full border-primary/40 bg-card px-3 shadow-lg md:bottom-5"><span className="text-lg">🐈</span><span className="font-display text-xs font-bold">GARRY AI</span><span className="h-1.5 w-1.5 rounded-full bg-primary"/></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="flex h-[min(650px,85dvh)] w-[calc(100%-24px)] max-w-lg flex-col p-0"><DialogHeader className="border-b p-5"><DialogTitle className="flex items-center gap-3 font-display"><CatBrand compact/>GARRY AI</DialogTitle><DialogDescription>Your Kampala sidekick.</DialogDescription></DialogHeader><GarryChat/></DialogContent></Dialog></GarryContext.Provider>;
}
export function GarryChat() {
 const { user } = useAuth();
 const [messages,setMessages] = useState<{role:"user"|"assistant";content:string}[]>([]);
 const [busy,setBusy] = useState(false);
 return <div className="flex min-h-0 flex-1 flex-col"><Conversation className="min-h-0 flex-1"><ConversationContent className="p-5">{messages.length === 0 && <div className="py-8 text-center"><div className="flex justify-center"><CatBrand/></div><h2 className="mt-6 font-display text-xl font-bold">What's the plan, Kampala?</h2><p className="mt-2 text-sm text-muted-foreground">A better message. A fresh idea. Your next move.</p></div>}{messages.map((m,i)=><Message key={i} from={m.role}><MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground"}><MessageResponse>{m.content}</MessageResponse></MessageContent></Message>)}{busy && <Shimmer>Garry is thinking…</Shimmer>}</ConversationContent><ConversationScrollButton/></Conversation><div className="border-t p-4">{!user && <p className="mb-3 text-xs text-muted-foreground">Sign in to talk with Garry. Demo chats stay on this device.</p>}<PromptInput onSubmit={async ({text})=>{if(!text.trim()||busy)return;if(!user){toast.info("Sign in with your real account to chat with Garry AI.");return;}const next=[...messages,{role:"user" as const,content:text.trim()}];setMessages(next);setBusy(true);try{const content=await askGarry({data:{messages:next.slice(-30)}});setMessages([...next,{role:"assistant",content}]);}catch(e){toast.error(e instanceof Error?e.message:"Garry couldn't reply");}finally{setBusy(false);}}}><PromptInputTextarea placeholder="Ask Garry anything…" disabled={busy}/><PromptInputFooter className="justify-end"><PromptInputSubmit disabled={busy||!user} status={busy?"submitted":"ready"}/></PromptInputFooter></PromptInput></div></div>;
}
