/**
 * Guacamole Mobile Superpowers Suite v4
 * - Unlocked Zoom Scaling (Down to 10% or Up to 500%, with 1-tap 38% Screen Fit)
 * - Dynamic Island Minimized Pill (Best in UI/UX with glowing live status orb)
 * - Terminal 1-Finger Smooth Scrolling & 70vh Overscroll Black Space (No more text hidden under keyboard!)
 * - Pinned Terminal Helper Bar (+16px safe clearance above virtual keyboard)
 * - Standard Mobile Long-Press Copy (> 1.8s) & Active Copy/Paste Controls
 * - Full Screen Toggle Button in Pill & Helper Bar
 * - Full-Screen Relative Trackpad Mode for Desktops
 */
(function() {
    'use strict';

    // Standard X11 / Guacamole keysyms
    var KEYSYMS = {
        ESC: 65307,
        TAB: 65289,
        CTRL: 65507,
        ALT: 65513,
        UP: 65362,
        DOWN: 65364,
        LEFT: 65361,
        RIGHT: 65363,
        PGUP: 65365,
        PGDN: 65366,
        ENTER: 65293,
        BACKSPACE: 65288,
        C: 99
    };

    var state = {
        ctrlSticky: false,
        altSticky: false,
        pillMinimized: false,
        lastClipboardText: '',
        pinch: {
            active: false,
            initialDist: 0,
            initialScale: 1.0,
            initialMidX: 0,
            initialMidY: 0,
            initialScrollLeft: 0,
            initialScrollTop: 0,
            focalX: 0,
            focalY: 0,
            lastToastTime: 0
        },
        touchScroll: {
            active: false,
            startX: 0,
            startY: 0,
            lastY: 0,
            accumulatedY: 0,
            isScrollGesture: false,
            longPressTimer: null,
            longPressFired: false,
            startTime: 0
        },
        drag: {
            active: false,
            isDragging: false,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0,
            startTime: 0
        }
    };

    function isTouchDevice() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Reliably finds the active ManagedClient instance.
     */
    function getActiveClient() {
        var guacClientEl = document.querySelector('guac-client');
        if (guacClientEl) {
            try {
                var gcScope = angular.element(guacClientEl).scope();
                if (gcScope && gcScope.client) return gcScope.client;
            } catch (e) {}
        }

        var clientViewEl = document.querySelector('.client-view') || document.querySelector('guac-viewport');
        if (clientViewEl) {
            try {
                var cvScope = angular.element(clientViewEl).scope();
                if (cvScope) {
                    if (cvScope.focusedClient) return cvScope.focusedClient;
                    if (cvScope.clientGroup && cvScope.clientGroup.clients && cvScope.clientGroup.clients.length) {
                        var focused = cvScope.clientGroup.clients.find(function(c) {
                            return c.clientProperties && c.clientProperties.focused;
                        });
                        return focused || cvScope.clientGroup.clients[0];
                    }
                }
            } catch (e) {}
        }

        try {
            var $injector = angular.element(document.body).injector();
            if ($injector && $injector.has('guacClientManager')) {
                var mgr = $injector.get('guacClientManager');
                var groups = mgr.getManagedClientGroup ? mgr.getManagedClientGroup() : null;
                if (groups && groups.clients && groups.clients.length) {
                    return groups.clients[0];
                }
            }
        } catch (e) {}

        return null;
    }

    function getClientScope() {
        var el = document.querySelector('guac-client') ||
                 document.querySelector('.client-view') ||
                 document.querySelector('guac-viewport');
        if (!el) return null;
        try {
            return angular.element(el).scope();
        } catch (e) {
            return null;
        }
    }

    function applyScopeChange(fn) {
        var scope = getClientScope();
        if (!scope) return;
        try {
            if (scope.$$phase || (scope.$root && scope.$root.$$phase)) {
                fn(scope);
            } else {
                scope.$apply(function() {
                    fn(scope);
                });
            }
        } catch (e) {
            try { fn(scope); } catch (err) {}
        }
    }

    function isTerminalSession() {
        var client = getActiveClient();
        if (!client) return false;
        var proto = String(client.protocol || '').toLowerCase();
        var name = String(client.name || client.title || '').toLowerCase();
        return (proto === 'ssh' || proto === 'telnet' || name.indexOf('terminal') !== -1 || name.indexOf('ssh') !== -1);
    }

    function showToast(message) {
        var toast = document.querySelector('.guac-mobile-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'guac-mobile-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function() {
            toast.classList.remove('show');
        }, 2000);
    }

    function isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }

    function toggleFullscreen() {
        if (isFullscreen()) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(function() {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            showToast('Exited Fullscreen (Browser bar restored)');
        } else {
            var docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(function() {});
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen();
            } else if (docEl.mozRequestFullScreen) {
                docEl.mozRequestFullScreen();
            }
            showToast('Entered Fullscreen');
        }
        setTimeout(updatePillUI, 120);
    }

    function sendKey(keysym) {
        applyScopeChange(function(scope) {
            scope.$broadcast('guacSyntheticKeydown', keysym);
            scope.$broadcast('guacSyntheticKeyup', keysym);
        });
    }

    function sendCtrlC() {
        applyScopeChange(function(scope) {
            scope.$broadcast('guacSyntheticKeydown', KEYSYMS.CTRL);
            scope.$broadcast('guacSyntheticKeydown', KEYSYMS.C);
            scope.$broadcast('guacSyntheticKeyup', KEYSYMS.C);
            scope.$broadcast('guacSyntheticKeyup', KEYSYMS.CTRL);
        });
        showToast('Sent Ctrl+C');
    }

    function sendTextString(str) {
        if (!str) return;
        applyScopeChange(function(scope) {
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i);
                if (code === 10 || code === 13) {
                    scope.$broadcast('guacSyntheticKeydown', KEYSYMS.ENTER);
                    scope.$broadcast('guacSyntheticKeyup', KEYSYMS.ENTER);
                } else {
                    scope.$broadcast('guacSyntheticKeydown', code);
                    scope.$broadcast('guacSyntheticKeyup', code);
                }
            }
        });
    }

    function copyToClipboard(text) {
        if (!text) {
            text = state.lastClipboardText;
        }
        if (!text) {
            showToast('No text in buffer to copy');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                var preview = text.length > 25 ? text.substring(0, 22) + '...' : text;
                showToast('📋 Copied: ' + preview);
            }).catch(function() {
                fallbackCopyText(text);
            });
        } else {
            fallbackCopyText(text);
        }
    }

    function fallbackCopyText(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            var preview = text.length > 25 ? text.substring(0, 22) + '...' : text;
            showToast('📋 Copied: ' + preview);
        } catch (e) {
            showToast('Copy failed');
        }
        document.body.removeChild(ta);
    }

    function pasteFromClipboard() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function(text) {
                if (text) {
                    sendTextString(text);
                    showToast('📋 Pasted');
                } else if (state.lastClipboardText) {
                    sendTextString(state.lastClipboardText);
                    showToast('📋 Pasted from buffer');
                }
            }).catch(function() {
                if (state.lastClipboardText) {
                    sendTextString(state.lastClipboardText);
                    showToast('📋 Pasted from buffer');
                } else {
                    var input = prompt('Paste text here:');
                    if (input) sendTextString(input);
                }
            });
        } else if (state.lastClipboardText) {
            sendTextString(state.lastClipboardText);
            showToast('📋 Pasted from buffer');
        } else {
            var input = prompt('Paste text here:');
            if (input) sendTextString(input);
        }
    }

    function isNativeKeyboardActive() {
        var target = document.querySelector('.text-input-field textarea.target') ||
                     document.querySelector('.text-input textarea');
        return target && (document.activeElement === target);
    }

    function updateKbButtonsState() {
        var active = isNativeKeyboardActive();
        var kbBtns = document.querySelectorAll('.btn-kb-toggle, .btn-keyboard');
        for (var i = 0; i < kbBtns.length; i++) {
            kbBtns[i].classList.toggle('kb-active', active);
        }
    }

    var _termResizeTimer = null;
    function syncTerminalSize(customScale) {
        if (!isTerminalSession()) return;
        var client = getActiveClient();
        if (!client || !client.client) return;

        var s = (customScale !== undefined) ? customScale : ((client.clientProperties && client.clientProperties.scale) || 1.0);
        var pixelDensity = window.devicePixelRatio || 1;

        var vpHeight = window.innerHeight;
        if (window.visualViewport) {
            vpHeight = window.visualViewport.height;
        }

        var barEl = document.getElementById('guac-mobile-term-bar');
        var barHeight = (barEl && (barEl.classList.contains('visible') || barEl.offsetHeight > 0)) ? (barEl.offsetHeight || 48) : 0;

        var availH = Math.max(120, vpHeight - barHeight);
        var availW = window.innerWidth;

        var effW = Math.round((availW / s) * pixelDensity);
        var effH = Math.round((availH / s) * pixelDensity);

        try {
            client.client.sendSize(effW, effH);
        } catch (e) {}
    }

    function debouncedTerminalResize(scale) {
        clearTimeout(_termResizeTimer);
        _termResizeTimer = setTimeout(function() {
            syncTerminalSize(scale);
        }, 120);
    }

    function focusNativeKeyboard() {
        var clientView = document.querySelector('.client-view');
        if (clientView) {
            try {
                var scope = angular.element(clientView).scope();
                if (scope && scope.menu) {
                    scope.$apply(function() {
                        scope.menu.inputMethod = 'text';
                        scope.showTextInput = true;
                        scope.showOSK = false;
                    });
                }
            } catch (e) {}
        }

        setTimeout(function() {
            var target = document.querySelector('.text-input-field textarea.target') ||
                         document.querySelector('.text-input textarea');
            if (target) {
                target.focus();
            }
            var bar = document.getElementById('guac-mobile-term-bar');
            if (bar) {
                bar.classList.add('visible');
                updateBarPosition();
            }
            updateKbButtonsState();
            if (isTerminalSession()) {
                debouncedTerminalResize();
            }
        }, 30);
    }

    function hideNativeKeyboard() {
        var clientView = document.querySelector('.client-view');
        if (clientView) {
            try {
                var scope = angular.element(clientView).scope();
                if (scope && scope.menu) {
                    scope.$apply(function() {
                        scope.menu.inputMethod = 'none';
                        scope.showTextInput = false;
                        scope.showOSK = false;
                    });
                }
            } catch (e) {}
        }

        var target = document.querySelector('.text-input-field textarea.target') ||
                     document.querySelector('.text-input textarea');
        if (target) target.blur();

        var bar = document.getElementById('guac-mobile-term-bar');
        if (bar) {
            if (isTerminalSession()) {
                bar.classList.add('visible');
                bar.style.bottom = '0px';
            } else {
                bar.classList.remove('visible');
            }
        }
        updateKbButtonsState();
        if (isTerminalSession()) {
            debouncedTerminalResize();
        }
    }

    function toggleNativeKeyboard() {
        if (isNativeKeyboardActive()) {
            hideNativeKeyboard();
            showToast('⌨️ Keyboard Hidden');
        } else {
            focusNativeKeyboard();
            showToast('⌨️ Keyboard Active');
        }
    }

    /**
     * Positions helper bar safely above virtual keyboard with +16px safe clearance.
     */
    function updateBarPosition() {
        var bar = document.getElementById('guac-mobile-term-bar');
        if (!bar) return;
        if (window.visualViewport) {
            var vv = window.visualViewport;
            var offsetBottom = window.innerHeight - (vv.offsetTop + vv.height);
            if (offsetBottom > 35) {
                // Keyboard is active: lift bar cleanly with +16px safety clearance!
                bar.style.bottom = Math.round(offsetBottom + 16) + 'px';
            } else {
                // Keyboard is dismissed: sit flush at bottom
                bar.style.bottom = '0px';
            }
        } else {
            bar.style.bottom = '0px';
        }
        if (isTerminalSession()) {
            debouncedTerminalResize();
        }
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateBarPosition);
        window.visualViewport.addEventListener('scroll', updateBarPosition);
    }

    /**
     * Patches client properties to unlock zooming smaller than 38% (down to 5%).
     */
    function patchClientScale(client) {
        if (!client || !client.clientProperties || client._scalePatched) return;
        client._scalePatched = true;
        var props = client.clientProperties;

        var origFit = props.minScale || 0.38;
        client._fitScale = origFit;

        try {
            Object.defineProperty(props, 'minScale', {
                get: function() {
                    return 0.05; // Unlocks zoom down to 5%!
                },
                set: function(val) {
                    if (val > 0.05) client._fitScale = val;
                },
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            props.minScale = 0.05;
        }
        props.maxScale = 5.0;
    }

    function setScale(newScale) {
        var client = getActiveClient();
        if (!client || !client.clientProperties) return;

        patchClientScale(client);

        var minS = 0.05;
        var maxS = 5.0;
        newScale = Math.max(minS, Math.min(maxS, newScale));

        applyScopeChange(function() {
            client.clientProperties.autoFit = false;
            client.clientProperties.scale = newScale;
        });

        if (isTerminalSession()) {
            debouncedTerminalResize(newScale);
        }

        var pct = Math.round(newScale * 100);
        showToast('🔍 Scale: ' + pct + '%');
    }

    function zoomIn() {
        var client = getActiveClient();
        if (!client || !client.clientProperties) return;
        var current = client.clientProperties.scale || 1.0;
        setScale(current + 0.15);
    }

    function zoomOut() {
        var client = getActiveClient();
        if (!client || !client.clientProperties) return;
        var current = client.clientProperties.scale || 1.0;
        setScale(current - 0.10);
    }

    function zoomFit() {
        var client = getActiveClient();
        if (!client || !client.clientProperties) return;
        if (isTerminalSession()) {
            setScale(1.0);
        } else {
            var fit = client._fitScale || 0.38;
            setScale(fit);
        }
    }

    function zoomReset() {
        setScale(1.0);
    }

    function toggleMouseMode() {
        var clientView = document.querySelector('.client-view');
        if (!clientView) return;
        try {
            var scope = angular.element(clientView).scope();
            if (!scope || !scope.menu) return;

            scope.$apply(function() {
                scope.menu.emulateAbsoluteMouse = !scope.menu.emulateAbsoluteMouse;
            });

            updatePillUI();

            if (!scope.menu.emulateAbsoluteMouse) {
                showToast('🖱️ Trackpad Mode: Swipe screen to navigate mouse, tap to click');
            } else {
                showToast('👆 Direct Touch: Clicking directly where you tap');
            }
        } catch (e) {}
    }

    function updatePillUI() {
        var pill = document.getElementById('guac-mobile-pill');
        if (!pill) return;

        var modeBtn = pill.querySelector('.btn-mode-toggle');
        var fullBtn = pill.querySelector('.btn-fullscreen');

        var clientView = document.querySelector('.client-view');
        var isTrackpad = false;
        if (clientView) {
            try {
                var scope = angular.element(clientView).scope();
                if (scope && scope.menu) {
                    isTrackpad = (scope.menu.emulateAbsoluteMouse === false);
                }
            } catch (e) {}
        }

        if (modeBtn) {
            if (isTrackpad) {
                modeBtn.className = 'pill-btn btn-mode-toggle btn-mode-trackpad';
                modeBtn.innerHTML = '<span>🖱️</span><span>Trackpad</span>';
            } else {
                modeBtn.className = 'pill-btn btn-mode-toggle btn-mode-touch';
                modeBtn.innerHTML = '<span>👆</span><span>Direct</span>';
            }
        }

        var inFull = isFullscreen();
        if (fullBtn) {
            if (inFull) {
                fullBtn.className = 'pill-btn btn-fullscreen btn-fullscreen-active';
                fullBtn.innerHTML = '<span>✕</span><span>Exit Full</span>';
                fullBtn.title = 'Exit Fullscreen (Show browser address bar)';
            } else {
                fullBtn.className = 'pill-btn btn-fullscreen';
                fullBtn.innerHTML = '<span>⛶</span><span>Full Screen</span>';
                fullBtn.title = 'Enter Fullscreen Desktop View';
            }
        }

        var barExit = document.querySelector('.btn-exit-full');
        if (barExit) {
            barExit.textContent = inFull ? '✕ Exit Full' : '⛶ Full Screen';
        }
    }

    // Create the Floating Quick-Pill (FAB) with Dynamic Island UI/UX
    function createMobilePill() {
        if (document.getElementById('guac-mobile-pill')) return;

        var pill = document.createElement('div');
        pill.id = 'guac-mobile-pill';

        pill.innerHTML = [
            '<button class="pill-btn btn-drag-handle" title="Hold & Drag to move pill"><span>✥</span><span>Move</span></button>',
            '<div class="pill-content">',
            '  <button class="pill-btn btn-mode-toggle btn-mode-trackpad" title="Toggle Trackpad / Direct Touch">',
            '    <span>🖱️</span><span>Trackpad</span>',
            '  </button>',
            '  <button class="pill-btn btn-keyboard" title="Toggle Native Mobile Keyboard">',
            '    <span>⌨️</span><span>Keyboard</span>',
            '  </button>',
            '  <button class="pill-btn btn-fullscreen" title="Toggle Fullscreen">',
            '    <span>⛶</span><span>Full Screen</span>',
            '  </button>',
            '  <button class="pill-btn btn-zoom btn-zoom-out" title="Zoom Out (Down to 5%)">🔍−</button>',
            '  <button class="pill-btn btn-zoom btn-zoom-fit" title="Fit Entire Screen">📐 Fit</button>',
            '  <button class="pill-btn btn-zoom btn-zoom-reset" title="100% Full Resolution">1:1</button>',
            '  <button class="pill-btn btn-zoom btn-zoom-in" title="Zoom In">🔍+</button>',
            '  <button class="pill-btn btn-mini-toggle" title="Minimize Controls">✕</button>',
            '</div>',
            '<div class="pill-mini-badge" title="Tap to expand | Drag to move">',
            '  <span class="pill-live-dot"></span>',
            '  <span class="pill-mini-icon">🖥️</span>',
            '  <span class="pill-mini-expand">⤢</span>',
            '</div>'
        ].join('');

        document.body.appendChild(pill);

        var modeBtn = pill.querySelector('.btn-mode-toggle');
        var kbBtn = pill.querySelector('.btn-keyboard');
        var fullBtn = pill.querySelector('.btn-fullscreen');
        var zInBtn = pill.querySelector('.btn-zoom-in');
        var zOutBtn = pill.querySelector('.btn-zoom-out');
        var zFitBtn = pill.querySelector('.btn-zoom-fit');
        var zResetBtn = pill.querySelector('.btn-zoom-reset');
        var minBtn = pill.querySelector('.btn-mini-toggle');
        var miniBadge = pill.querySelector('.pill-mini-badge');

        modeBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleMouseMode(); });
        kbBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleNativeKeyboard(); });
        fullBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleFullscreen(); });
        zInBtn.addEventListener('click', function(e) { e.stopPropagation(); zoomIn(); });
        zOutBtn.addEventListener('click', function(e) { e.stopPropagation(); zoomOut(); });
        zFitBtn.addEventListener('click', function(e) { e.stopPropagation(); zoomFit(); });
        zResetBtn.addEventListener('click', function(e) { e.stopPropagation(); zoomReset(); });

        function setMinimized(min) {
            state.pillMinimized = min;
            if (min) {
                pill.classList.add('minimized');
                if (navigator.vibrate) { try { navigator.vibrate(25); } catch(e) {} }
            } else {
                pill.classList.remove('minimized');
                if (navigator.vibrate) { try { navigator.vibrate(25); } catch(e) {} }
            }
        }

        minBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            setMinimized(true);
        });

        miniBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            setMinimized(false);
        });

        // Touch Dragging for Pill (Supports both explicit [✥ Move] button and Minimized Island capsule)
        function handlePillTouchStart(e) {
            var target = e.target;
            var isDragHandle = target.closest('.btn-drag-handle');
            var isMini = state.pillMinimized || target.closest('.pill-mini-badge');
            var isPillBg = (target === pill || target.classList.contains('pill-content'));

            if (!isDragHandle && !isMini && !isPillBg) return;

            var touch = e.touches[0];
            state.drag.active = true;
            state.drag.isDragging = false;
            state.drag.startX = touch.clientX;
            state.drag.startY = touch.clientY;
            state.drag.startTime = Date.now();

            var rect = pill.getBoundingClientRect();
            state.drag.initialX = rect.left;
            state.drag.initialY = rect.top;
        }

        pill.addEventListener('touchstart', handlePillTouchStart, { passive: false });

        window.addEventListener('touchmove', function(e) {
            if (!state.drag.active) return;
            var touch = e.touches[0];
            var dx = touch.clientX - state.drag.startX;
            var dy = touch.clientY - state.drag.startY;

            if (Math.hypot(dx, dy) > 5) {
                state.drag.isDragging = true;
            }

            var pillW = pill.offsetWidth || 78;
            var pillH = pill.offsetHeight || 38;
            var newX = Math.max(6, Math.min(window.innerWidth - pillW - 6, state.drag.initialX + dx));
            var newY = Math.max(6, Math.min(window.innerHeight - pillH - 6, state.drag.initialY + dy));

            pill.style.left = newX + 'px';
            pill.style.top = newY + 'px';
            pill.style.right = 'auto';
            pill.style.bottom = 'auto';
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', function(e) {
            if (!state.drag.active) return;
            var wasDragging = state.drag.isDragging;
            var duration = Date.now() - state.drag.startTime;
            state.drag.active = false;

            // If tapped while minimized (not a drag), expand!
            if (state.pillMinimized && !wasDragging && duration < 350) {
                setMinimized(false);
            }
        });
    }

    // Create the Mobile Terminal Helper Bar
    function createTerminalHelperBar() {
        if (document.getElementById('guac-mobile-term-bar')) return;

        var bar = document.createElement('div');
        bar.id = 'guac-mobile-term-bar';

        var keys = [
            { label: '⌨️ Keyboard', kbToggle: true },
            { label: 'ESC', sym: KEYSYMS.ESC },
            { label: 'TAB', sym: KEYSYMS.TAB },
            { label: 'CTRL', sym: KEYSYMS.CTRL, sticky: true },
            { label: 'ALT', sym: KEYSYMS.ALT, sticky: true },
            { label: '↑', sym: KEYSYMS.UP },
            { label: '↓', sym: KEYSYMS.DOWN },
            { label: '←', sym: KEYSYMS.LEFT },
            { label: '→', sym: KEYSYMS.RIGHT },
            { label: 'PgUp', sym: KEYSYMS.PGUP },
            { label: 'PgDn', sym: KEYSYMS.PGDN },
            { label: 'Ctrl+C', ctrlC: true },
            { label: '📋 Copy', copy: true },
            { label: '📋 Paste', paste: true },
            { label: isFullscreen() ? '✕ Exit Full' : '⛶ Full Screen', full: true }
        ];

        keys.forEach(function(k) {
            var btn = document.createElement('button');
            var cls = 'term-key-btn';
            if (k.kbToggle) cls += ' btn-kb-toggle';
            else if (k.ctrlC) cls += ' btn-ctrl-c';
            else if (k.copy) cls += ' btn-copy';
            else if (k.paste) cls += ' btn-paste';
            else if (k.full) cls += ' btn-exit-full';
            btn.className = cls;
            btn.textContent = k.label;

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (k.kbToggle) {
                    toggleNativeKeyboard();
                } else if (k.ctrlC) {
                    sendCtrlC();
                } else if (k.copy) {
                    copyToClipboard();
                } else if (k.paste) {
                    pasteFromClipboard();
                } else if (k.full) {
                    toggleFullscreen();
                } else if (k.sticky) {
                    if (k.sym === KEYSYMS.CTRL) {
                        state.ctrlSticky = !state.ctrlSticky;
                        btn.classList.toggle('sticky-active', state.ctrlSticky);
                        applyScopeChange(function(scope) {
                            if (state.ctrlSticky) scope.$broadcast('guacSyntheticKeydown', KEYSYMS.CTRL);
                            else scope.$broadcast('guacSyntheticKeyup', KEYSYMS.CTRL);
                        });
                    } else if (k.sym === KEYSYMS.ALT) {
                        state.altSticky = !state.altSticky;
                        btn.classList.toggle('sticky-active', state.altSticky);
                        applyScopeChange(function(scope) {
                            if (state.altSticky) scope.$broadcast('guacSyntheticKeydown', KEYSYMS.ALT);
                            else scope.$broadcast('guacSyntheticKeyup', KEYSYMS.ALT);
                        });
                    }
                } else {
                    sendKey(k.sym);
                    if (state.ctrlSticky) {
                        state.ctrlSticky = false;
                        var cBtn = bar.querySelector('.term-key-btn:nth-child(4)');
                        if (cBtn) cBtn.classList.remove('sticky-active');
                        applyScopeChange(function(scope) {
                            scope.$broadcast('guacSyntheticKeyup', KEYSYMS.CTRL);
                        });
                    }
                    if (state.altSticky) {
                        state.altSticky = false;
                        var aBtn = bar.querySelector('.term-key-btn:nth-child(5)');
                        if (aBtn) aBtn.classList.remove('sticky-active');
                        applyScopeChange(function(scope) {
                            scope.$broadcast('guacSyntheticKeyup', KEYSYMS.ALT);
                        });
                    }
                }
            });

            bar.appendChild(btn);
        });

        var hideBtn = document.createElement('button');
        hideBtn.className = 'term-key-btn btn-hide-kb';
        hideBtn.textContent = '✕ ⌨️';
        hideBtn.title = 'Hide Native Keyboard';
        hideBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideNativeKeyboard();
        });
        bar.appendChild(hideBtn);

        document.body.appendChild(bar);
    }

    /**
     * Sends mouse wheel scroll event to the terminal / remote session.
     */
    function sendTerminalScroll(direction, touch) {
        var client = getActiveClient();
        if (!client || !client.client) return;

        var guacClientEl = document.querySelector('guac-client');
        var displayEl = guacClientEl ? guacClientEl.querySelector('.display') : null;
        var scale = (client.clientProperties && client.clientProperties.scale) || 1.0;
        var x = 50;
        var y = 50;

        if (displayEl && touch) {
            var rect = displayEl.getBoundingClientRect();
            x = Math.round((touch.clientX - rect.left) / scale);
            y = Math.round((touch.clientY - rect.top) / scale);
        }

        var isUp = (direction === 'up');
        var isDown = (direction === 'down');

        var stateDown = new Guacamole.Mouse.State(x, y, false, false, false, isUp, isDown);
        client.client.sendMouseState(stateDown);

        var stateUp = new Guacamole.Mouse.State(x, y, false, false, false, false, false);
        client.client.sendMouseState(stateUp);
    }

    /**
     * Standard mobile long-press handler for text copying (> 1.8 seconds).
     */
    function handleTerminalLongPress(touch) {
        if (navigator.vibrate) {
            try { navigator.vibrate([40, 50, 40]); } catch (e) {}
        }

        var client = getActiveClient();
        if (!client || !client.client) return;

        var guacClientEl = document.querySelector('guac-client');
        var displayEl = guacClientEl ? guacClientEl.querySelector('.display') : null;
        var scale = (client.clientProperties && client.clientProperties.scale) || 1.0;

        if (displayEl && touch) {
            var rect = displayEl.getBoundingClientRect();
            var x = Math.round((touch.clientX - rect.left) / scale);
            var y = Math.round((touch.clientY - rect.top) / scale);

            var btnDown = new Guacamole.Mouse.State(x, y, true, false, false, false, false);
            var btnUp = new Guacamole.Mouse.State(x, y, false, false, false, false, false);

            client.client.sendMouseState(btnDown);
            client.client.sendMouseState(btnUp);
            client.client.sendMouseState(btnDown);
            client.client.sendMouseState(btnUp);
        }

        setTimeout(function() {
            if (state.lastClipboardText) {
                copyToClipboard(state.lastClipboardText);
            } else {
                showToast('📋 Long-press copied text to clipboard');
            }
        }, 120);
    }

    function getTouchDist(e) {
        var t1 = e.touches[0];
        var t2 = e.touches[1];
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    /**
     * Unified Global Gesture Management (Pinch Zoom, Terminal Scroll with Black Space, Long-Press Copy, Tap-to-Type)
     */
    function setupGlobalGestures() {
        if (window._guacGesturesAttached) return;
        window._guacGesturesAttached = true;

        // TOUCHSTART
        window.addEventListener('touchstart', function(e) {
            if (window.location.hash.indexOf('#/client/') !== 0) return;
            if (e.target.closest('#guac-mobile-pill') || e.target.closest('#guac-mobile-term-bar') || e.target.closest('.guac-mobile-toast')) {
                return;
            }

            // 1. Two-Finger Google Maps Pan & Zoom (Simultaneous 2D Glide & Zoom)
            if (e.touches.length === 2) {
                var client = getActiveClient();
                if (client && client.clientProperties) {
                    patchClientScale(client);
                    var t1 = e.touches[0];
                    var t2 = e.touches[1];
                    var dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                    var midX = (t1.clientX + t2.clientX) / 2;
                    var midY = (t1.clientY + t2.clientY) / 2;

                    var mainEl = document.querySelector('div.main');
                    var curScale = client.clientProperties.scale || 1.0;
                    var curScrollLeft = (client.clientProperties.scrollLeft != null) 
                        ? client.clientProperties.scrollLeft 
                        : (mainEl ? mainEl.scrollLeft : 0);
                    var curScrollTop = (client.clientProperties.scrollTop != null) 
                        ? client.clientProperties.scrollTop 
                        : (mainEl ? mainEl.scrollTop : 0);

                    state.pinch.active = true;
                    state.pinch.initialDist = dist;
                    state.pinch.initialScale = curScale;
                    state.pinch.initialMidX = midX;
                    state.pinch.initialMidY = midY;
                    state.pinch.initialScrollLeft = curScrollLeft;
                    state.pinch.initialScrollTop = curScrollTop;
                    state.pinch.focalX = (midX + curScrollLeft) / curScale;
                    state.pinch.focalY = (midY + curScrollTop) / curScale;

                    clearTimeout(state.touchScroll.longPressTimer);
                    state.touchScroll.active = false;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                return;
            }

            // 2. Single-Finger Touch in Terminal
            if (e.touches.length === 1 && isTerminalSession()) {
                var touch = e.touches[0];
                state.touchScroll.active = true;
                state.touchScroll.startX = touch.clientX;
                state.touchScroll.startY = touch.clientY;
                state.touchScroll.lastY = touch.clientY;
                state.touchScroll.accumulatedY = 0;
                state.touchScroll.isScrollGesture = false;
                state.touchScroll.longPressFired = false;
                state.touchScroll.startTime = Date.now();

                clearTimeout(state.touchScroll.longPressTimer);
                state.touchScroll.longPressTimer = setTimeout(function() {
                    if (state.touchScroll.active && !state.touchScroll.isScrollGesture) {
                        state.touchScroll.longPressFired = true;
                        handleTerminalLongPress(touch);
                    }
                }, 1800);
            }
        }, { capture: true, passive: false });

        // TOUCHMOVE
        window.addEventListener('touchmove', function(e) {
            if (window.location.hash.indexOf('#/client/') !== 0) return;
            if (e.target.closest('#guac-mobile-pill') || e.target.closest('#guac-mobile-term-bar')) {
                return;
            }

            // 1. Google Maps-Style 2-Finger Pan & Zoom (Omnidirectional 2D Navigation)
            if (state.pinch.active && e.touches.length === 2) {
                var client = getActiveClient();
                if (client && client.clientProperties && state.pinch.initialDist > 0) {
                    patchClientScale(client);
                    var t1 = e.touches[0];
                    var t2 = e.touches[1];
                    var currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                    var currentMidX = (t1.clientX + t2.clientX) / 2;
                    var currentMidY = (t1.clientY + t2.clientY) / 2;

                    var ratio = currentDist / state.pinch.initialDist;
                    var newScale = state.pinch.initialScale * ratio;
                    var minS = 0.05;
                    var maxS = 5.0;
                    newScale = Math.max(minS, Math.min(maxS, newScale));

                    // Google Maps anchoring & 2D glide formula:
                    var newScrollLeft = Math.round((state.pinch.focalX * newScale) - currentMidX);
                    var newScrollTop = Math.round((state.pinch.focalY * newScale) - currentMidY);

                    applyScopeChange(function() {
                        client.clientProperties.autoFit = false;
                        client.clientProperties.scale = newScale;
                        client.clientProperties.scrollLeft = newScrollLeft;
                        client.clientProperties.scrollTop = newScrollTop;
                    });

                    var mainEl = document.querySelector('div.main');
                    if (mainEl) {
                        mainEl.style.overflow = 'auto';
                        mainEl.scrollLeft = newScrollLeft;
                        mainEl.scrollTop = newScrollTop;
                    }

                    if (isTerminalSession()) {
                        debouncedTerminalResize(newScale);
                    }

                    var now = Date.now();
                    if (now - state.pinch.lastToastTime > 350) {
                        state.pinch.lastToastTime = now;
                        showToast('🔍 ' + Math.round(newScale * 100) + '%');
                    }
                }
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }

            // 2. Terminal 1-Finger Touch: Smooth buffer scrolling (No window distortion)
            if (state.touchScroll.active && e.touches.length === 1 && !state.pinch.active && isTerminalSession()) {
                var touch = e.touches[0];
                var deltaY = touch.clientY - state.touchScroll.lastY;
                var totalMoved = Math.hypot(touch.clientX - state.touchScroll.startX, touch.clientY - state.touchScroll.startY);

                if (totalMoved > 8) {
                    clearTimeout(state.touchScroll.longPressTimer);
                    state.touchScroll.isScrollGesture = true;
                }

                state.touchScroll.accumulatedY += deltaY;
                state.touchScroll.lastY = touch.clientY;

                var threshold = 20;
                if (Math.abs(state.touchScroll.accumulatedY) >= threshold) {
                    var dir = (state.touchScroll.accumulatedY > 0) ? 'up' : 'down';
                    sendTerminalScroll(dir, touch);
                    state.touchScroll.accumulatedY %= threshold;
                }

                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, { capture: true, passive: false });

        // TOUCHEND
        window.addEventListener('touchend', function(e) {
            if (window.location.hash.indexOf('#/client/') !== 0) return;
            if (e.target.closest('#guac-mobile-pill') || e.target.closest('#guac-mobile-term-bar')) {
                return;
            }

            // 1. End pinch
            if (state.pinch.active && e.touches.length < 2) {
                state.pinch.active = false;
                if (isTerminalSession()) {
                    var client = getActiveClient();
                    if (client && client.clientProperties) {
                        syncTerminalSize(client.clientProperties.scale);
                    }
                }
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }

            // 2. End terminal touch
            if (isTerminalSession()) {
                clearTimeout(state.touchScroll.longPressTimer);
                var wasScroll = state.touchScroll.isScrollGesture;
                var wasLongPress = state.touchScroll.longPressFired;
                state.touchScroll.active = false;

                // Under NO circumstance should keyboard auto-pop on tap!
                // Keyboard ONLY appears when the user explicitly taps [ ⌨️ Keyboard ]!

                if (wasScroll || wasLongPress) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        }, { capture: true, passive: false });
    }

    // Auto-Fullscreen when clicking any connection / instance link from home menu
    document.addEventListener('click', function(e) {
        if (!isTouchDevice()) return;
        var link = e.target.closest('a') || e.target.closest('.connection') || e.target.closest('[href*="#/client/"]');
        if (link && !isFullscreen()) {
            var docEl = document.documentElement;
            if (docEl.requestFullscreen) docEl.requestFullscreen().catch(function() {});
            else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        }
    }, { capture: true });

    // Hook AngularJS modules run block
    angular.module('index').run(['$rootScope', function($rootScope) {

        // Auto-Fullscreen on first touch inside client view
        window.addEventListener('touchstart', function handleFirstTouch() {
            if (isTouchDevice() && window.location.hash.indexOf('#/client/') === 0 && !isFullscreen()) {
                var docEl = document.documentElement;
                if (docEl.requestFullscreen) docEl.requestFullscreen().catch(function() {});
                else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
            }
            window.removeEventListener('touchstart', handleFirstTouch);
        }, { passive: true, once: true });

        // Listen for clipboard changes across the app
        $rootScope.$on('guacClipboard', function(event, data) {
            if (data && data.data && typeof data.data === 'string') {
                state.lastClipboardText = data.data;
            }
        });

        // Watch client to enforce un-shrunk scale & patch minScale unlock
        $rootScope.$watch(function() {
            var client = getActiveClient();
            return client ? client.clientProperties : null;
        }, function(props) {
            var client = getActiveClient();
            if (client && isTouchDevice()) {
                patchClientScale(client);
            }
        });

        // Auto-configure session when navigating into a client
        $rootScope.$on('$routeChangeSuccess', function(event, current) {
            if (window.location.hash.indexOf('#/client/') !== 0) {
                var pill = document.getElementById('guac-mobile-pill');
                if (pill) pill.style.display = 'none';
                var bar = document.getElementById('guac-mobile-term-bar');
                if (bar) bar.classList.remove('visible');
                var clientView = document.querySelector('.client-view');
                if (clientView) clientView.classList.remove('terminal-session');
                document.body.classList.remove('is-terminal-session');
                return;
            }

            setTimeout(function() {
                createMobilePill();
                createTerminalHelperBar();
                setupGlobalGestures();

                var pill = document.getElementById('guac-mobile-pill');
                if (pill) pill.style.display = isTouchDevice() ? 'flex' : 'none';

                var client = getActiveClient();
                var clientView = document.querySelector('.client-view');

                if (isTerminalSession()) {
                    if (clientView) clientView.classList.add('terminal-session');
                    document.body.classList.add('is-terminal-session');
                    var bar = document.getElementById('guac-mobile-term-bar');
                    if (bar) bar.classList.add('visible');
                    syncTerminalSize(1.0);
                    // NOTE: Mobile keyboard will NOT open until user explicitly taps [ ⌨️ Keyboard ]!
                } else {
                    if (clientView) clientView.classList.remove('terminal-session');
                    document.body.classList.remove('is-terminal-session');
                    // Desktop (VNC/RDP):
                    // 1) Enable Full-Screen Trackpad
                    // 2) Keep un-shrunk 38% fit / 1:1 scale that fits whole screen
                    if (isTouchDevice()) {
                        applyScopeChange(function(scope) {
                            if (scope.menu) scope.menu.emulateAbsoluteMouse = false;
                        });
                        showToast('🖥️ Full Desktop | 🖱️ Trackpad Active');
                    }
                }

                if (client) {
                    patchClientScale(client);
                }

                updatePillUI();
            }, 300);
        });

        // Watch for changes in menu.emulateAbsoluteMouse to sync pill label
        $rootScope.$watch(function() {
            var clientView = document.querySelector('.client-view');
            if (!clientView) return null;
            try {
                var scope = angular.element(clientView).scope();
                return scope && scope.menu ? scope.menu.emulateAbsoluteMouse : null;
            } catch (e) { return null; }
        }, function() {
            updatePillUI();
        });

        // Sync fullscreen state changes
        document.addEventListener('fullscreenchange', updatePillUI);
        document.addEventListener('webkitfullscreenchange', updatePillUI);

    }]);

})();
