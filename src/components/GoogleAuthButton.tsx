import { useCallback, useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

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

  const login = useGoogleLogin({
    onSuccess: async (token) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        const info = await res.json();
        setUser({ name: info.name, email: info.email, picture: info.picture ?? '', sub: info.sub });
      } catch {}
    },
  });

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
    <Pressable onPress={() => login()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <GoogleIcon />
      </View>
    </Pressable>
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
  iconWrap: { alignItems: 'center', justifyContent: 'center' },

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
