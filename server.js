const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (use environment variable for connection string)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calculator';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB not connected, using in-memory storage:', err.message));

app.use(express.static('public'));
app.use(express.json()); // For parsing JSON bodies

const routes = require("./api/routes");
routes(app);

if (!module.parent) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
