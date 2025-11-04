// src/components/InlineWorkingPad.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

type Variant = 'plain' | 'ruled' | 'grid';

type Props = {
  value?: string | null;
  onChange: (dataUrl: string) => void;
  height?: number;
  variant?: Variant;
  gridSize?: number;
  lineSpacing?: number;
  initialPenColor?: string;
  initialPenSize?: number;
};

const PEN_COLORS = ['#1F2937', '#FACC15', '#2763F6', '#10B981', '#F472B6'];
const PEN_SIZES = [1.5, 2, 2.5, 3.5, 5, 7];

export default function InlineWorkingPad({
  value,
  onChange,
  height = 220,
  variant = 'ruled',
  gridSize = 26,
  lineSpacing = 22,
  initialPenColor = '#F8FAFC',
  initialPenSize = 2.5,
}: Props) {
  const padRef = useRef<any>(null);

  // current tool
  const [penIdx, setPenIdx] = useState(
    Math.max(0, PEN_COLORS.findIndex((c) => c.toLowerCase() === initialPenColor.toLowerCase()))
  );
  const [sizeIdx, setSizeIdx] = useState(
    Math.max(0, PEN_SIZES.findIndex((s) => s === initialPenSize))
  );

  const penColor = PEN_COLORS[penIdx] ?? '#F8FAFC';
  const penSize = PEN_SIZES[sizeIdx] ?? 2.5;

  // keep the latest strokes so we can restore after remount
  const [persisted, setPersisted] = useState<string | null>(value ?? null);
  // bump this to force a remount when tool changes
  const [nonce, setNonce] = useState(0);

  // we keep onOK handler in a ref so we can temporarily intercept it in captureThen
  const onOKRef = useRef<((base64: string) => void) | undefined>(undefined);
  const handleOK = (base64: string) => {
    const full = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    setPersisted(full);
    onChange(full);
  };
  onOKRef.current = handleOK;

  // helper: capture current drawing to persisted, then run update()
  const captureThen = async (update: () => void) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        update();
        setNonce((n) => n + 1);
      }
    }, 250);

    const handleSnapshot = (dataURL: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      const full = dataURL.startsWith('data:') ? dataURL : `data:image/png;base64,${dataURL}`;
      setPersisted(full);
      update();
      setNonce((n) => n + 1);
    };

    try {
      const origOnOK = onOKRef.current;
      onOKRef.current = (base64) => {
        handleSnapshot(base64);
        origOnOK?.(base64);
        onOKRef.current = origOnOK;
      };
      padRef.current?.readSignature();
    } catch {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        update();
        setNonce((n) => n + 1);
      }
    }
  };

  // background ruling/grid
  const canvasBackgroundCSS = useMemo(() => {
    if (variant === 'grid') {
      const g = gridSize;
      return `
        background-image:
          linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px);
        background-size: ${g}px ${g}px, ${g}px ${g}px;
        background-position: 0 0, 0 0;
      `;
    }
    if (variant === 'ruled') {
      const s = lineSpacing;
      return `
        background-image:
          linear-gradient(
            to bottom,
            transparent ${s - 1}px,
            rgba(255,255,255,0.18) ${s - 1}px,
            rgba(255,255,255,0.18) ${s}px,
            transparent ${s}px
          );
        background-size: 100% ${s}px;
        background-position: 0 0;
      `;
    }
    return `background: transparent;`;
  }, [variant, gridSize, lineSpacing]);

  // CSS for better pen capture
  const webStyle = `
    .m-signature-pad { box-shadow: none; border: 0; margin: 0; }
    .m-signature-pad--footer { display: none; margin: 0; }
    .m-signature-pad--body {
      margin: 0;
      border: 0;
      ${canvasBackgroundCSS}
      touch-action: none !important;
      overscroll-behavior: contain !important;
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    body, html {
      background: transparent;
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      touch-action: none !important;
      overscroll-behavior: contain !important;
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      ${canvasBackgroundCSS}
      background: transparent !important;
      display: block;
      touch-action: none !important;
      will-change: transform;
    }
  `;

  // Tune SignaturePad sampling (more responsive)
  const applySamplingTuning = () => {
    padRef.current?.injectJavaScript?.(`
      try {
        if (window.signaturePad) {
          // capture more points per move & reduce smoothing
          signaturePad.throttle = 0;                // no throttling
          signaturePad.minDistance = 0.1;           // denser points
          signaturePad.velocityFilterWeight = 0.2;  // less smoothing for quick strokes
          signaturePad.minWidth = ${penSize};
          signaturePad.maxWidth = ${penSize};
          signaturePad.penColor = '${penColor}';
        }
      } catch (e) {}
      true;
    `);
  };

  // Force canvas DPR ~0.9–1.0 for lower latency; keep visual size identical
  const applyCanvasScale = () => {
    padRef.current?.injectJavaScript?.(`
      try {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          if (window.signaturePad && typeof signaturePad._resizeCanvas === 'function') {
            signaturePad._resizeCanvas = function() { /* no-op; we manage size */ };
          }
          const ratio = 0.95; // tweak 0.85–1.1 if needed
          const w = canvas.offsetWidth;
          const h = canvas.offsetHeight;
          const ctx = canvas.getContext('2d');
          const current = canvas.toDataURL();

          canvas.width = Math.max(1, Math.floor(w * ratio));
          canvas.height = Math.max(1, Math.floor(h * ratio));
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

          if (current && current.startsWith('data:')) {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, 0, 0, w, h); };
            img.src = current;
          }
        }
      } catch (e) {}
      true;
    `);
  };

  // Patch to use coalesced pointer events (many more samples per move)
  const applyCoalescedPatch = () => {
    padRef.current?.injectJavaScript?.(`
      try {
        if (window.signaturePad && !window.__curzaCoalesced) {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            canvas.addEventListener('pointermove', function(ev) {
              if (!window.signaturePad || !signaturePad._isDrawing) return;
              const list = (ev.getCoalescedEvents && ev.getCoalescedEvents()) || [ev];
              // Feed extra high-res samples to signaturePad
              for (let i = 0; i < list.length; i++) {
                const e = list[i];
                signaturePad._strokeMoveUpdate(e);
              }
              ev.preventDefault();
            }, { passive: false });

            // Ensure pen buttons down/up still work normally
            canvas.addEventListener('pointerdown', function(ev){
              if (signaturePad && ev.pointerType) {
                // prioritize pen input
              }
            }, { passive: false });

            window.__curzaCoalesced = true;
          }
        }
      } catch (e) {}
      true;
    `);
  };

  // Run tuning after every mount/remount
  useEffect(() => {
    const t1 = setTimeout(applyCanvasScale, 30);
    const t2 = setTimeout(applySamplingTuning, 60);
    const t3 = setTimeout(applyCoalescedPatch, 90);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  return (
    <View style={[s.wrap, { height: height + 48 }]}>
      <View style={[s.canvas, { height }]}>
        <SignatureScreen
          key={`sig-${nonce}`}
          ref={padRef}
          onOK={(b64: string) => onOKRef.current?.(b64)}
          onEmpty={() => {}}
          descriptionText=""
          clearText="Clear"
          confirmText="Save"
          autoClear={false}
          webStyle={webStyle}
          backgroundColor="transparent"
          imageType="image/png"
          penColor={penColor}
          minWidth={penSize}
          maxWidth={penSize}
          dataURL={persisted ?? undefined}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        />
      </View>

      <View style={s.toolbar}>
        <View style={s.leftGroup}>
          <Pressable
            onPress={() => padRef.current?.clearSignature()}
            style={[s.btn, s.btnGhost, s.equalBtn]}
            hitSlop={6}
          >
            <Text style={s.btnGhostText}>Clear</Text>
          </Pressable>

          <Pressable
            onPress={() => padRef.current?.readSignature()}
            style={[s.btn, s.btnPrimary, s.equalBtn]}
            hitSlop={6}
          >
            <Text style={s.btnPrimaryText}>{persisted ? 'Update' : 'Save'}</Text>
          </Pressable>
        </View>

        <View style={s.rightGroup}>
          <Pressable
            onPress={() => captureThen(() => setSizeIdx((i) => (i + 1) % PEN_SIZES.length))}
            style={[s.btn, s.btnGhost, s.equalBtn]}
            hitSlop={6}
          >
            <Text style={s.btnGhostText}>Pen {penSize}px</Text>
          </Pressable>

          <Pressable
            onPress={() => captureThen(() => setPenIdx((i) => (i + 1) % PEN_COLORS.length))}
            style={[s.swatch, { borderColor: 'rgba(255,255,255,0.35)' }]}
            hitSlop={6}
          >
            <View style={[s.dot, { backgroundColor: penColor }]} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 8,
  },
  canvas: { width: '100%' },
  toolbar: {
    height: 48,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(11,18,32,0.75)',
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  equalBtn: {
    minWidth: 70,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnGhostText: {
    color: '#F8FAFC',
    fontFamily: 'AlumniSans_500Medium',
  },
  btnPrimary: {
    backgroundColor: '#2763F6',
  },
  btnPrimaryText: {
    color: '#F8FAFC',
    fontFamily: 'Antonio_700Bold',
    letterSpacing: 0.3,
  },

  swatch: {
    height: 32,
    width: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dot: {
    height: 18,
    width: 18,
    borderRadius: 16,
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
  },
});
