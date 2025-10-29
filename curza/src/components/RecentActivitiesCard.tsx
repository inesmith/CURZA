import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ActivityItem = {
  id: string;
  text: string;
  /** can be number (65) or string ('65%'); optional */
  score?: number | string;
  /** show the yellow arrow on the right for this row */
  showArrow?: boolean;
};

export default function RecentActivitiesCard({
  title = 'RECENT ACTIVITIES',
  items = [
    { id: '1', text: 'COMPLETED ALGEBRA TEST', score: '65%', showArrow: true },
    { id: '2', text: 'READ GEOMETRY SUMMARY - CHAPTER 4' },
  ],
}: {
  title?: string;
  items?: ActivityItem[];
}) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>

      {items.map((it) => (
        <View key={it.id} style={s.rowWrap}>
          <View style={s.row}>
            <Text style={s.rowText} numberOfLines={2}>
              {it.text}
            </Text>

            {it.score != null && (
              <Text style={s.score}>
                {typeof it.score === 'number' ? `${it.score}%` : String(it.score)}
              </Text>
            )}
          </View>

          {it.showArrow && <View style={s.arrow} />}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#6B7280',        // grey card
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    maxWidth: 440,                      // adjust to your layout
    alignSelf: 'stretch',
  },

  title: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  rowWrap: {
    position: 'relative',
    marginBottom: 12,
  },

  row: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAB308',           
    backgroundColor: 'none',
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#EAB308',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,

    flexDirection: 'row',
    alignItems: 'center',
  },

  rowText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },

  score: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    marginLeft: 10,
    opacity: 0.9,
  },

  // small yellow triangle arrow on the right (outside the pill)
  arrow: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -10,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FACC15',
  },
});
