'use client';

interface BrandLogoProps {
  variant?: 'hero' | 'compact';
  showText?: boolean;
}

export function BrandLogo({ variant = 'hero', showText = true }: BrandLogoProps) {
  const compact = variant === 'compact';

  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : 'brand-logo--hero'}`}>
      <span className="brand-logo__mark">U</span>
      {showText ? (
        <span className="brand-logo__text">
          <strong>UMOAR</strong>
          <small>Inventario universitario</small>
        </span>
      ) : null}
    </div>
  );
}