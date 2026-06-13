import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const EventComments = ({ comments, currentUserImage, joined, onViewAllComments }) => {
  const [message, setMessage] = useState('');
  const previewComments = comments.slice(0, 3);

  return (
    <>
      <Text style={styles.sectionTitle}>Discussion</Text>
      {previewComments.map((comment) => (
        <View key={comment.id} style={styles.comment}>
          <Image source={comment.image} style={styles.commenterImage} />
          <View style={styles.commentBody}>
            <Text style={styles.commenterName}>
              {comment.name} <Text style={styles.commentTime}>{comment.time} ago</Text>
            </Text>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity onPress={onViewAllComments} style={styles.viewAllCommentsButton}>
        <Text style={styles.viewAllCommentsText}>View all comments</Text>
      </TouchableOpacity>
      {!joined ? <Text style={styles.joinToParticipate}>Join event to participate</Text> : null}
      <View style={styles.commentInputContainer}>
        <Image source={currentUserImage} style={styles.commenterImage} />
        <View style={[styles.inputWrapper, !joined && styles.inputWrapperDisabled]}>
          <TextInput
            placeholder={joined ? 'Write a comment...' : 'Join event to comment'}
            style={styles.commentInput}
            value={message}
            onChangeText={setMessage}
            editable={joined}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !joined && styles.sendButtonDisabled]}
            disabled={!joined || !message.trim()}
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default EventComments;