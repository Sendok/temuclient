import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function headingId(children: React.ReactNode): string {
  return String(children).toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

const components: Components = {
  h2: ({ children }) => <h2 className="mb-4 mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight" id={headingId(children)}>{children}</h2>,
  h3: ({ children }) => <h3 className="mb-3 mt-8 scroll-mt-24 text-xl font-semibold" id={headingId(children)}>{children}</h3>,
  p: ({ children }) => <p className="my-5 leading-8 text-text-secondary">{children}</p>,
  ul: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6 text-text-secondary">{children}</ul>,
  ol: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6 text-text-secondary">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="my-7 border-l-4 border-brand-500 bg-brand-50 px-5 py-1 text-text-primary">{children}</blockquote>,
  a: ({ href = "", children }) => href.startsWith("/") ? <Link className="font-medium text-brand-700 underline underline-offset-4" href={href}>{children}</Link> : <a className="font-medium text-brand-700 underline underline-offset-4" href={href} rel="nofollow noopener noreferrer" target="_blank">{children}</a>,
  code: ({ children }) => <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">{children}</code>,
  pre: ({ children }) => <pre className="my-6 overflow-x-auto rounded-lg bg-text-primary p-4 text-sm text-white">{children}</pre>,
  table: ({ children }) => <div className="my-7 overflow-x-auto"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
  th: ({ children }) => <th className="border bg-surface-subtle p-3 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border p-3 text-text-secondary">{children}</td>,
  hr: () => <hr className="my-10" />,
  img: () => null,
};

export function ArticleMarkdown({ source }: { source: string }) {
  return <div className="article-content"><ReactMarkdown components={components} remarkPlugins={[remarkGfm]} skipHtml>{source}</ReactMarkdown></div>;
}
