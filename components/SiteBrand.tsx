import Link from 'next/link';

interface SiteBrandProps {
  href?: string;
  onClick?: () => void;
}

export default function SiteBrand({ href = '/', onClick }: SiteBrandProps) {
  const content = (
    <>
      <span className="site-brand-icon" aria-hidden>
        ◈
      </span>
      <span className="site-brand-text">BuildrAI</span>
      <span className="site-brand-glow" aria-hidden />
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="site-brand" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="site-brand">
      {content}
    </Link>
  );
}
