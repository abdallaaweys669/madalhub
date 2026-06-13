import { StyleSheet } from 'react-native';
export const COLORS = {
  // Background gradient (peach theme)
  bgGradStart: '#FFEFE5',
  bgGradEnd: '#FEE9D9',

  // Primary orange
  primary: '#FF7B3F',

  // Input styling
  inputBorder: '#FFB899',
  inputBg: '#FFF6F2',

  // Cards & text
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textLight: '#555555',
  placeholder: '#A1A1A1',
  border: '#E5E5E5',

  danger: '#EF4444',
};



export default StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  // Header
title: {
  fontSize: 32,
  fontWeight: '800',
  color: COLORS.textLight,
  textAlign: 'left',
  marginTop: 32,        // moves text down clearly
  marginBottom: 4,      // small elegant gap
  width: '100%',
  paddingHorizontal: 4, // makes left alignment sharp
},

subtitle: {
  fontSize: 16,
  color: COLORS.textLight,
  opacity: 0.9,
  marginBottom: 16,     // better breathing space above illustration
  marginTop:-6,
  textAlign: 'left',
  paddingHorizontal: 4, // matches title start position
  width: '100%',
},


  illustration: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginBottom: 10,
  },

  // Card
card: {
  backgroundColor: COLORS.cardBg,
  width: '100%',
  borderRadius: 20,
  paddingHorizontal: 24,
  paddingVertical: 26,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
  marginTop: 10,
},



formTitle: {
  fontSize: 24,
  fontWeight: '800',
  color: COLORS.textDark,
  marginBottom: 24,
},

forgot: {
  textAlign: 'right',
  color: COLORS.primary,
  fontWeight: '600',
  marginTop: 6,
  marginBottom: 24,
},

  // Primary button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  primaryBtnDisabled: {
  opacity: 0.6,
},


  // Bottom text
bottomText: {
  textAlign: 'center',
  marginTop: 6,
  fontSize: 14,
  color: '#555',
},

link: {
  color: COLORS.primary,
  fontWeight: '700',
  fontSize: 14,
},
});
