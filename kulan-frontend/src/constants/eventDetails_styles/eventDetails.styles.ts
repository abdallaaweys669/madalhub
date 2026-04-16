import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Main Layout
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  contentContainer: { 
    padding: 20, 
    marginTop: -20, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20 
  },

  // Header
  headerImage: { 
    width: '100%', 
    height: 280 
  },
  headerOverlay: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 50 
  },
  iconButton: { 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 20, 
    padding: 8 
  },

  // Info Box
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#212529', 
    marginBottom: 20 
  },
  infoBox: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  infoIconBg: { 
    backgroundColor: '#e9ecef', 
    padding: 8, 
    borderRadius: 8 
  },
  infoText: { 
    fontSize: 16, 
    marginLeft: 16, 
    color: '#343a40', 
    fontWeight: '500' 
  },

  // About Section
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#000000', 
    marginBottom: 12 
  },
  description: { 
    fontSize: 16, 
    color: '#6B7280', 
    lineHeight: 24 
  },
  fadeEffect: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    height: '100%' 
  },
  readMore: { 
    color: '#2563EB', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginTop: 8 
  },

  // Actions & Attendees
  joinButton: { 
    backgroundColor: '#0047FF', 
    paddingVertical: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginVertical: 24 
  },
  joinButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  attendeesContainer: { 
    alignItems: 'flex-start', 
    marginBottom: 24 
  },
  attendeeImages: { 
    flexDirection: 'row', 
    marginBottom: 10 
  },
  attendeeImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  attendeesText: { 
    fontSize: 14, 
    color: '#6c757d', 
    fontWeight: '500' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#e9ecef', 
    marginVertical: 24 
  },

  // Comments Section
  comment: { 
    flexDirection: 'row', 
    marginBottom: 20 
  },
  commenterImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  commentBody: { 
    marginLeft: 12, 
    flex: 1 
  },
  commenterName: { 
    fontWeight: 'bold', 
    color: '#343a40' 
  },
  commentTime: { 
    color: '#888', 
    fontWeight: 'normal' 
  },
  commentText: { 
    fontSize: 15, 
    color: '#495057', 
    marginTop: 4 
  },
  commentInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10 
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    borderRadius: 25,
    marginLeft: 12,
    paddingRight: 8,
  },
  commentInput: { 
    flex: 1,
    paddingVertical: 12, 
    paddingHorizontal: 16,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#0047FF',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});