import { Colors, ModuleColors, gradients, getGradient } from '../lib/colors';

/**
 * ColorPreview — Display all PLOS colors in organized sections
 * Use this to visualize the new color system
 */
export default function ColorPreview() {
  const renderColorCard = (name, color, description = '') => (
    <div
      key={name}
      style={{
        backgroundColor: Colors.card,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${Colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '60px',
          backgroundColor: color,
          borderRadius: '8px',
          border: `1px solid ${Colors.border}`,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: Colors.textPrimary, fontSize: '14px', fontWeight: 600 }}>
          {name}
        </span>
        <span style={{ color: Colors.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
          {color}
        </span>
      </div>
      {description && (
        <span style={{ color: Colors.textSecondary, fontSize: '11px' }}>
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
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${Colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '60px',
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          borderRadius: '8px',
        }}
      />
      <span style={{ color: Colors.textPrimary, fontSize: '14px', fontWeight: 600 }}>
        {name}
      </span>
      <span style={{ color: Colors.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>
        {colors[0]} → {colors[1]}
      </span>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: Colors.background,
        padding: '40px 24px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1
            style={{
              color: Colors.textPrimary,
              fontSize: '36px',
              fontWeight: 700,
              margin: '0 0 12px 0',
            }}
          >
            PLOS Color System
          </h1>
          <p style={{ color: Colors.textSecondary, fontSize: '16px', margin: 0 }}>
            Dark theme optimized for OLED displays and low-light usage
          </p>
        </div>

        {/* Section: Base Colors */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            Background Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            {renderColorCard('Background', Colors.background, 'Deepest black - main app bg')}
            {renderColorCard('Surface', Colors.surface, 'Elevated surfaces')}
            {renderColorCard('Card', Colors.card, 'Cards and containers')}
            {renderColorCard('Border', Colors.border, 'Borders and dividers')}
          </div>
        </section>

        {/* Section: Brand Colors */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            Brand Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '16px',
            }}
          >
            {renderColorCard('Blue', Colors.blue, 'Primary actions, links')}
            {renderColorCard('Purple', Colors.purple, 'Journal, creativity, AI')}
            {renderColorCard('Teal', Colors.teal, 'Budget, money, growth')}
            {renderColorCard('Green', Colors.green, 'Habits, health, success')}
            {renderColorCard('Gold', Colors.gold, 'Premium, Lumi, achievements')}
            {renderColorCard('Coral', Colors.coral, 'Warnings, limits, errors')}
            {renderColorCard('Indigo', Colors.indigo, 'Sleep, evening, calm')}
          </div>
        </section>

        {/* Section: Semantic Colors */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            Semantic Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '16px',
            }}
          >
            {renderColorCard('Success', Colors.success, 'Completed, verified')}
            {renderColorCard('Warning', Colors.warning, 'Caution, attention')}
            {renderColorCard('Error', Colors.error, 'Failed, critical')}
            {renderColorCard('Info', Colors.info, 'Informational')}
          </div>
        </section>

        {/* Section: Text Colors */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            Text Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${Colors.border}`,
              }}
            >
              <p style={{ color: Colors.textPrimary, fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0' }}>
                Text Primary
              </p>
              <p style={{ color: Colors.textMuted, fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>
                {Colors.textPrimary}
              </p>
            </div>
            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${Colors.border}`,
              }}
            >
              <p style={{ color: Colors.textSecondary, fontSize: '16px', margin: '0 0 8px 0' }}>
                Text Secondary
              </p>
              <p style={{ color: Colors.textMuted, fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>
                {Colors.textSecondary}
              </p>
            </div>
            <div
              style={{
                backgroundColor: Colors.card,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${Colors.border}`,
              }}
            >
              <p style={{ color: Colors.textMuted, fontSize: '16px', margin: '0 0 8px 0' }}>
                Text Muted
              </p>
              <p style={{ color: Colors.textMuted, fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>
                {Colors.textMuted}
              </p>
            </div>
          </div>
        </section>

        {/* Section: Module Colors */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            Module-Specific Colors
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {Object.entries(ModuleColors).map(([name, color]) =>
              renderColorCard(name, color)
            )}
          </div>
        </section>

        {/* Section: Gradients */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            Gradients
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {Object.entries(gradients).map(([name, colors]) =>
              renderGradientCard(name, colors)
            )}
          </div>
        </section>

        {/* Section: Usage Examples */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              color: Colors.gold,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 20px 0',
            }}
          >
            UI Component Examples
          </h2>
          <div
            style={{
              backgroundColor: Colors.card,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${Colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Primary Button */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                style={{
                  padding: '12px 24px',
                  backgroundColor: Colors.blue,
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Primary Action
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  background: getGradient('premium'),
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Premium Button
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  border: `2px solid ${Colors.purple}`,
                  borderRadius: '12px',
                  color: Colors.purple,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Journal Button
              </button>
            </div>

            {/* Module Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { name: 'Journal', color: Colors.purple, icon: '📓' },
                { name: 'Habits', color: Colors.green, icon: '✅' },
                { name: 'Budget', color: Colors.teal, icon: '💰' },
                { name: 'Sleep', color: Colors.indigo, icon: '😴' },
              ].map((item) => (
                <div
                  key={item.name}
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: '12px',
                    padding: '16px',
                    borderLeft: `4px solid ${item.color}`,
                  }}
                >
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>{item.icon}</span>
                  <span style={{ color: Colors.textPrimary, fontSize: '14px', fontWeight: 500 }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Status Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Completed', color: Colors.success },
                { label: 'In Progress', color: Colors.info },
                { label: 'Warning', color: Colors.warning },
                { label: 'Error', color: Colors.error },
              ].map((badge) => (
                <span
                  key={badge.label}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: `${badge.color}20`,
                    border: `1px solid ${badge.color}`,
                    borderRadius: '20px',
                    color: badge.color,
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', paddingTop: '24px' }}>
          <p style={{ color: Colors.textMuted, fontSize: '12px' }}>
            PLOS Color System • WCAG AA Compliant • OLED Optimized
          </p>
        </footer>
      </div>
    </div>
  );
}
