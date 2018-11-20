"use strict";

/*
    Antes de ejecutar este script, modifica el fichero "config.js"
    con la información de tu instalación de MySQL.
*/
const config = require("./config");
const mysql = require("mysql");
const daoUsers = require("./DAOs/daoUsers");
const daoQuestions = require("./DAOs/daoQuestions");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require ("express-session")
const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});
const mysqlSession = require("express-mysql-session");
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});
const middlewareSession = session ({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(middlewareSession);

let users = new daoUsers.daoUsers(pool);

app.post("/isUserCorrect", (request, response) => {
    if (request.session.loggedUser !== undefined) {
        response.render("profile");
        response.end();
    }
    users.isUserCorrect(request.body.emailaddress, request.body.password, (err, result)=> {
        if (err) {
            console.log("Se ha producido un error.");
            response.render("main");
        } 
        if (result === false) {
            response.render("main");
        }
        else {
            users.getUser(request.body.emailaddress, (err, user) => {
                request.session.loggedUser = user;
                response.render("profile", {user: request.session.loggedUser});
            });
        }
    });
});