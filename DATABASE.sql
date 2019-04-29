CREATE TABLE `users` (
    `email` varchar(256) NOT NULL,
    `password` varchar (20) NOT NULL,
    `name` varchar(256) NOT NULL,
    `gender` char(1) NOT NULL,
    `birthdate` date DEFAULT NULL,
    `profile_picture` varchar(256) DEFAULT NULL,
    `points` int(5) DEFAULT 0,
    PRIMARY KEY (`email`)
);

CREATE TABLE `friends` (
    `user1` varchar(256) NOT NULL,
    `user2` varchar(256) NOT NULL,
    `status` tinyint(3) UNSIGNED DEFAULT NULL,
    PRIMARY KEY (`user1`, `user2`),
    CONSTRAINT `friends_fk1`FOREIGN KEY (`user1`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `friends_fk2`FOREIGN KEY (`user2`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `questions` (
    `id` int(20) AUTO_INCREMENT,
    `question_text` varchar (256) NOT NULL,
    `numbanswers` int(20) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `answers` (
    `Qid` int(20) NOT NULL,
    `Aid` int(20) NOT NULL,
    `text` varchar(200) NOT NULL,
    PRIMARY KEY (`Qid`,`Aid`),
    CONSTRAINT `answers_fk1` FOREIGN KEY (`Aid`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `users_guesses` (
    `email` varchar(50) NOT NULL,
    `friendEmail` varchar(50) NOT NULL,
    `Qid` int(20) NOT NULL,
    `result` tinyint(1) NOT NULL,
    PRIMARY KEY (`email`,`friendEmail`,`Qid`),
    KEY `users_guesses_fk_2` (`friendEmail`),
    KEY `users_guesses_fk_3` (`Qid`),
    CONSTRAINT `users_guesses_fk_1` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `users_guesses_fk_2` FOREIGN KEY (`FriendEmail`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `users_guesses_fk_3` FOREIGN KEY (`Qid`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `ownanswers` (
    `email` varchar(50) NOT NULL,
    `Qid` int(20) NOT NULL,
    `text` varchar(256) NOT NULL,
    PRIMARY KEY (`email`,`Qid`),
    CONSTRAINT `ownanswers_fk_2` FOREIGN KEY (`Qid`) REFERENCES `answers` (`Qid`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ownanswers_fk_1` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE
);