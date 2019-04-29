// app.js
const config = require("./config");
const path = require("path");
const mysql = require("mysql");
const express = require("express");
const daoUsers = require("./DAOs/daoUsers");
const daoQuestions = require("./DAOs/daoQuestions");
const bodyParser = require("body-parser");
const session = require("express-session");
const expressValidator = require("express-validator");
const multer = require("multer");
const multerFactory = multer({ dest: path.join(__dirname, "public/img")});

// Crear un servidor Express.js
const app = express();

// Crear un pool de conexiones a la base de datos de MySQL
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

app.use(middlewareSession);
app.use(expressValidator());

// Crear una instancia de DAOTasks
const users = new daoUsers.daoUsers(pool);
const quest = new daoQuestions.daoQuestions(pool);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: false}));

// Arrancar el servidor
app.listen(config.port, (err) => {
   if (err) {
       console.log("Error al iniciar el servidor");
   }
   else {
       console.log(`Servidor arrancado en el puerto ${config.port}`);
   }
});

app.get("/", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    } 
    else {
        response.redirect("profile");
    }
});

app.get("/login", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.render("login", {error: request.session.error});
    } 
    else {
        response.redirect("profile");
    }
});

app.get("/profile", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
        response.end();
    }
    else {
        response.render("profile", {user: request.session.loggedUser, friend: null});
    }
});

app.get("/friendProfile", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
        response.end();
    }
    else {
        users.getUser(request.query.id, (err, friend) => {
            if (friend.birthdate !== undefined) {
                users.calculateAge(friend.birthdate, (age) => {
                    if(isNaN(age)) {friend.birthdate = -1;}
                    else {friend.birthdate = age;}
                })
            }
            response.render("profile", {user: request.session.loggedUser, friend: friend});
        })
    }
});

app.get("/signup", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.render("signup", {error: undefined});
    } 
    else {
        response.redirect("profile");
    }
});

app.get("/friends", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    }
    else {
        users.getFriendRequests(request.session.loggedUser.email, (err, requests) => {
            if (err) {
                console.log("Se ha producido un error al obtener las solicitudes de amistad.");
            }
            else {
                users.getUserFriends(request.session.loggedUser.email, (err, friends) => {
                    if (err) {
                        console.log("Se ha producido un error al obtener los perfiles de los amigos.");
                    }
                    else {
                        response.render("friends", {requests: requests, friends: friends, user:request.session.loggedUser});
                    }
                })
            }
        })
    }
})

app.get("/logout", (request, response) => {
    request.session.destroy();
    response.redirect("login");
})

app.get("/modify", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    }
    else {
        response.render("modify", {user: request.session.loggedUser})
    }
})

app.post("/isUserCorrect", (request, response) => {
    users.isUserCorrect(request.body.email, request.body.psw, (err, result) => {
        if (err) {
            request.session.error = err;
            response.redirect("login");
        }
        else {
            if (result) {
                users.getUser(request.body.email, (err, user) => {
                    if (user.birthdate !== undefined) {
                        users.calculateAge(user.birthdate, (age) => {
                            if(isNaN(age)) {user.birthdate = -1;}
                            else {user.birthdate = age;}
                        })
                    }
                    request.session.loggedUser = user;
                    response.redirect("profile");
               })
            }
            else {
                request.session.error = "Usuario o contraseña incorrectos."
                response.redirect("login");
            }
        }
    });
});

app.post("/modifyUser", multerFactory.single("picture"), (request, response) => {
    let file = "";
    if (request.file) {
        file = request.file.filename;
    }
    let user = {
        email: request.body.email,
        password: request.body.psw,
        name: request.body.name,
        gender: request.body.gender,
        birthdate: request.body.bdate,
        profile_picture: file,
        points: request.session.loggedUser.points
    }

    users.modifyUser(user, (err, result) => {
        if (err) {
            response.redirect("modify");
        }
        if (result) {
            if (user.birthdate !== undefined) {
                users.calculateAge(user.birthdate, (age) => {
                    if(isNaN(age)) {user.birthdate = -1;}
                    else {user.birthdate = age;}
                })
            }
            request.session.loggedUser = user;
            response.redirect("profile");
        }
    });
});

app.get("/img/:id", (request, response) => {
    let pathImg = path.join(__dirname, "public/img", request.params.id);
    response.sendFile(pathImg);
});

