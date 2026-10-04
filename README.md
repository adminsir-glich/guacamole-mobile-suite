# 🚀 Apache Guacamole Mobile Superpowers Suite

> **Run a Full Linux Desktop in Any Browser with Native Mobile Touch, Smooth Trackpad, Fluid Pinch-to-Zoom, and Terminal Overscroll.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Guacamole Version](https://img.shields.io/badge/Apache%20Guacamole-1.6.0%2B-brightgreen.svg)](https://guacamole.apache.org/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Docker%20%7C%20Web-orange.svg)]()
[![Mobile](https://img.shields.io/badge/Mobile-Android%20%7C%20iOS%20%7C%20iPadOS-blueviolet.svg)]()

---

## 📌 Overview

**Apache Guacamole Mobile Superpowers Suite** is a client-side extension that transforms [Apache Guacamole](https://guacamole.apache.org/) into a touch-optimized, mobile-first cloud desktop and terminal gateway.

Running a **Desktop in Linux** via a web browser is one of the most powerful ways to access high-performance computing, remote workspaces, and development environments from anywhere. However, standard Apache Guacamole is designed primarily for desktop mouse and physical keyboard environments. When accessed from a mobile phone or tablet, default Guacamole suffers from critical usability bottlenecks:

- ❌ **Crushed Screen Resolution**: Desktops are forcefully shrunk down (`autoFit: true`) to a tiny ~38% stamp with no way to freely zoom out smaller or pan smoothly.
- ❌ **Clunky On-Screen Keyboards**: Guacamole attempts to draw a simulated `<guac-osk>` keyboard instead of summoning the phone's native keyboard (Gboard, Samsung, or iOS).
- ❌ **Terminal Prompt Cut-Off**: When typing in a terminal, the mobile virtual keyboard covers the prompt at the bottom of the screen, and the terminal refuses to scroll past the active row.
- ❌ **Frustrating Touch Navigation**: Direct touch on high-DPI remote desktops leads to misclicks and difficulty dragging windows.
- ❌ **Missing Native Fullscreen Controls**: Mobile browser address bars and navigation tabs consume valuable screen real estate.

**This suite resolves every single mobile pain point**, delivering an experience comparable to native mobile apps like Termius, Jump Desktop, and Termux directly inside your web browser.

---

## ✨ Features & Mobile Superpowers

### 1. 🔍 Unlocked Dynamic Zoom & Smart Screen-Fit
- **Zoom Smaller Than 38%**: Bypasses Guacamole's rigid `minScale` limit. Zoom down to **`5%` or `10%`** to view massive ultra-wide workspaces, or zoom in up to **`500%`** for pixel-level precision.
- **`[ 📐 Fit ]` Button**: Instantly snaps the desktop to the exact **38% screen-fit** that displays the entire instance without any side clipping.
- **`[ 1:1 ]` Button**: Instantly jumps to **100% true native resolution** for crisp, uncompressed desktop viewing.
- **Butter-Smooth 2-Finger Pinch**: Multi-touch pinch gestures are intercepted in the DOM capture phase, giving fluid pinch-to-zoom on both remote desktops and SSH terminals.

### 2. ⬛ Terminal 1-Finger Touch Scrolling & 70vh Overscroll Black Space
- **Never Lose Sight of the Prompt**: Standard Guacamole stops scrolling as soon as you hit the bottom line of the scrollback buffer. When the mobile keyboard opens, your command line gets hidden behind the keyboard.
- **70vh Overscroll Buffer**: Adds $70\%$ viewport height of clean black space below the terminal display.
- **Simultaneous Viewport & Buffer Scrolling**: Swiping up with one finger glides the prompt up into the middle of your screen, revealing clean black space underneath—exactly like a real Linux terminal emulator.

### 3. ⌨️ Native Soft Keyboard Auto-Focus (Zero Clunky OSKs)
- **Real Phone Keyboard**: Permanently hides `<guac-osk>` so your native phone keyboard (Gboard, Samsung, iOS) always appears.
- **Tap-to-Type in Terminals**: Simply tap the terminal canvas, and your native keyboard pops up immediately.
- **One-Tap Dismissal**: Dedicated `[ ✕ ⌨️ ]` button hides the keyboard instantly.
- **Desktop Keyboard Summoning**: Tap `[ ⌨️ Keyboard ]` on the floating control center to type into desktop browsers, editors, and IDEs.

### 4. 🏝️ Dynamic Island Minimized Control Capsule (Best in UI/UX)
- **Apple Dynamic Island Glassmorphism**: When minimized, the control center shrinks into an ultra-sleek **$62\text{px} \times 36\text{px}$** floating capsule (`rgba(15, 23, 42, 0.90)` frosted glass with blur and glowing cyan edge).
- **Breathing Live Status Orb**: Contains a pulsating emerald live indicator (`.pill-live-dot`) and remote screen icon (`⚡`).
- **Spring Physics**: Smooth spring animations when expanding or minimizing.
- **Draggable**: Drag and dock the pill anywhere on your screen.

### 5. 📋 Standard Mobile Long-Press Copy (> 1.8s)
- **No Accidental Copies**: Removes aggressive auto-copying on simple drags or scrolls.
- **Mobile Standard Gesture**: Press and hold on any word or output in the terminal for **1.8 seconds**.
- **Haptic Feedback**: The phone provides a subtle vibration buzz to confirm selection and copies the text directly to your device clipboard.
- **Active Controls**: Includes dedicated `[ 📋 Copy ]` and `[ 📋 Paste ]` buttons on the mobile bar.

### 6. 🖱️ Full-Screen Relative Trackpad Mode
- **Independent Cursor Glide**: Swiping anywhere on your screen glides the remote mouse cursor relatively in that direction; tapping clicks at the cursor.
- **Edge Following**: The viewport automatically follows the cursor across the full 100% desktop.
- **One-Tap Mode Switch**: Toggle between `[ 🖱️ Trackpad ]` and `[ 👆 Direct ]` touch at any moment.

### 7. 🛡️ Dynamic Viewport Keyboard Clearance (+16px Margin)
- Uses the modern `window.visualViewport` API to detect when the virtual keyboard slides up.
- Automatically lifts the shortcut helper bar with **`+16px` safe clearance**, ensuring keys (`Esc`, `Tab`, `Ctrl`, `Alt`, arrows, `PgUp`, `PgDn`, `Copy`, `Paste`) are 100% visible and never clipped under the keyboard.

### 8. ⛶ Edge-to-Edge Fullscreen Toggle
- Tapping any connection automatically requests native browser fullscreen.
- Prominent `[ ⛶ Full Screen ]` / `[ ✕ Exit Full ]` buttons allow you to instantly reveal Chrome / Safari address bars and navigation tabs, or return to full screen.

---

## 🏗️ Architecture & Interaction Flow

```mermaid
flowchart TD
    Client["📱 Mobile Client (Chrome / Safari / Firefox)"]
    ReverseProxy["🛡️ Nginx Reverse Proxy (SSL / WebSocket)"]
    GuacWebApp["☕ Apache Guacamole Web Application (Tomcat)"]
    GuacSuite["⚡ Mobile Superpowers Extension (mobile.js & mobile.css)"]
    Guacd["⚙️ Guacamole Proxy Daemon (guacd)"]
    LinuxDesktop["🖥️ Remote Linux Desktop (XFCE / GNOME / XRDP / TigerVNC)"]
    SSHTerminal["💻 Remote Linux Shell (SSH)"]

    Client -->|HTTPS / WSS| ReverseProxy
    ReverseProxy -->|HTTP / WS| GuacWebApp
    GuacWebApp -->|Injected UI & Events| GuacSuite
    GuacWebApp -->|Guacamole Protocol| Guacd
    Guacd -->|RDP / VNC Protocol| LinuxDesktop
    Guacd -->|SSH Protocol| SSHTerminal
```

### Mobile Input & Gesture Interceptor Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Mobile User
    participant DOM as 📱 Browser Window (Capture Phase)
    participant Suite as ⚡ Mobile Superpowers Interceptor
    participant Guac as 🖥️ Guacamole Client Engine
    participant Remote as 🐧 Linux Remote Server

    User->>DOM: Two-Finger Pinch Gesture
    DOM->>Suite: touchstart / touchmove (Capture Phase)
    Suite->>Suite: Calculate distance ratio (Unlocks scale down to 5%)
    Suite->>Guac: applyScopeChange(scale = newScale)
    Suite-->>DOM: stopImmediatePropagation() (Blocks Touchpad Scroll Conflict)
    Guac->>Remote: Render Crisp Scaled Display

    User->>DOM: 1-Finger Swipe Up in Terminal
    DOM->>Suite: touchmove (1 finger, Terminal)
    Suite->>DOM: main.scrollTop -= deltaY (Glides view into 70vh Black Space)
    Suite->>Guac: sendMouseState(button 4/5 wheel events)
    Guac->>Remote: Scroll terminal buffer up / down
    Note over User,Remote: Prompt stays visible above virtual keyboard!
```

---

## 🚀 Quick Start / Installation

You can install this suite either as a **drop-in extension JAR** on an existing Guacamole server, or deploy a **complete Docker stack** from scratch.

### Method 1: Drop-in Extension into Existing Guacamole (2 Minutes)

1. **Download or Build the Extension JAR**:
   ```bash
   git clone https://github.com/adminsir-glich/guacamole-mobile-suite.git
   cd guacamole-mobile-suite/extension
   chmod +x build.sh && ./build.sh
   ```
   This generates `guacamole-mobile-suite.jar`.

2. **Copy to your Guacamole Extensions Directory**:
   ```bash
   # If running via Docker:
   cp guacamole-mobile-suite.jar /path/to/guacamole/config/extensions/
   docker restart guacamole

   # If running on bare-metal Tomcat:
   sudo cp guacamole-mobile-suite.jar /etc/guacamole/extensions/
   sudo systemctl restart tomcat9
   ```

3. **Verify Installation**:
   Open Guacamole in your mobile browser. The **Dynamic Island control capsule** (`[ 🟢 ⚡ ]`) will appear in the top-right corner.

---

### Method 2: Complete Docker Compose Deployment from Scratch

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

### 1. SSH Terminal Parameters (`user-mapping.xml`)

To get the most out of mobile terminal sessions, configure your connections with 10,000 lines of scrollback and keep-alive:

```xml
<connection name="Linux Cloud Terminal (SSH)">
    <protocol>ssh</protocol>
    <param name="hostname">127.0.0.1</param>
    <param name="port">22</param>
    <param name="username">your_username</param>
    <param name="password">your_password</param>
    <param name="font-name">monospace</param>
    <param name="font-size">14</param>
    <!-- Extended 10,000 row scrollback buffer -->
    <param name="scrollback">10000</param>
    <!-- Prevents "User is not responding" disconnects -->
    <param name="server-alive-interval">15</param>
    <param name="color-scheme">gray-black</param>
</connection>
```

### 2. High-Performance Linux Desktop via RDP (`user-mapping.xml`)

```xml
<connection name="Ubuntu Desktop (RDP)">
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

### 3. Nginx Reverse Proxy with WebSocket (`nginx.conf`)

Guacamole requires proper WebSocket headers for low-latency streaming:

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

| Action | Mobile Gesture |
| :--- | :--- |
| **Zoom In / Out** | 2-finger pinch anywhere on the screen (scales 5% to 500%) |
| **Terminal Scroll** | 1-finger swipe up or down (glides into black space above keyboard) |
| **Summon Keyboard** | Quick single tap on the terminal canvas |
| **Copy Text (Terminal)** | Long press (> 1.8 seconds) on any word (phone vibrates to confirm) |
| **Quick Screen Fit** | Tap `[ 📐 Fit ]` on the floating island (snaps to perfect 38% desktop fit) |
| **100% Full Resolution** | Tap `[ 1:1 ]` on the floating island |
| **Toggle Trackpad / Direct** | Tap `[ 🖱️ Trackpad ]` / `[ 👆 Direct ]` |
| **Toggle Fullscreen** | Tap `[ ⛶ Full Screen ]` or `[ ✕ Exit Full ]` |
| **Minimize Control Center** | Tap `[ ✕ ]` on the pill to collapse into the sleek Dynamic Island |
| **Expand Control Center** | Tap the floating `[ 🟢 ⚡ ]` capsule |

---

## 🛠️ How to Run a Desktop in Linux for Guacamole

If you do not already have a desktop running on your Linux VPS or server, here is how to set up an ultra-lightweight, high-performance XFCE desktop with TigerVNC and XRDP on Ubuntu / Debian:

```bash
# 1. Update packages and install XFCE4
sudo apt update && sudo apt install -y xfce4 xfce4-goodies

# 2. Install TigerVNC and XRDP
sudo apt install -y tigervnc-standalone-server xrdp

# 3. Configure XRDP to use XFCE
echo "xfce4-session" > ~/.xsession
sudo systemctl enable xrdp && sudo systemctl restart xrdp

# 4. (Optional) Set up PulseAudio audio streaming for Guacamole
sudo apt install -y pulseaudio pulseaudio-module-zeroconf
```

---

## 🔒 Security & Privacy Notice

- All sample configuration files (`user-mapping.xml.example`, `docker-compose.yml`, `nginx.conf.example`) contain **redacted placeholder credentials**.
- **Always use strong passwords** and place your Guacamole deployment behind HTTPS (SSL/TLS) with Let's Encrypt or Cloudflare.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Contributions, feature suggestions, and pull requests are welcome!
