import { CommandTabs } from '../components/command-tabs.js';
import { Placeholder } from '../components/placeholder.js';
import { SiteFooter } from '../components/site-footer.js';
import { SiteHeader } from '../components/site-header.js';
import { LINKS } from '../lib/links.js';
import { LOGO_ART } from '../lib/logo-art.js';

const STATS = [
  { value: '~20 ms', label: 'to validate 10,000 tokens' },
  { value: '~13 kB', label: 'validator, gzipped' },
  { value: '12', label: 'configurable lint rules' },
  { value: '0', label: 'runtime dependencies' },
];

// Feature graphics fill a two-column card at the 1168px content width.
const GRAPHIC_WIDTH = 546;
const GRAPHIC_HEIGHT = 320;

const CHECKS = [
  {
    title: 'Full spec coverage',
    body: 'Checks every normative section of the Format and Color 2025.10 specifications.',
    graphic: 'Spec coverage graphic',
  },
  {
    title: 'Your team’s standards',
    body: 'Lint against your own policies with 12 configurable rules, from alias chains to naming styles.',
    graphic: 'Lint rules graphic',
  },
  {
    title: 'Built for CI',
    body: 'Pretty, JSON, or GitHub annotation output. Errors fail the job; warnings alone pass.',
    graphic: 'CI output graphic',
  },
  {
    title: 'Fast and small',
    body: 'Validates 10,000 tokens in about 20 ms, from a validator of about 13 kB gzipped.',
    graphic: 'Performance graphic',
  },
];

const AUDIENCES = [
  {
    title: 'Designers and developers',
    body: 'Confirm a file is sound before it ships, from the terminal or right in the browser.',
    graphic: 'Design and code handoff graphic',
  },
  {
    title: 'AI agents',
    body: 'Errors carry stable codes and exact paths, so agents can keep their edits within your standards.',
    graphic: 'Agent workflow graphic',
  },
  {
    title: 'Safe on untrusted files',
    body: 'Invalid input of any shape comes back as diagnostics, and a document never makes it throw.',
    graphic: 'Security graphic',
  },
  {
    title: 'Typed and portable',
    body: 'ESM and CommonJS with types included. Runs in Node 20.19+, evergreen browsers, and modern bundlers.',
    graphic: 'Typed API graphic',
  },
];

const LINT_CONFIG = `{
  "extends": ["recommended"],
  "rules": {
    "token-name-length": ["error", { "min": 2, "max": 40 }],
    "naming-convention": ["error", { "tokens": "kebab" }]
  }
}`;

interface FeatureGridProps {
  features: { title: string; body: string; graphic: string }[];
}

function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="feature-grid">
      {features.map(({ title, body, graphic }) => (
        <article key={title} className="pane feature">
          <h3 className="pane-title">{title}</h3>
          <p>{body}</p>
          <Placeholder label={graphic} width={GRAPHIC_WIDTH} height={GRAPHIC_HEIGHT} />
        </article>
      ))}
    </div>
  );
}

export function LandingPage() {
  return (
    <>
      <SiteHeader current="landing" />
      <main>
        <section className="landing-section hero">
          <div className="hero-logo" aria-hidden="true">
            {LOGO_ART}
          </div>
          <a className="hero-badge" href={LINKS.spec}>
            Beta · DTCG 2025.10
          </a>
          <h1 className="hero-title">Check a design token file with one command</h1>
          <p className="hero-copy">
            A free, open-source TypeScript toolkit for validating and linting DTCG design tokens.
          </p>
          <div className="actions">
            <a className="button button-primary" href={LINKS.gettingStarted}>
              Get started
            </a>
            <a className="button" href={LINKS.playground}>
              Try the playground
            </a>
            <a className="button" href={LINKS.github}>
              View on GitHub
            </a>
          </div>
          <CommandTabs />
          <Placeholder label="Hero graphic" width={1168} height={480} />
        </section>

        <section className="landing-section stats-section" aria-label="At a glance">
          <dl className="stats">
            {STATS.map(({ value, label }) => (
              <div key={label} className="stat">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>Two questions, one toolkit</h2>
            <p>The specification defines a valid file. Your team decides what a good one is.</p>
          </div>
          <div className="feature-grid">
            <article className="pane feature">
              <h3 className="pane-title">The validator</h3>
              <p>
                <strong>Is this valid DTCG?</strong> Works on any 2025.10 file with no
                configuration, and reports only what the specification says.
              </p>
              <pre className="code-block">
                <span className="path">color.brand.primary.$value.colorSpace</span>{' '}
                <span className="stat-error">error</span>
                {'\n  Unsupported color space "sRGB". Did you mean "srgb"?\n  '}
                <span className="code">color.color-space.invalid</span>
                {'\n\n'}
                <span className="path">spacing.small.$value</span>{' '}
                <span className="stat-error">error</span>
                {'\n  A dimension value must have a "unit" property.\n  '}
                <span className="code">dimension.unit.missing</span>
              </pre>
            </article>
            <article className="pane feature">
              <h3 className="pane-title">The linter</h3>
              <p>
                <strong>Does this meet our standards?</strong> Goes beyond the specification with
                rules you choose in a <code className="inline-code">dtcg-lint.config.json</code>.
              </p>
              <pre className="code-block">{LINT_CONFIG}</pre>
            </article>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>Catch token problems before they ship</h2>
            <p>One check for whether a file follows the standard and your project’s policies.</p>
          </div>
          <FeatureGrid features={CHECKS} />
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>One check for everyone who touches tokens</h2>
            <p>Tokens pass between designers, developers, build tools, and now AI agents.</p>
          </div>
          <FeatureGrid features={AUDIENCES} />
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>Runs wherever your tokens go</h2>
            <p>
              On the command line, in <a href={LINKS.ciGuide}>your CI pipeline</a>, in your own
              code, or in the <a href={LINKS.playground}>playground</a>.
            </p>
          </div>
          <Placeholder label="Integrations graphic" width={1168} height={240} />
        </section>

        <section className="landing-section open-source">
          <div className="section-heading">
            <h2>Free and open source</h2>
            <p>
              Open Design Tokens is MIT licensed, and contributors are welcome. Help shape what
              comes next, including support for future versions of the specification.
            </p>
          </div>
          <div className="actions">
            <a className="button" href={LINKS.contributing}>
              Contribute
            </a>
            <a className="button" href={LINKS.roadmap}>
              Read the roadmap
            </a>
          </div>
        </section>

        <section className="landing-section">
          <div className="closing">
            <Placeholder label="Closing background" width={1168} height={400} />
            <div className="closing-content">
              <h2>Start checking your tokens</h2>
              <p>Run it on a file without installing anything.</p>
              <a className="button button-primary" href={LINKS.gettingStarted}>
                Get started
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
