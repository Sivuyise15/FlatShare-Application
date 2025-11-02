// chatService.ts
import {
    addDoc,
    collection,
    doc,
    DocumentData,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    QuerySnapshot,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';
  
  // ------------------- TYPES -------------------
  export type Message = {
    id: string;
    text: string;
    senderId: string;
    receiverId: string;
    timestamp: any;
    read: boolean;
    chatId: string;
    listingId?: string;
  };
  
  export type Chat = {
    id: string;
    participants: string[];
    lastMessage: Message;
    listingId?: string;
    listingTitle?: string;  // Add this
    userName?: string;      // Add this
    userAvatar?: string;    // Add this
    createdAt: any;
    updatedAt: any;
  };
  
  // ------------------- FIND OR CREATE CHAT -------------------
  export const findOrCreateChat = async (
    user1: string,
    user2: string,
    listingId?: string
  ): Promise<string> => {
    // Prevent users from chatting with themselves
    if (user1 === user2) {
      throw new Error("Cannot create chat with yourself");
    }

    const chatsRef = collection(firestore, 'chats');
  
    // Find existing chat - check both possible participant orders
    const q1 = query(chatsRef, where('participants', '==', [user1, user2]));
    const q2 = query(chatsRef, where('participants', '==', [user2, user1]));
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    // Check first query results
    for (const docSnap of snapshot1.docs) {
      const chat = docSnap.data();
      const chatListingId = chat.listingId || null;
      const searchListingId = listingId || null;
      if (chatListingId === searchListingId) return docSnap.id;
    }

    // Check second query results
    for (const docSnap of snapshot2.docs) {
      const chat = docSnap.data();
      const chatListingId = chat.listingId || null;
      const searchListingId = listingId || null;
      if (chatListingId === searchListingId) return docSnap.id;
    }
  
    // Create new chat if not found
    // Sort participants to ensure consistent ordering
    const sortedParticipants = [user1, user2].sort();
    const chatData = {
      participants: sortedParticipants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      listingId: listingId || null,
      lastMessage: {
        text: '',
        timestamp: serverTimestamp(),
        senderId: '',
        id: ''
      }
    };
  
    const chatRef = await addDoc(chatsRef, chatData);
    return chatRef.id;
  };
  
  // ------------------- SEND MESSAGE -------------------
  export const sendMessage = async (
senderId: string, receiverId: string, text: string, listingId?: string, title?: string | undefined, userName?: string | undefined, userAvatar?: string | undefined  ) => {
    try {
      // Find or create chat
      const chatId = await findOrCreateChat(senderId, receiverId, listingId);
  
      // FIXED: Store messages in the chat's subcollection
      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
  
      const messageData = {
        text,
        senderId,
        receiverId,
        timestamp: serverTimestamp(),
        read: false,
        chatId,
        listingId: listingId || null
      };
  
      const messageRef = await addDoc(messagesRef, messageData);
  
      // Update chat's last message
      const lastMessage = {
        text,
        timestamp: serverTimestamp(),
        senderId,
        id: messageRef.id
      };
  
      await updateDoc(doc(firestore, 'chats', chatId), {
        lastMessage,
        updatedAt: serverTimestamp()
      });
  
      return chatId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // ------------------- LISTEN TO MESSAGES -------------------
  export const listenToMessages = (
    chatId: string,
    callback: (messages: Message[]) => void
  ) => {
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const messages: Message[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Message, 'id'>)
      }));
      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });
  
    return unsubscribe; // For cleanup in useEffect
  };

  // ------------------- GET USER CHATS -------------------
  export const getUserChats = (
    userId: string,
    callback: (chats: Chat[]) => void
  ) => {
    console.log("🔍 getUserChats called for user:", userId);
    
    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId)
      // Temporarily removed orderBy to avoid index issues
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const chats: Chat[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Chat, 'id'>)
      }));
      callback(chats);
    }, (error) => {
      console.error('Error listening to chats:', error);
    });

    return unsubscribe;
  };