// The Lawgistics wordmark, drawn exactly as the main site draws it: the name in Lora with a
// small navy dot. It is the only logo in the app, on every page, so the product reads as part
// of Lawgistics rather than a separate tool with its own badge.
export function Brand({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <a className={"lg-brand" + (light ? " lg-brand--light" : "")} href={href}>
      Lawgistics<span className="lg-dot" aria-hidden="true" />
    </a>
  );
}
