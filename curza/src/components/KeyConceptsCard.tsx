// src/components/KeyFeedbackTipsCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type TipBlock = {
  heading?: string;
  lines: string[];
};

export default function KeyFeedbackTipsCard({
  title = 'KEY FEEDBACK & TIPS',
  blocks = [
    {
      heading: 'ALGEBRA – SIMPLIFYING EXPRESSIONS',
      lines: [
        "You're dropping like terms in the last step.",
        'Tip: Underline like terms before factorising.',
      ],
    },
    {
      heading: 'INEQUALITIES',
      lines: [
        'Remember to flip the inequality',
        'when multiplying/dividing by a negative.',
      ],
    },
  ],
}: {
  title?: string;
  blocks?: TipBlock[];
}) {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>{title}</Text>

      <View style={s.inner}>
        {blocks.map((b, i) => (
          <View
            key={`${i}-${b.heading ?? 'block'}`}
            style={i > 0 ? s.blockGap : undefined}
          >
            {b.heading ? <Text style={s.heading}>{b.heading}</Text> : null}
            {b.lines.map((ln, j) => (
              <Text key={`${i}-${j}`} style={s.line}>
                {ln}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: 210,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  title: {
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },

  inner: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FACC15',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  blockGap: { marginTop: 16 },

  heading: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.4,
  },

  line: {
    color: '#F3F4F6',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 6,
  },
});
