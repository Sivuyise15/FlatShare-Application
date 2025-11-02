{/* Server.js 
  This file sets up an Express server with various routes for handling user authentication, 
  resident management, listings, announcements, and more. It also includes middleware for CORS and body parsing.
  It serves as the main entry point for the backend application.
  */}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


const authRoute = require('./routes/auth.route');
const residentRoute = require('./routes/resident.route');
const listingRoutes = require('./routes/listing.route');
const announcementRoutes = require('./routes/announcement.route');
const { registerCommunity } = require('./controller/community.controller');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.get('/users', async (req, res) => {
  const db = admin.firestore();

  try{
    const usersRef = await db.collection('announcements').get();
    const data = usersRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(data);
  }
    catch(error){
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// post communities
app.post('/communities', registerCommunity);
//login
app.use('/login', authRoute);
// residents
app.use('/residents/', residentRoute);
// announcements
app.use('/announcements', announcementRoutes);
// listings
app.use('/listings', listingRoutes);
//Listing Details
const listingDetailRoutes = require('./routes/listingDetail.route');
app.use('/listings', listingDetailRoutes);
// Encrypted Chats
const encryptedChatRoutes = require('./routes/encryptedChat.route');
app.use('/encrypted-chats', encryptedChatRoutes);
// User Management
const userManagementRoutes = require('./routes/userManagement.route');
app.use('/user-management', userManagementRoutes);
// Reports
const reportRoutes = require('./routes/report.route');
app.use('/reports', reportRoutes);
// Resident check-approval

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});