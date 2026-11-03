import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

/** Small gold PRO marker for locked lessons and Locker content. */
export default function ProPill() {
  return (
    <View style={s.pill}>
      <Ionicons name="flash" size={9} color={Colors.warning} />
      <Text style={s.text}>PRO</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.warning + '1F',
    borderWidth: 1,
    borderColor: Colors.warning + '66',
  },
  text: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 1 },
});
