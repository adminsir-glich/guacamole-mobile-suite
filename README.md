# ⚡ Apache Guacamole Mobile Superpowers Suite

> **Turn Apache Guacamole into a world-class mobile workstation: Native Mobile Touch, Smooth Relative Trackpad, Google Maps-Style 2-Finger Pan & Zoom, Edge-to-Edge Terminal Reflow, and Strict Zero-Interruption Keyboard Policy.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Guacamole Version](https://img.shields.io/badge/Apache%20Guacamole-1.5.0%20%7C%201.6.0%2B-brightgreen.svg)](https://guacamole.apache.org/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Docker%20%7C%20Web-orange.svg)]()
[![Mobile Touch](https://img.shields.io/badge/Touch-Android%20%7C%20iOS%20%7C%20iPadOS-blueviolet.svg)]()
[![SEO Score](https://img.shields.io/badge/Search%20Optimized-100%25-success.svg)]()

---

## 📌 Executive Summary & Motivation

Running a **Desktop in Linux** from a web browser gives engineers, researchers, and remote workers boundless compute power on the go. [Apache Guacamole](https://guacamole.apache.org/) is the industry-standard, clientless remote gateway for RDP, VNC, and SSH. 

However, out-of-the-box Guacamole was architected for physical desktop mice and 101-key keyboards. When opened on mobile devices (Android, iPhone, iPad), users encounter severe usability friction:

- ❌ **Viewport Crushing & Hardcoded Scales**: Standard Guacamole clamps minimum zoom to ~38%, cropping large portions of high-resolution remote desktops and terminal screens.
- ❌ **Intrusive Keyboard Auto-Popups**: Merely scrolling through a shell buffer or tapping the screen accidentally summons the on-screen keyboard, obstructing the terminal view.
- ❌ **Window Centering & Empty Void**: Terminal SSH sessions are rendered inside a centered table cell with massive empty margins rather than filling 100% of the mobile viewport.
- ❌ **Imprecise Direct Tap Emulation**: Tapping a high-DPI desktop with a thumb causes frequent misclicks, making window management and taskbars painful to control.
- ❌ **Clunky On-Screen Keyboards**: Guacamole attempts to render a rigid simulated HTML canvas keyboard (`<guac-osk>`) instead of letting users leverage their phone's native Gboard, Apple iOS, or Samsung keyboard with autocorrect and voice typing.

**Apache Guacamole Mobile Superpowers Suite** is a zero-latency, drop-in extension that completely transforms Guacamole into a native-feeling mobile workstation.

---

## 🌟 Key Features & Architectural Superpowers

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │              ⚡ APACHE GUACAMOLE MOBILE WORKSPACE SUITE                │
  ├────────────────────────────────────────────────────────────────────────┤
  │  🗺️  Google Maps 2-Finger Pan & Zoom (5% to 500% Unlocked)             │
  │  📐  Default 28% Viewport Snap (Zero Screen Leaving / Zero Cropping)  │
  │  ⏻   Minimized PowerIcon Dynamic Island (Drag Anywhere on Screen)      │
  │  ⌨️   Strict Isolated Keyboard Toggle (Zero Auto-Popups on Scroll)      │
  │  💻  Edge-to-Edge Terminal with Dynamic PTY Reflow (TIOCSWINSZ)       │
  │  🖱️  Full-Screen Relative Trackpad Mode (Fluid Cursor Gliding)         │
  │  📋  Standard 1.8s Long-Press Copy & Instant Paste                    │
  │  ⛶   Automatic Edge-to-Edge Fullscreen Immersion                      │
  └────────────────────────────────────────────────────────────────────────┘
```

### 1. 📐 28% Default Viewport Snap & Unlocked Zoom (5% to 500%)
- **Perfect Screen Fit**: Both Desktop and Terminal sessions automatically initialize at **28% scale (`0.28`)**, engineered to display the entire remote instance without cropping, overflow, or leaving the screen.
- **`[ 📐 Fit ]` Instant Reset**: Tapping `[ 📐 Fit ]` snaps the display back to the optimal 28% boundary.
- **Bypasses the 38% Limit**: Unlocks smooth scaling all the way down to **`5%`** (`0.05`) for overview and up to **`500%`** (`5.0`) for pixel-level precision.

### 2. 🗺️ Google Maps-Style Omnidirectional 2D Pan & Glide Zoom
- **Midpoint-Anchored 2-Finger Gestures**: Zooming and panning operate identically to Google Maps or Apple Maps. The focal anchor remains locked between your two fingers.
- **Simultaneous 2D Glide**: Pan across X and Y dimensions in a single fluid gesture. Effortlessly traverse multi-monitor setups, wide IDE editors (VS Code), and ultra-wide workspaces without axis lock.

### 3. ⌨️ Strict Terminal Keyboard Policy & Zero-Interruption Scrolling
- **Zero Auto-Popups**: The on-screen mobile keyboard will **NEVER** pop up when scrolling with one finger, swiping, or navigating the terminal buffer.
- **Dedicated `[ ⌨️ Keyboard ]` Action Button**: The bottom terminal helper bar features an explicit `[ ⌨️ Keyboard ]` button at the front.
- **Strict Event Isolation**: Native text inputs are completely locked down (`display: none !important; pointer-events: none !important;`) until the user explicitly taps the keyboard toggle.
- **Visual Viewport Adaptive Elevation**: When the virtual keyboard appears, the helper bar automatically shifts up with **`+16px` clearance** above the keys. Tap `[ ✕ ⌨️ ]` or tap the button again to dismiss.

### 4. ⏻ Minimized PowerIcon Capsule with Fluid Dragging
- **Compact Dynamic Island**: When minimized, the control capsule collapses into a sleek glowing pill featuring a live pulsating green status dot (`.pill-live-dot`), power icon (`⏻`), text badge (`Guac`), and move glyph (`✥`).
- **Freeform Drag Anywhere**: Touch and drag the minimized capsule to any corner or edge of the viewport.
- **Zero Accidental Expansion**: Drag movements never trigger premature expansion. Tapping the capsule without moving expands it back into the full glassmorphism control center.

### 5. 💻 Edge-to-Edge Terminal with Real Dynamic PTY Reflow
- **No Floating Windows**: Completely eliminates table-cell centering and padding hacks. The terminal occupies **100% of the screen width and height**.
- **Dynamic Character Reflow (`SIGWINCH`)**: When zooming in or out, the extension calculates effective terminal dimensions and triggers Guacamole's PTY resize (`client.sendSize()`). Real Linux shells (bash, zsh, tmux) reflow text columns dynamically across the full width, exactly like native mobile emulators (Termux, JuiceSSH).
- **1-Finger Smooth Buffer Scroll**: Effortlessly swipe vertically to scroll through your command history and output buffer without triggering unwanted viewport shifts.

### 6. 🖱️ Relative Laptop Trackpad Mode
- **Touchscreen as a Trackpad**: Glide your finger anywhere on the screen to move the remote cursor smoothly and relatively.
- **Tap-to-Click**: Light tap sends a left click; supports drag-and-drop.
- **One-Tap Mode Switch**: Easily toggle between `[ 🖱️ Trackpad ]` and `[ 👆 Direct Touch ]`.

### 7. 📋 Long-Press Copy & Active Clipboard Helper
- **Standard Long-Press**: Press and hold on terminal text for **1.8 seconds** with haptic vibration feedback to copy directly to device clipboard.
- **Direct Buttons**: Dedicated `[ 📋 Copy ]` and `[ 📋 Paste ]` buttons directly on the terminal helper bar.

---

## 🏗️ Architecture & Component Topology

```mermaid
flowchart TD
    subgraph ClientLayer["📱 Client Layer (Any Mobile Browser)"]
        User["👤 Mobile User (Android / iOS / iPadOS)"]
        BrowserEngine["🌐 Mobile WebKit / Chromium"]
        InputInter["⚡ Guacamole Mobile Interceptor (mobile.js & mobile.css)"]
    end

    subgraph GatewayLayer["🛡️ Apache Guacamole Infrastructure"]
        ReverseProxy["🔒 Nginx SSL / TLS Reverse Proxy"]
        GuacWeb["☕ Apache Guacamole Tomcat (guacamole.war)"]
        Guacd["⚙️ Guacamole Proxy Daemon (guacd)"]
    end

    subgraph RemoteLayer["🐧 Remote Linux Environment"]
        LinuxDesktop["🖥️ Linux Desktop (XFCE / GNOME / XRDP / TigerVNC)"]
        LinuxShell["💻 Shell Session (Bash / Zsh / Tmux via SSH)"]
    end

    User -->|Touch, Gestures, Pinch| BrowserEngine
    BrowserEngine -->|Capture Phase Filter| InputInter
    InputInter -->|Scale (0.28), Mouse Emulation, SendSize| GuacWeb
    GuacWeb -->|Guacamole Protocol| Guacd
    Guacd -->|RDP / VNC Protocol| LinuxDesktop
    Guacd -->|SSH / PTY Stream| LinuxShell
    ReverseProxy -.->|Terminates SSL & WSS| GuacWeb
```

---

## 🚀 Quick Start / Installation

You can install this suite either as a **drop-in extension JAR** on an existing Guacamole server, or deploy a **complete Docker stack** from scratch.

### Option 1: Drop-in Extension into Existing Guacamole (2 Minutes)

1. **Clone the Repository & Build the Extension JAR**:
   ```bash
   git clone https://github.com/adminsir-glich/guacamole-mobile-suite.git
   cd guacamole-mobile-suite/extension
   chmod +x build.sh && ./build.sh
   ```
   This generates `guacamole-mobile-suite.jar`.

2. **Deploy to your Guacamole Extensions Directory**:
   ```bash
   # If running via Docker:
   cp guacamole-mobile-suite.jar /path/to/guacamole/config/extensions/
   docker restart guacamole

   # If running on bare-metal Tomcat (Ubuntu / Debian):
   sudo cp guacamole-mobile-suite.jar /etc/guacamole/extensions/
   sudo systemctl restart tomcat9
   ```

3. **Verify Deployment**:
   Open Guacamole in your mobile browser. The **Dynamic Island control capsule** (`[ 🟢 ⏻ Guac ✥ ]`) will appear in the top-right corner.

---

### Option 2: Complete Docker Compose Deployment from Scratch

This repository includes a production-ready stack located in the [`docker/`](docker/) directory:

```bash
cd guacamole-mobile-suite/docker

# 1. Create extensions folder and place the built jar
mkdir -p extensions
cp ../guacamole-mobile-suite.jar extensions/

# 2. Copy the sample user-mapping configuration
cp user-mapping.xml.example user-mapping.xml
# Edit user-mapping.xml with your remote machine credentials:
nano user-mapping.xml

# 3. Launch the stack
docker compose up -d
```

Your Guacamole instance is now running on `http://127.0.0.1:8080/guacamole/`.

---

## ⚙️ Configuration Reference

### 1. SSH Terminal Connection Configuration (`user-mapping.xml`)

```xml
<connection name="Linux Cloud Terminal (SSH)">
    <protocol>ssh</protocol>
    <param name="hostname">127.0.0.1</param>
    <param name="port">22</param>
    <param name="username">your_username</param>
    <param name="password">your_password</param>
    <param name="font-name">monospace</param>
    <param name="font-size">14</param>
    <!-- 10,000 line scrollback buffer for extensive logs -->
    <param name="scrollback">10000</param>
    <!-- Heartbeat interval to prevent idle dropouts -->
    <param name="server-alive-interval">15</param>
    <param name="color-scheme">gray-black</param>
</connection>
```

### 2. Remote Desktop via RDP / VNC (`user-mapping.xml`)

```xml
<connection name="Linux Remote Desktop (RDP)">
    <protocol>rdp</protocol>
    <param name="hostname">127.0.0.1</param>
    <param name="port">3389</param>
    <param name="username">your_username</param>
    <param name="password">your_password</param>
    <param name="security">any</param>
    <param name="ignore-cert">true</param>
    <param name="enable-audio">true</param>
    <param name="enable-audio-input">true</param>
    <param name="resize-method">reconnect</param>
    <param name="color-depth">24</param>
    <param name="enable-font-smoothing">true</param>
</connection>
```

### 3. Nginx Reverse Proxy with Low-Latency WebSocket (`nginx.conf`)

```nginx
location /guacamole/ {
    proxy_pass http://127.0.0.1:8080/guacamole/;
    proxy_buffering off;
    proxy_http_version 1.1;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 📱 Mobile Gestures Cheat Sheet

| Feature / Action | Mobile Gesture / Shortcut | Description |
| :--- | :--- | :--- |
| **Google Maps Pan & Zoom** | 2-finger pinch & glide | Omnidirectional 2D glide across remote instance; scales from 5% to 500% |
| **Terminal Buffer Scroll** | 1-finger swipe up / down | Smooth terminal scrolling without auto-summoning keyboard |
| **Summon Native Keyboard** | Tap `[ ⌨️ Keyboard ]` | Summons Gboard / Samsung / iOS keyboard; safe +16px helper bar clearance |
| **Dismiss Keyboard** | Tap `[ ✕ ⌨️ ]` or keyboard toggle | Instantly hides keyboard and restores helper bar flush to the bottom |
| **Move PowerIcon Capsule** | Touch & drag minimized pill | Fluid repositioning anywhere on the screen without accidental expansion |
| **Expand PowerIcon Capsule** | Tap minimized capsule once | Opens the full Dynamic Island floating control center |
| **Quick Screen Fit** | Tap `[ 📐 Fit ]` | Instantly snaps zoom to 28% scale to display full instance without cropping |
| **1:1 Resolution Zoom** | Tap `[ 1:1 ]` | Snaps scale to 100% full pixel resolution |
| **Relative Trackpad Toggle** | Tap `[ 🖱️ Trackpad ]` / `[ 👆 Direct ]` | Switch between laptop-style relative cursor navigation and direct touch |
| **Copy Selected Text** | Long-press (> 1.8s) or `[ 📋 Copy ]` | Copies active selection with haptic feedback |
| **Paste into Terminal** | Tap `[ 📋 Paste ]` | Injects system clipboard directly into the remote session |
| **Toggle Fullscreen** | Tap `[ ⛶ Full Screen ]` / `[ ✕ Exit Full ]` | Hides mobile browser address bar for maximum display area |

---

## 🛠️ Setting Up a High-Performance Linux Desktop for Guacamole

To deploy an ultra-lightweight, high-performance XFCE desktop with TigerVNC and XRDP on Ubuntu / Debian:

```bash
# 1. Update package lists and install XFCE4 desktop environment
sudo apt update && sudo apt install -y xfce4 xfce4-goodies

# 2. Install TigerVNC server and XRDP
sudo apt install -y tigervnc-standalone-server xrdp

# 3. Configure XRDP session to use XFCE
echo "xfce4-session" > ~/.xsession
sudo systemctl enable xrdp && sudo systemctl restart xrdp

# 4. Enable PulseAudio audio streaming for Guacamole
sudo apt install -y pulseaudio pulseaudio-module-zeroconf
```

---

## 🔒 Security & Privacy Notice

- All sample configuration files (`user-mapping.xml.example`, `docker-compose.yml`, `nginx.conf.example`) contain **redacted placeholder credentials**.
- **Always use strong passwords** and place your Guacamole deployment behind HTTPS (SSL/TLS) with Let's Encrypt or Cloudflare.

---

## 📄 License & Community

This project is licensed under the [MIT License](LICENSE). Pull requests, issue reports, and feature suggestions are warmly welcomed!

- **GitHub Repository**: [adminsir-glich/guacamole-mobile-suite](https://github.com/adminsir-glich/guacamole-mobile-suite)
- **Author**: Malik Musab ([themalikmusab.me](https://themalikmusab.me))
