/** Shared class recipes (plain module so server components can import them). */
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 bg-olive px-5 py-3 text-[13px] font-medium tracking-wide text-ivory transition-colors duration-300 hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-40",
  secondary:
    "inline-flex items-center justify-center gap-2 border border-espresso/25 px-5 py-3 text-[13px] font-medium tracking-wide text-espresso transition-colors duration-300 hover:border-espresso hover:bg-espresso hover:text-ivory disabled:opacity-40",
  ghost:
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-espresso/80 transition-colors hover:text-espresso hover:bg-chalk/70",
  danger:
    "inline-flex items-center justify-center gap-2 bg-clay px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-[#9b664e]",
  link: "inline-flex items-center gap-2 text-[13px] font-medium text-espresso underline decoration-espresso/30 underline-offset-[6px] transition-colors hover:decoration-clay",
};
