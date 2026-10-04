import { createFileRoute } from "@tanstack/react-router";
import { AuthSurface } from "@/components/AuthSurface";
export const Route = createFileRoute("/auth")({head:()=>({meta:[{title:"Log in · VIBER UG 256"},{name:"description",content:"Sign in to VIBER UG 256. Your people, your city, connected in Kampala."},{property:"og:title",content:"Log in · VIBER UG 256"},{property:"og:description",content:"Your urban Kampala conversations start here."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:AuthSurface});
