import { cn } from "@/lib/utils";

export function TemuClientMark({ className, title = "TemuClient" }: { className?: string; title?: string }) {
  return <svg aria-label={title} className={cn("shrink-0", className)} fill="none" role="img" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#D83267" height="40" rx="9" width="40" />
    <path d="M10.5 11.5H29.5M20 11.5V29M10.5 20H20" stroke="#FFF1F5" strokeLinecap="round" strokeWidth="2.5" />
    <circle cx="10.5" cy="11.5" fill="#FFD5E3" r="2.5" />
    <circle cx="29.5" cy="11.5" fill="#FFD5E3" r="2.5" />
    <circle cx="10.5" cy="20" fill="#FFD5E3" r="2.5" />
    <circle cx="20" cy="29" fill="#FFD5E3" r="2.5" />
    <circle cx="20" cy="11.5" fill="white" r="3.5" />
    <path d="m18.6 11.5.9.9 1.9-2" stroke="#071518" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
  </svg>;
}

export function TemuClientLogo({ className, compact = false, inverse = false }: { className?: string; compact?: boolean; inverse?: boolean }) {
  return <span className={cn("inline-flex items-center gap-2.5", className)}><TemuClientMark className="size-9" />{!compact && <span className={cn("text-[17px] font-semibold tracking-[-0.035em]", inverse ? "text-white" : "text-[#071518]")}>Temu<span className={inverse ? "text-[#ff8bb2]" : "text-[#d83267]"}>Client</span></span>}</span>;
}
