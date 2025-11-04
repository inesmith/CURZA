// src/components/InlineWorkingPad.tsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Path as SkPathComp,
  Path,
  Skia,
  Image as SkImage,
  useCanvasRef,
  ImageFormat,
} from '@shopify/react-native-skia';

type Variant = 'plain' | 'ruled' | 'grid';

type Props = {
  value?: string | null;            // existing dataURL (restored as background)
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

type Stroke = {
  path: ReturnType<typeof Skia.Path.Make>;
  color: string;
  size: number;
};

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
  const canvasRef = useCanvasRef();

  // tool state (does NOT clear strokes)
  const [penIdx, setPenIdx] = useState(
    Math.max(0, PEN_COLORS.findIndex((c) => c.toLowerCase() === (initialPenColor || '').toLowerCase()))
  );
  const [sizeIdx, setSizeIdx] = useState(
    Math.max(0, PEN_SIZES.findIndex((s) => s === initialPenSize))
  );
  const penColor = PEN_COLORS[penIdx] ?? '#F8FAFC';
  const penSize = PEN_SIZES[sizeIdx] ?? 2.5;

  // canvas size
  const [cSize, setCSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height && (width !== cSize.w || height !== cSize.h)) {
      setCSize({ w: width, h: height });
    }
  };

  // decode dataURL -> Skia Image
  const bgImage = useMemo(() => {
    if (!value) return null;
    try {
      const b64 = value.startsWith('data:') ? value.split(',')[1] ?? '' : value;
      const data = Skia.Data.fromBase64(b64);
      return Skia.Image.MakeImageFromEncoded(data);
    } catch {
      return null;
    }
  }, [value]);

  // strokes
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPathRef = React.useRef<ReturnType<typeof Skia.Path.Make> | null>(null);
  const lastPtRef = React.useRef<{ x: number; y: number } | null>(null);
  const MIN_DIST = 0.5;

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = Skia.Path.Make();
          p.moveTo(locationX, locationY);
          currentPathRef.current = p;
          lastPtRef.current = { x: locationX, y: locationY };
          setStrokes((prev) => [...prev, { path: p, color: penColor, size: penSize }]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const cur = currentPathRef.current;
          if (!cur) return;

          const last = lastPtRef.current;
          if (!last || Math.hypot(locationX - last.x, locationY - last.y) >= MIN_DIST) {
            cur.lineTo(locationX, locationY);
            lastPtRef.current = { x: locationX, y: locationY };
            setStrokes((prev) => [...prev]); // re-render
          }
        },
        onPanResponderRelease: () => {
          currentPathRef.current = null;
          lastPtRef.current = null;
        },
        onPanResponderTerminate: () => {
          currentPathRef.current = null;
          lastPtRef.current = null;
        },
      }),
    [penColor, penSize]
  );

  // snapshot → base64 PNG and emit
  const snapshotToBase64 = useCallback(() => {
    try {
      if (!canvasRef.current || cSize.w === 0 || cSize.h === 0) return;
      const image = canvasRef.current.makeImageSnapshot({
        x: 0,
        y: 0,
        width: cSize.w,
        height: cSize.h,
      });
      if (!image) return;
      const b64 = image.encodeToBase64(ImageFormat.PNG, 100);
      if (!b64) return;
      onChange(`data:image/png;base64,${b64}`);
    } catch {
      // ignore
    }
  }, [canvasRef, cSize.w, cSize.h, onChange]);

  // avoid render-loop: only snapshot on unmount
  const snapshotRef = useRef<() => void>(() => {});
  useEffect(() => {
    snapshotRef.current = snapshotToBase64;
  }, [snapshotToBase64]);

  useEffect(() => {
    return () => {
      snapshotRef.current?.();
    };
  }, []);

  // ruled/grid background
  const Background = useMemo(() => {
    const lines: JSX.Element[] = [];
    if (cSize.w === 0 || cSize.h === 0) return null;

    if (variant === 'grid') {
      const g = Math.max(8, gridSize | 0);
      for (let x = 0; x <= cSize.w; x += g) {
        const p = Skia.Path.Make();
        p.moveTo(x, 0); p.lineTo(x, cSize.h);
        lines.push(
          <SkPathComp key={`gv-${x}`} path={p} color="rgba(255,255,255,0.14)" style="stroke" strokeWidth={1} />
        );
      }
      for (let y = 0; y <= cSize.h; y += g) {
        const p = Skia.Path.Make();
        p.moveTo(0, y); p.lineTo(cSize.w, y);
        lines.push(
          <SkPathComp key={`gh-${y}`} path={p} color="rgba(255,255,255,0.14)" style="stroke" strokeWidth={1} />
        );
      }
    } else if (variant === 'ruled') {
      const s = Math.max(10, lineSpacing | 0);
      for (let y = s; y < cSize.h; y += s) {
        const p = Skia.Path.Make();
        p.moveTo(0, y); p.lineTo(cSize.w, y);
        lines.push(
          <SkPathComp key={`rl-${y}`} path={p} color="rgba(255,255,255,0.18)" style="stroke" strokeWidth={1} />
        );
      }
    }

    return <>{lines}</>;
  }, [variant, gridSize, lineSpacing, cSize]);

  // --- Undo support ---
  const canUndo = strokes.length > 0;
  const handleUndo = () => {
    setStrokes((prev) => (prev.length ? prev.slice(0, -1) : prev));
  };

  return (
    <View style={[s.wrap, { height: height + 48 }]}>
      <View style={[s.canvas, { height }]} onLayout={onCanvasLayout}>
        <Canvas ref={canvasRef} style={{ flex: 1 }}>
          {/* previously saved image (if any) */}
          {bgImage ? (
            <SkImage image={bgImage} x={0} y={0} width={cSize.w} height={cSize.h} />
          ) : null}

          {/* ruled/grid background */}
          {Background}

          {/* live strokes */}
          {strokes.map((st, idx) => (
            <SkPathComp
              key={idx}
              path={st.path}
              color={st.color}
              style="stroke"
              strokeWidth={st.size}
              strokeJoin="round"
              strokeCap="round"
            />
          ))}
        </Canvas>

        {/* invisible touch layer */}
        <View
          {...panResponder.panHandlers}
          pointerEvents="box-only"
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={s.toolbar}>
        <View style={s.leftGroup}>
          {/* Undo (one stroke at a time) */}
          <Pressable
            onPress={handleUndo}
            disabled={!canUndo}
            style={[
              s.btn,
              s.btnGhost,
              s.equalBtn,
              !canUndo && { opacity: 0.5 },
            ]}
            hitSlop={6}
          >
            <Text style={s.btnGhostText}>Undo</Text>
          </Pressable>

          <Pressable
            onPress={snapshotToBase64}
            style={[s.btn, s.btnPrimary, s.equalBtn]}
            hitSlop={6}
          >
            <Text style={s.btnPrimaryText}>{value ? 'Update' : 'Save'}</Text>
          </Pressable>
        </View>

        <View style={s.rightGroup}>
          <Pressable
            onPress={() => setSizeIdx((i) => (i + 1) % PEN_SIZES.length)}
            style={[s.btn, s.btnGhost, s.equalBtn]}
            hitSlop={6}
          >
            <Text style={s.btnGhostText}>Pen {PEN_SIZES[sizeIdx]}px</Text>
          </Pressable>

          <Pressable
            onPress={() => setPenIdx((i) => (i + 1) % PEN_COLORS.length)}
            style={[s.swatch, { borderColor: 'rgba(255,255,255,0.35)' }]}
            hitSlop={6}
          >
            <View style={[s.dot, { backgroundColor: PEN_COLORS[penIdx] }]} />
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
