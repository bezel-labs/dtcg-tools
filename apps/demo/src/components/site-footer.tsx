import { Separator } from '@base-ui/react/separator';
import { LINKS } from '../lib/links.js';

const COLUMNS = [
  {
    title: 'Toolkit',
    links: [
      { label: 'Docs', href: LINKS.docs },
      { label: 'Playground', href: LINKS.playground },
      { label: 'API reference', href: LINKS.api },
    ],
  },
  {
    title: 'Reference',
    links: [
      { label: 'Getting started', href: LINKS.gettingStarted },
      { label: 'Lint rules', href: LINKS.lintRules },
      { label: 'Issue codes', href: LINKS.issueCodes },
      { label: 'CLI', href: LINKS.cli },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Changelog', href: LINKS.changelog },
      { label: 'Roadmap', href: LINKS.roadmap },
      { label: 'Contributing', href: LINKS.contributing },
      { label: 'License', href: LINKS.license },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: LINKS.github },
      { label: 'Discussions', href: LINKS.discussions },
      { label: 'Issues', href: LINKS.issues },
      { label: 'npm', href: LINKS.npm },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Separator className="stripes" />
      <div className="site-footer-body">
        <div className="footer-columns">
          {COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <h2 className="footer-title">{title}</h2>
              <ul className="footer-links">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="footer-copyright">MIT licensed. © 2026 Bezel Labs contributors.</p>
      </div>
    </footer>
  );
}
