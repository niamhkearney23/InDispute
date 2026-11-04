/**
 * Drawn fresh on every move between pages (unlike the layout), so each page
 * arrives with the same short fade (`page-in`, globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
