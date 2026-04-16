import React from 'react';
import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const EventComments = ({ comments, currentUserImage }) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Comments</Text>
      {comments.map(comment => (
        <View key={comment.id} style={styles.comment}>
          <Image source={comment.image} style={styles.commenterImage} />
          <View style={styles.commentBody}>
            <Text style={styles.commenterName}>{comment.name} <Text style={styles.commentTime}>{comment.time}</Text></Text>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        </View>
      ))}
      <View style={styles.commentInputContainer}>
        <Image source={currentUserImage} style={styles.commenterImage} />
        <View style={styles.inputWrapper}>
          <TextInput placeholder="Write a comment..." style={styles.commentInput} multiline />
          <TouchableOpacity style={styles.sendButton}>
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default EventComments;