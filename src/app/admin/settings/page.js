"use client";

import { useAdminSettings, AdminPageLayout } from "../admin-shared";

function SettingsView({
  theme, setTheme,
  fontSize, setFontSize,
  platformName, setPlatformName,
  notificationsEnabled, setNotificationsEnabled,
  sessionTimeout, setSessionTimeout
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
      
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Theme Colors</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Choose your preferred color theme for the administration workspace dashboard</span>
        
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <button 
            suppressHydrationWarning={true}
            onClick={() => setTheme("dark")}
            style={{
              flex: 1, padding: 16, borderRadius: 8, cursor: "pointer",
              background: theme === "dark" ? "rgba(249,115,22,0.15)" : "var(--bg-main)",
              border: theme === "dark" ? "2px solid #f97316" : "1px solid var(--border-color)",
              color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 600, fontSize: "calc(13px * var(--font-scale))"
            }}
          >
            🌙 Dark Mode {theme === "dark" && "✓"}
          </button>
          <button 
            suppressHydrationWarning={true}
            onClick={() => setTheme("light")}
            style={{
              flex: 1, padding: 16, borderRadius: 8, cursor: "pointer",
              background: theme === "light" ? "rgba(249,115,22,0.15)" : "var(--bg-main)",
              border: theme === "light" ? "2px solid #f97316" : "1px solid var(--border-color)",
              color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontWeight: 600, fontSize: "calc(13px * var(--font-scale))"
            }}
          >
            ☀️ Light Mode {theme === "light" && "✓"}
          </button>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Typography Size Adjustments</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Increase or decrease the platform font scale factor dynamically for improved accessibility</span>
        
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {["small", "medium", "large"].map(size => (
            <button
              key={size}
              suppressHydrationWarning={true}
              onClick={() => setFontSize(size)}
              style={{
                flex: 1, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                background: fontSize === size ? "#f97316" : "var(--bg-main)",
                border: "1px solid var(--border-color)",
                color: fontSize === size ? "#fff" : "var(--text-main)",
                textTransform: "capitalize", fontWeight: 600, fontSize: "calc(12px * var(--font-scale))"
              }}
            >
              {size} {fontSize === size && "✓"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Branding Details</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Update the platform branding details that appear dynamically across the administration layout</span>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", fontWeight: 500 }}>Admin Platform Portal Name</label>
            <input 
              suppressHydrationWarning={true}
              type="text" 
              value={platformName}
              onChange={e => setPlatformName(e.target.value)}
              style={{
                background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                padding: "10px 14px", color: "var(--text-main)", outline: "none", fontSize: "calc(12px * var(--font-scale))"
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-main)", fontSize: "calc(15px * var(--font-scale))", fontWeight: 600, margin: "0 0 4px" }}>Security & Workspace Settings</h3>
        <span style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))" }}>Configure inactivity system security preferences and global sound variables</span>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 600 }}>Enable Notification Sounds</div>
              <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Play dynamic tone effects when new platform notifications arrive</div>
            </div>
            <button 
              suppressHydrationWarning={true}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              style={{
                background: notificationsEnabled ? "#10b981" : "#ef4444",
                border: "none", color: "#fff", borderRadius: 20, padding: "6px 16px", cursor: "pointer",
                fontSize: "calc(10px * var(--font-scale))", fontWeight: 700
              }}
            >
              {notificationsEnabled ? "ON / Active" : "OFF / Silent"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
            <div>
              <div style={{ color: "var(--text-main)", fontSize: "calc(12px * var(--font-scale))", fontWeight: 600 }}>Automatic Session Log-Out</div>
              <div style={{ color: "var(--text-muted)", fontSize: "calc(10px * var(--font-scale))" }}>Enforce automated inactivity workspace disconnects to secure admin sessions</div>
            </div>
            <select
              suppressHydrationWarning={true}
              value={sessionTimeout}
              onChange={e => setSessionTimeout(e.target.value)}
              style={{
                background: "var(--bg-main)", border: "1px solid var(--border-input)", borderRadius: 8,
                padding: "8px 12px", color: "var(--text-main)", outline: "none", fontSize: "calc(11px * var(--font-scale))",
                cursor: "pointer"
              }}
            >
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="never">Never Log-Out</option>
            </select>
          </div>
        </div>
      </div>

      <button
        suppressHydrationWarning={true}
        onClick={() => {
          setTheme("dark");
          setFontSize("medium");
          setPlatformName("HelpNow SL");
          setNotificationsEnabled(true);
          setSessionTimeout("30m");
        }}
        style={{
          background: "none", border: "1px solid #ef4444", color: "#f87171",
          borderRadius: 8, padding: "10px 16px", alignSelf: "flex-start", cursor: "pointer",
          fontSize: "calc(11px * var(--font-scale))", fontWeight: 600, transition: "all 0.2s"
        }}
      >
        Reset Workspace Preferences to Defaults
      </button>

    </div>
  );
}

export default function SettingsPage() {
  const settings = useAdminSettings();

  return (
    <AdminPageLayout activeNav="settings">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-main)", fontSize: "calc(20px * var(--font-scale))", fontWeight: 700, margin: 0 }}>Workspace settings ⚙️</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "calc(11px * var(--font-scale))", marginTop: 4 }}>
          Configure your portal workspace colors, typography metrics, portal titles and automated logs.
        </div>
      </div>

      <SettingsView 
        theme={settings.theme} setTheme={settings.setTheme}
        fontSize={settings.fontSize} setFontSize={settings.setFontSize}
        platformName={settings.platformName} setPlatformName={settings.setPlatformName}
        notificationsEnabled={settings.notificationsEnabled} setNotificationsEnabled={settings.setNotificationsEnabled}
        sessionTimeout={settings.sessionTimeout} setSessionTimeout={settings.setSessionTimeout}
      />
    </AdminPageLayout>
  );
}