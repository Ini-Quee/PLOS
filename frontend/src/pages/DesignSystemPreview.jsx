import { Colors, ModuleColors, gradients, getColorWithOpacity, getGradient } from '../lib/colors';
import { Typography, FontWeights, Spacing, BorderRadius, FontFamilies, getTypography, getFontFamily } from '../lib/typography';

/**
 * DesignSystemPreview — Complete design system showcase
 * Shows colors, typography, spacing, and component examples
 */
export default function DesignSystemPreview() {
  const renderColorCard = (name, color, description = '') => (
    <div
      key={name}
      style={{
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        padding: Spacing.base,
        border: `1px solid ${Colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: Spacing.sm,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '60px',
          backgroundColor: color,
          borderRadius: BorderRadius.sm,
          border: `1px solid ${Colors.border}`,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: Colors.textPrimary, fontSize: Typography.body.fontSize, fontWeight: FontWeights.semibold }}>
          {name}
        </span>
        <span style={{ color: Colors.textMuted, fontSize: Typography.caption.fontSize, fontFamily: 'monospace' }}>
          {color}
        </span>
      </div>
      {description && (
        <span style={{ color: Colors.textSecondary, fontSize: Typography.micro.fontSize, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {description}
        </span>
      )}
    </div>
  );

  const renderGradientCard = (name, colors) => (
    <div
      key={name}
      style={{
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        padding: Spacing.base,
        border: `1px solid ${Colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: Spacing.sm,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '60px',
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          borderRadius: BorderRadius.sm,
        }}
      />
      <span style={{ color: Colors.textPrimary, fontSize: Typography.body.fontSize, fontWeight: FontWeights.semibold }}>
        {name}
      </span>
      <span style={{ color: Colors.textMuted, fontSize: Typography.micro.fontSize, fontFamily: 'monospace' }}>
        {colors[0]} → {colors[1]}
      </span>
    </div>
  );

  const renderTypographySample = (name, style) => (
    <div
      key={name}
      style={{
        padding: `${Spacing.md}px 0`,
        borderBottom: `1px solid ${Colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: Spacing.xs,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            color: Colors.textPrimary,
            ...getTypography(name),
            fontFamily: getFontFamily(name === 'hero' || name === 'title' ? 'display' : 'body'),
          }}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)} Text
        </span>
        <span style={{ color: Colors.textMuted, fontSize: Typography.caption.fontSize, fontFamily: 'monospace' }}>
          {style.fontSize}px / {style.lineHeight}px
        </span>
      </div>
      <div style={{ display: 'flex', gap: Spacing.md }}>
        <span style={{ color: Colors.textSecondary, fontSize: Typography.micro.fontSize }}>
          Weight: {style.fontWeight}
        </span>
        <span style={{ color: Colors.textSecondary, fontSize: Typography.micro.fontSize }}>
          Letter: {style.letterSpacing}
        </span>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: Colors.background,
        padding: `${Spacing.xxxl}px ${Spacing.xl}px`,
        fontFamily: FontFamilies.body,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: Spacing.xxxl }}>
          <h1
            style={{
              color: Colors.textPrimary,
              ...getTypography('hero'),
              fontFamily: FontFamilies.display,
              margin: `0 0 ${Spacing.md}px 0`,
            }}
          >
            PLOS Design System
          </h1>
          <p style={{ color: Colors.textSecondary, ...getTypography('body'), margin: 0 }}>
            Complete design tokens for colors, typography, spacing, and components
          </p>
        </div>

        {/* Section: Background Colors */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Background Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: Spacing.base,
            }}
          >
            {renderColorCard('Background', Colors.background, 'Main app background')}
            {renderColorCard('Surface', Colors.surface, 'Elevated surfaces')}
            {renderColorCard('Card', Colors.card, 'Cards and containers')}
            {renderColorCard('Border', Colors.border, 'Borders and dividers')}
          </div>
        </section>

        {/* Section: Brand Colors */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Brand Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: Spacing.base,
            }}
          >
            {renderColorCard('Blue', Colors.blue, 'Primary actions')}
            {renderColorCard('Purple', Colors.purple, 'Journal, AI')}
            {renderColorCard('Teal', Colors.teal, 'Budget, growth')}
            {renderColorCard('Green', Colors.green, 'Habits, health')}
            {renderColorCard('Gold', Colors.gold, 'Lumi, premium')}
            {renderColorCard('Coral', Colors.coral, 'Warnings, errors')}
            {renderColorCard('Indigo', Colors.indigo, 'Sleep, calm')}
          </div>
        </section>

        {/* Section: Typography */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Typography Scale
          </h2>
          <div
            style={{
              backgroundColor: Colors.card,
              borderRadius: BorderRadius.md,
              padding: Spacing.xl,
              border: `1px solid ${Colors.border}`,
            }}
          >
            {Object.entries(Typography).map(([name, style]) => renderTypographySample(name, style))}
          </div>
        </section>

        {/* Section: Spacing Scale */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Spacing Scale
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: Spacing.md,
            }}
          >
            {Object.entries(Spacing).map(([name, value]) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Spacing.base,
                }}
              >
                <div
                  style={{
                    width: '100px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span
                    style={{
                      color: Colors.textSecondary,
                      fontSize: Typography.caption.fontSize,
                      fontFamily: 'monospace',
                    }}
                  >
                    {name}
                  </span>
                </div>
                <div
                  style={{
                    width: `${value}px`,
                    height: '24px',
                    backgroundColor: ModuleColors.lumi,
                    borderRadius: BorderRadius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: Spacing.xs,
                  }}
                >
                  <span
                    style={{
                      color: Colors.background,
                      fontSize: Typography.micro.fontSize,
                      fontWeight: FontWeights.medium,
                    }}
                  >
                    {value}px
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Border Radius */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Border Radius Scale
          </h2>
          <div
            style={{
              display: 'flex',
              gap: Spacing.lg,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {Object.entries(BorderRadius).map(([name, value]) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: Spacing.xs,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: Colors.card,
                    borderRadius: value,
                    border: `2px solid ${Colors.border}`,
                  }}
                />
                <span style={{ color: Colors.textSecondary, fontSize: Typography.micro.fontSize }}>
                  {name}
                </span>
                <span style={{ color: Colors.textMuted, fontSize: Typography.micro.fontSize, fontFamily: 'monospace' }}>
                  {value === 999 ? '∞' : `${value}px`}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Module Colors */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Module Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: Spacing.base,
            }}
          >
            {Object.entries(ModuleColors).map(([name, color]) =>
              renderColorCard(name, color)
            )}
          </div>
        </section>

        {/* Section: Gradients */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Gradients
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: Spacing.base,
            }}
          >
            {Object.entries(gradients).map(([name, colors]) =>
              renderGradientCard(name, colors)
            )}
          </div>
        </section>

        {/* Section: Component Examples */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Component Examples
          </h2>
          <div
            style={{
              backgroundColor: Colors.card,
              borderRadius: BorderRadius.lg,
              padding: Spacing.xl,
              border: `1px solid ${Colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: Spacing.lg,
            }}
          >
            {/* Button Variants */}
            <div style={{ display: 'flex', gap: Spacing.base, flexWrap: 'wrap' }}>
              <button
                style={{
                  padding: `${Spacing.md}px ${Spacing.lg}px`,
                  backgroundColor: Colors.blue,
                  border: 'none',
                  borderRadius: BorderRadius.md,
                  color: Colors.background,
                  ...getTypography('button'),
                  cursor: 'pointer',
                }}
              >
                Primary Button
              </button>
              <button
                style={{
                  padding: `${Spacing.md}px ${Spacing.lg}px`,
                  background: getGradient('premium'),
                  border: 'none',
                  borderRadius: BorderRadius.md,
                  color: Colors.background,
                  ...getTypography('button'),
                  cursor: 'pointer',
                }}
              >
                Premium Gradient
              </button>
              <button
                style={{
                  padding: `${Spacing.md}px ${Spacing.lg}px`,
                  backgroundColor: 'transparent',
                  border: `2px solid ${Colors.purple}`,
                  borderRadius: BorderRadius.md,
                  color: Colors.purple,
                  ...getTypography('button'),
                  cursor: 'pointer',
                }}
              >
                Outline Button
              </button>
              <button
                style={{
                  padding: `${Spacing.md}px ${Spacing.lg}px`,
                  backgroundColor: ModuleColors.lumi,
                  border: 'none',
                  borderRadius: BorderRadius.pill,
                  color: Colors.background,
                  ...getTypography('button'),
                  cursor: 'pointer',
                }}
              >
                Pill Button
              </button>
            </div>

            {/* Module Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: Spacing.base }}>
              {[
                { name: 'Journal', color: ModuleColors.journal, icon: '📓' },
                { name: 'Habits', color: ModuleColors.habits, icon: '✅' },
                { name: 'Budget', color: ModuleColors.budget, icon: '💰' },
                { name: 'Sleep', color: ModuleColors.sleep, icon: '😴' },
              ].map((item) => (
                <div
                  key={item.name}
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.base,
                    borderLeft: `4px solid ${item.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: Spacing.sm,
                  }}
                >
                  <span style={{ fontSize: Typography.title.fontSize }}>{item.icon}</span>
                  <span style={{ color: Colors.textPrimary, fontSize: Typography.body.fontSize, fontWeight: FontWeights.medium }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Status Badges */}
            <div style={{ display: 'flex', gap: Spacing.sm, flexWrap: 'wrap' }}>
              {[
                { label: 'Completed', color: Colors.success },
                { label: 'In Progress', color: Colors.info },
                { label: 'Warning', color: Colors.warning },
                { label: 'Error', color: Colors.error },
              ].map((badge) => (
                <span
                  key={badge.label}
                  style={{
                    padding: `${Spacing.xs}px ${Spacing.md}px`,
                    backgroundColor: getColorWithOpacity(badge.color, 0.15),
                    border: `1px solid ${badge.color}`,
                    borderRadius: BorderRadius.pill,
                    color: badge.color,
                    ...getTypography('micro'),
                    textTransform: 'uppercase',
                  }}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            {/* Form Input */}
            <div style={{ maxWidth: '400px' }}>
              <label
                style={{
                  display: 'block',
                  color: Colors.textSecondary,
                  ...getTypography('caption'),
                  marginBottom: Spacing.xs,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: `${Spacing.md}px`,
                  backgroundColor: Colors.surface,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: BorderRadius.md,
                  color: Colors.textPrimary,
                  ...getTypography('body'),
                  outline: 'none',
                }}
              />
            </div>

            {/* Card with Typography */}
            <div
              style={{
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.lg,
                padding: Spacing.xl,
                border: `1px solid ${Colors.border}`,
              }}
            >
              <h3
                style={{
                  color: Colors.textPrimary,
                  ...getTypography('subtitle'),
                  margin: `0 0 ${Spacing.sm}px 0`,
                }}
              >
                Card Title
              </h3>
              <p
                style={{
                  color: Colors.textSecondary,
                  ...getTypography('body'),
                  margin: 0,
                }}
              >
                This demonstrates the body text style with proper line height and readability.
              </p>
              <div style={{ marginTop: Spacing.md, display: 'flex', gap: Spacing.xs }}>
                <span style={{ color: Colors.textMuted, ...getTypography('micro'), textTransform: 'uppercase' }}>
                  Last updated
                </span>
                <span style={{ color: ModuleColors.lumi, ...getTypography('micro'), textTransform: 'uppercase' }}>
                  2 hours ago
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Font Families */}
        <section style={{ marginBottom: Spacing.xxxl }}>
          <h2
            style={{
              color: ModuleColors.lumi,
              ...getTypography('micro'),
              textTransform: 'uppercase',
              letterSpacing: Typography.micro.letterSpacing,
              margin: `0 0 ${Spacing.lg}px 0`,
            }}
          >
            Font Families
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: Spacing.base,
            }}
          >
            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: BorderRadius.md,
                padding: Spacing.xl,
                border: `1px solid ${Colors.border}`,
              }}
            >
              <h3 style={{ color: Colors.textMuted, ...getTypography('caption'), margin: `0 0 ${Spacing.md}px 0` }}>
                Display Font
              </h3>
              <p style={{ color: Colors.textPrimary, fontFamily: FontFamilies.display, fontSize: Typography.title.fontSize, margin: 0 }}>
                DM Serif Display
              </p>
              <p style={{ color: Colors.textSecondary, fontSize: Typography.caption.fontSize, marginTop: Spacing.sm }}>
                For headings and Lumi's voice
              </p>
            </div>
            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: BorderRadius.md,
                padding: Spacing.xl,
                border: `1px solid ${Colors.border}`,
              }}
            >
              <h3 style={{ color: Colors.textMuted, ...getTypography('caption'), margin: `0 0 ${Spacing.md}px 0` }}>
                Body Font
              </h3>
              <p style={{ color: Colors.textPrimary, fontFamily: FontFamilies.body, fontSize: Typography.title.fontSize, margin: 0 }}>
                Inter
              </p>
              <p style={{ color: Colors.textSecondary, fontSize: Typography.caption.fontSize, marginTop: Spacing.sm }}>
                For UI text and body content
              </p>
            </div>
            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: BorderRadius.md,
                padding: Spacing.xl,
                border: `1px solid ${Colors.border}`,
              }}
            >
              <h3 style={{ color: Colors.textMuted, ...getTypography('caption'), margin: `0 0 ${Spacing.md}px 0` }}>
                Handwriting Font
              </h3>
              <p style={{ color: Colors.textPrimary, fontFamily: FontFamilies.handwriting, fontSize: Typography.title.fontSize, margin: 0 }}>
                Caveat
              </p>
              <p style={{ color: Colors.textSecondary, fontSize: Typography.caption.fontSize, marginTop: Spacing.sm }}>
                For journal dates and affirmations
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', paddingTop: Spacing.xl }}>
          <p style={{ color: Colors.textMuted, fontSize: Typography.caption.fontSize }}>
            PLOS Design System • WCAG AA Compliant • OLED Optimized
          </p>
        </footer>
      </div>
    </div>
  );
}
