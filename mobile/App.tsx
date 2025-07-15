
import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
  const targetUrl = 'http://192.168.215.193:5173/';

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: targetUrl }}
        javaScriptEnabled={true}
        onShouldStartLoadWithRequest={(request) => {
          return request.url.startsWith(targetUrl);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
});

export default App;
