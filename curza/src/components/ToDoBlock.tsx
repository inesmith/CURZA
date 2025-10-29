import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export type TodoItem = { id: string; text: string; onPress?: () => void };

export default function ToDoBlock({
  title = 'TO DO',
  items,
  onAdd,
  width = 420,         // match ProgressBlock width; tweak as needed
}: {
  title?: string;
  items: TodoItem[];
  onAdd?: () => void;
  width?: number;
}) {
  return (
    <View style={[s.wrap, { width }]}>
      <Text style={s.title}>{title}</Text>

      <View style={s.list}>
        {items.map((it) => (
          <Pressable key={it.id} style={s.row} onPress={it.onPress}>
            <Text style={s.rowText}>{it.text}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={s.addBtn} onPress={onAdd}>
        <Text style={s.addTxt}>Add +</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  // Outer card (rounded light-grey like your mock)
  wrap: {
    backgroundColor: '#6B7280', // card grey
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    alignSelf: 'flex-start',
  },

  title: {
    textAlign: 'center',
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    marginBottom: 10,
    letterSpacing: 0.4,
  },

  list: {
    gap: 14,
  },

  // Each to-do row (pill with yellow border & soft drop shadow)
  row: {
    backgroundColor: 'none',           
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EAB308',              
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  rowText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // Add button (yellow pill bottom-right with slight shadow)
  addBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
    backgroundColor: '#FACC15',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addTxt: {
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },
});
