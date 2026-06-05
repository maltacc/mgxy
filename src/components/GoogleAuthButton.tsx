import { useCallback, useState } from 'react';
import { GoogleLogin, googleLogout, type CredentialResponse } from '@react-oauth/google';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

interface AvatarProps {
  uri: string;
  name: string;
  size: number;
}

function Avatar({ uri, name, size }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name?.[0]?.toUpperCase() ?? '?';
  const circleStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={circleStyle}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[circleStyle, styles.initials]}>
      <Text style={[styles.initialsText, { fontSize: Math.floor(size * 0.42) }]}>{initial}</Text>
    </View>
  );
}

export function GoogleAuthButton() {
  const { user, setUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleCredential = useCallback((response: CredentialResponse) => {
    try {
      // Decode the JWT payload — no extra network call needed
      const payload = JSON.parse(atob(response.credential!.split('.')[1]));
      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture ?? '',
        sub: payload.sub,
      });
    } catch {}
  }, [setUser]);

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    setShowMenu(false);
  }, [setUser]);

  if (user) {
    return (
      <>
        <Pressable
          onPress={() => setShowMenu(true)}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Avatar uri={user.picture} name={user.name} size={36} />
        </Pressable>

        <Modal transparent visible={showMenu} onRequestClose={() => setShowMenu(false)} animationType="none">
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowMenu(false)} />
            <Pressable style={styles.menuAnchor} onPress={() => {}}>
              <View style={styles.menu}>
                <View style={styles.menuProfile}>
                  <Avatar uri={user.picture} name={user.name} size={38} />
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.menuEmail} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.menuDivider} />
                <Pressable
                  onPress={logout}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <Text style={styles.menuItemText}>Log out</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.btn}>
      <GoogleLogin
        onSuccess={handleCredential}
        onError={() => {}}
        type="icon"
        shape="circle"
        theme="outline"
        size="medium"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ecf3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B2233',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },

  initials: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#fff',
    fontWeight: '700',
  },

  modalRoot: { flex: 1 },
  menuAnchor: {
    position: 'absolute',
    top: 58,
    right: 12,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8ecf3',
    shadowColor: '#1B2233',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minWidth: 220,
    overflow: 'hidden',
  },
  menuProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  menuInfo: { flex: 1, minWidth: 0 },
  menuName: { fontSize: 14, fontWeight: '700', color: colors.text },
  menuEmail: { fontSize: 12, color: colors.subtle, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: '#e8ecf3' },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemPressed: { backgroundColor: '#f5f7fa' },
  menuItemText: { fontSize: 14, color: colors.text, fontWeight: '500' },
});
