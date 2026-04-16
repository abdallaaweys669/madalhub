import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // --- Root Containers ---
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // This new container ensures the ScrollView doesn't push content off-screen
  screenContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // --- Top Bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },

  // --- Greeting and Search ---
  greetingContainer: {
    paddingHorizontal: 20,
    marginTop: 10, // Reduced margin for a tighter look
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // --- Carousel Section ---
  carouselContainer: {
    marginBottom: 25,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginLeft: 20,
    marginBottom: 15,
  },

  // --- Carousel Card ---
  carouselCard: {
    width: 260,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  carouselCardImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#eee',
  },
  carouselCardContent: {
    padding: 12,
  },
  carouselCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  carouselCardDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  carouselCardBookmarkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});