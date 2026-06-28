const { app, BrowserWindow, Menu, shell } = require("electron");

// Your live platform — the desktop app simply loads it inside a protected window.
const SITE_URL = "https://captainmaged.vercel.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
    title: "Captain Maged Academy",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false, // no devtools in the shipped app
    },
  });

  // ── THE KEY LINE ─────────────────────────────────────────────────────────
  // Excludes this window from ALL screen capture and screenshots at the OS level.
  //   Windows  → SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)
  //   macOS    → NSWindow.sharingType = .none
  // Result: OBS, Game Bar, Snipping Tool, PrtSc, Fn+PrtSc, Zoom/Teams screen
  //         share all capture a BLACK rectangle where the video is.
  win.setContentProtection(true);

  Menu.setApplicationMenu(null);

  // Tag the app's traffic so the website can (optionally) serve video ONLY to
  // the desktop app and refuse plain browsers — closing the "just use Chrome" gap.
  const ua = win.webContents.getUserAgent() + " CaptainMagedDesktop/1.0";
  win.webContents.setUserAgent(ua);

  win.loadURL(SITE_URL, { userAgent: ua });

  // External links open in the system browser, never inside the protected app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(SITE_URL)) { e.preventDefault(); shell.openExternal(url); }
  });

  // Block devtools / view-source key combos inside the app
  win.webContents.on("before-input-event", (event, input) => {
    const k = (input.key || "").toLowerCase();
    if (k === "f12") event.preventDefault();
    if (input.control && input.shift && (k === "i" || k === "j")) event.preventDefault();
    if (input.control && k === "u") event.preventDefault();
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
