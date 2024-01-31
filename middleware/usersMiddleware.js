const express = require("express");
const jwt = require("jsonwebtoken");
const secret = "secret";


const auth = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = auth;

