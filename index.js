//SERVER SETUP
const express = require("express");
const path = require("path");
const app = express();

require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 2
});

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false })); // <--- middleware configuration

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  // res.send("Hello world...");
  res.render("index");
});