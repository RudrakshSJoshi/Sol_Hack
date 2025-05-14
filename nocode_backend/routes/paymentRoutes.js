// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import node routes
const agentRoutes = require('./routes/agentRoutes');
const modelRoutes = require('./routes/modelRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const toolRoutes = require('./routes/toolRoutes');
const strategyRoutes = require('./routes/strategyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const flowRoutes = require('./routes/flowRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/agent', agentRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/tool', toolRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/flow', flowRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});