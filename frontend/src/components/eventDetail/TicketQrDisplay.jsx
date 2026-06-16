import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function TicketQrDisplay({ value, size = 200, qrRef }) {
  if (!value) return null;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <QRCode
        value={value}
        size={size}
        color="#0F172A"
        backgroundColor="#FFFFFF"
        getRef={(ref) => {
          if (qrRef) qrRef.current = ref;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