app.post("/newUser", multerFactory.single("picture"), (request, response) => {
    request.checkBody("email", "Dirección de correo no válida").isEmail();
    request.checkBody("psw", "La contraseña debe tener entre 6 y 10 caracteres").isLength({min: 6, max: 10});
    request.checkBody("name", "Nombre de usuario no válido").matches(/^[a-zA-Z0-9 ]+$/i);
    if(request.body.bdate !== ""){
        request.checkBody("bdate", "Fecha de nacimiento no válida").isBefore();
    }
    request.getValidationResult().then(function(result) {
        if(result.isEmpty()) {
            let file = "";
            if (request.file) {
                file = request.file.filename;
            }
            let user = {
                email: request.body.email,
                password: request.body.psw,
                name: request.body.name,
                gender: request.body.gender,
                birthdate: request.body.bdate,
                profile_picture: file,
                points: 0
            }
            users.newUser(user, (err, result) => {
                if(err){
                    response.redirect("signup");
                }
                else {
                    if (user.birthdate !== undefined) {
                        users.calculateAge(user.birthdate, (age) => {
                            if(isNaN(age)) {user.birthdate = -1;}
                            else {user.birthdate = age;}
                        })
                    }
                    request.session.loggedUser = user;
                    response.redirect("profile");
                }
            })
        }
        else {
            response.render("signup", {error:result.array()} );
        }
    })
    
});

app.post("/friends_Search", (request, response) => {
    users.search(request.body.searchfriend, request.session.loggedUser.email, (err, result) => {
        if (err) {
            response.redirect("friends");
        }
        else {
            request.session.searchResults = result;
            response.redirect("searchResults");
        }
    })
});

app.get ("/searchResults", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    }
    else {
        response.render("searchResults", {user: request.session.loggedUser, searchResults: request.session.searchResults})
    }
});

app.post("/sendFriendRequest", (request, response) => {
    users.sendFriendRequest(request.session.loggedUser.email, request.body.friendrequest, (err, result) => {
        if (result) {
            response.redirect("friends");
            response.end();
        }
    });
});

app.post("/friendRequestResponse", (request, response) => {
    let responsebtn = false;
    if (request.body.btn === "Aceptar") {
        responsebtn = true;
    }
    users.friendRequestResponse(request.body.friendrequest, request.session.loggedUser.email, responsebtn, (err, result) => {
        if (result) {
            response.redirect("friends");
            response.end();
        }
    });
});

app.get("/newquestion", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    }
    else {
        response.render("newquestion", {user: request.session.loggedUser});
    }
});

app.get("/question", (request, response) => {
    quest.getQuestionData(request.query.id, (err, question)=>{
        quest.isAnswered(request.query.id, request.session.loggedUser.email, (err, answered) => {
            users.getUserFriends(request.session.loggedUser.email, (err, friends) => {
                if (!err) {
                    let answers = [];
                    /*
                    for (var friend in friends) {
                        quest.isAnswered(request.query.id, friends[friend].email, (err, answered) => {
                            if (answered) {
                                answers.push({name: friend.name, email: friend.email, guessed: 2})
                            }
                        });
                    }*/
                    response.render("question", {user: request.session.loggedUser, question: question, answered:answered, friends: friends});
                }
            });
        });      
    });
})

app.get("/questions", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    }
    else {
        quest.randomQuestion((err, questions) => {
            response.render("questions", {user: request.session.loggedUser, questions: questions});
        }); 
    }
})

app.get("/answerquestion", (request, response) => {
    if (request.session.loggedUser === undefined) {
        response.redirect("login");
    }
    else {
        quest.getQuestionData(request.query.id, (err, data) =>{
            response.render("answerquestion", {user: request.session.loggedUser, data: data});
        });
    }
})

app.post("/answerQuestion", (request, response) => {
    let answer =  {
        email: request.session.loggedUser.email,
        Qid: request.body.qid,
        text: request.body.answer
    }
    quest.answerQuestion(answer, (err, result) => {
        if (err) {
            response.redirect("error");
        }
        if (result) {
            response.redirect("questions");
        }
    });
})

app.post("/createnewquestion", (request, response) => {
    let numbanswers = 2, Qid;
    if (request.body.option_3 !== "") {
        numbanswers++;
        if (request.body.option_4 !== "") {
            numbanswers++;
        }
    }
    let question = {
        question_text: request.body.question_text,
        numbanswers: numbanswers
    }
    quest.newQuestion(question, (err) => {
        if (!err) {
            quest.getLastQid((err, result) => {
                if (!err) {
                    Qid = result - 1;
                    quest.insertAnswer(Qid, 1, request.body.option_1, (err) => {
                        if (!err) {
                            quest.insertAnswer(Qid, 2, request.body.option_2, (err) => {
                                if ((!err) && (numbanswers >=3)) {
                                    quest.insertAnswer(Qid, 3, request.body.option_3, (err) => {
                                        if ((!err) && (numbanswers >=4)) {
                                            quest.insertAnswer(Qid, 4, request.body.option_4, (err) => {
                                                if (err) {
                                                    response.write(err);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            response.redirect("questions");
        }
    });
})