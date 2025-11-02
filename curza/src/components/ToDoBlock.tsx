// src/components/ToDoBlock.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';

export type TodoItem = {
  id: string;
  text: string;
  subject?: string;    
  isSuggested?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;   // complete for user-created (removes)
  onComplete?: () => void;    // apply+remove for suggested
  onDelete?: () => void;      // delete without completing (both kinds)
};

export default function ToDoBlock({
  title = 'TO DO',
  items,
  onAdd,
  width = 420,
}: {
  title?: string;
  items: TodoItem[];
  onAdd?: () => void;
  width?: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<TodoItem | null>(null);

  const openMenu = (item: TodoItem) => {
    setActive(item);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setActive(null);
  };

  const confirmComplete = () => {
    if (!active) return;
    if (active.isSuggested) {
      active.onComplete?.();
    } else {
      active.onLongPress?.();
    }
    closeMenu();
  };

  const handleDelete = () => {
    active?.onDelete?.();
    closeMenu();
  };

  return (
    <View style={[s.wrap, { width }]}>
      <Text style={s.title}>{title}</Text>

      <View style={s.list}>
        {items.map((it) => (
          <Pressable
            key={it.id}
            style={s.row}
            onPress={it.onPress}
            onLongPress={() => openMenu(it)}
            delayLongPress={300}
          >
            <Text style={s.rowText}>{it.text}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={s.addBtn} onPress={onAdd}>
        <Text style={s.addTxt}>Add +</Text>
      </Pressable>

      {/* Long-press action modal */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>
              {active?.isSuggested ? 'Apply this suggestion?' : 'Mark as completed?'}
            </Text>
            <Text style={s.sheetText}>
              {active?.text ?? ''}
            </Text>

            <View style={s.sheetRow}>
              <Pressable style={[s.btn, s.btnGhost]} onPress={closeMenu}>
                <Text style={s.btnGhostTxt}>Cancel</Text>
              </Pressable>
              <Pressable style={[s.btn, s.btnDanger]} onPress={handleDelete}>
                <Text style={s.btnDangerTxt}>Delete</Text>
              </Pressable>
              <Pressable style={[s.btn, s.btnPrimary]} onPress={confirmComplete}>
                <Text style={s.btnTxt}>Complete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  // Card
  wrap: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
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
    fontSize: 16,
    letterSpacing: 0.5,
  },

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

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  sheetTitle: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 6,
  },

  sheetText: {
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    color: '#374151',
    marginBottom: 14,
  },

  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },

  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnPrimary: { backgroundColor: '#2763F6' },
  btnGhost: { backgroundColor: '#E5E7EB' },
  btnDanger: { backgroundColor: '#EF4444' },

  btnTxt: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },
  btnGhostTxt: {
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },
  btnDangerTxt: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },
});
