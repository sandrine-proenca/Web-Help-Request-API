// imports
const express = require('express');
const { Client } = require('pg');
require('dotenv').config();


// declarations
const app = express();
const port = 8000;
const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

client.connect();

app.use(express.json());
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// LES ROUTES:

// vérification du bon démarage de la page
app.get('/hello', (req, res) => {
    res.send('Hello World!')
});


// ROUTE : table des tickets

// récupération du tableau de tous les tickets établis
app.get('/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets');

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack)
    }
});

// récupération d'un ticket défini
app.get('/tickets/:id', async (req, res) => {
    console.log(req.params);
    const id = req.params.id;

    try {
        const data = await client.query('SELECT * FROM tickets where id = $1', [id]);

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack)
    }
});


// création d'un ticket dans la table tickets
app.post('/tickets', async (req, res) => {
    console.log("test", req.body);

    const { problem, done, user_id } = req.body;

    if (problem === undefined || typeof problem !== typeof String()) {
        res.status(400).json({
            status: "FAIL",
            message: "Obligation d'avoir un PROBLEM en string",
            data: undefined
        });
        console.log(`POST | /tickets | 400 | FAIL \nObligation d'avoir un PROBLEM en string`);
        return;
    }
    if (done === undefined || typeof done !== typeof Boolean()) {
        res.status(400).json({
            status: "FAIL",
            message: "Obligation d'avoir un DONE en boolean",
            data: undefined
        });
        console.log(`POST | /tickets | 400 | FAIL \nObligation d'avoir un DONE en boolean`);
        return;
    }
    if (user_id === undefined || typeof user_id !== typeof Number() || user_id % 1 !== 0) {
        res.status(400).json({
            status: "FAIL",
            message: "Obligation d'avoir un USER_ID en nombre entier",
            data: undefined
        });
        console.log(`POST | /tickets | 400 | FAIL \nObligation d'avoir un USER_ID en nombre entier`);
        return;
    }

    try {

        const userList = await client.query('SELECT * FROM users WHERE id = $1;',[user_id])

        if (userList.rowCount === 0) {
            res.status(400).json({
                status: "FAIL",
                message: "Le USER n'existe pas dans le tableau des users",
                data: undefined
            });
            console.log(`POST | /tickets | 400 | FAIL \nLe USER n'existe pas dans le tableau des users`);
            return;
        }
        const data = await client.query('INSERT INTO tickets (problem, done, user_id) VALUES ($1, $2, $3) RETURNING *', [problem, done, user_id]);

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack);
    }
});

// modification d'un ticket défini et les messages d'erreur
app.put('/tickets/:id', async (req, res) => {
    console.log(req.params);
    const problem = req.body.problem;
    const done = req.body.done;
    const id = req.params.id;

    if (!(id && (problem || done !== undefined))) {
        res.status(400).json({
            status: "FAIL",
            message: "Structure incorrect",
            data: undefined
        }),
            console.log(`PUT | /tickets/:id | 400 | FAIL \n Structure incorrect`);
    }

    try {
        const data = await client.query('UPDATE tickets SET problem =$1, done =$2 WHERE id =$3 RETURNING*', [problem, done, id]);

        if (data.rowCount > 0) {
            res.status(200).json({
                status: "FAIL",
                message: `Le ticket ${id} a bien été modifié`,
                data: data.rows
            });
            console.log(`PUT | tickets/:id | 200 | SUCCESS \nLe ticket ${id} a bien été modifié `);
        } else {
            res.status(400).json({
                status: "FAIL",
                message: `Le ticket ${id} n'existe pas`,
                data: undefined
            });
            console.log(`PUT | tickets/:id | 400 | FAIL \nLe ticket ${id} n'existe pas `);
        }

    }
    catch (err) {
        res.status(500).json({
            status: "FAIL",
            message: "Serveur introuvable",
            data: undefined
        });
        console.log(`PUT | tickets/:id | 400 | FAIL \n${err.stack}`);
    }
});

//suppression d'un ticket dans la table tickets
app.delete('/tickets/:id', async (req, res) => {
    console.log(req.params)
    const id = req.params.id;

    try {
        const data = await client.query('DELETE FROM tickets where id = $1 RETURNING*', [id]);

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack);
    }
});

// ROUTE : table des users

// récupération du tableau de tous les utilisateurs
app.get('/users', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM users');

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack);
    }
});

// récupération d'un utilisateurs défini
app.get('/users/:id', async (req, res) => {
    console.log(req.params);
    const id = req.params.id;

    try {
        const data = await client.query('SELECT * FROM tickets where id = $1', [id]);

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack);
    }
});

// créer un utilisateur dans la table des users
app.post('/users', async (req, res) => {
    console.log("test", req.body);

    try {
        const name = req.body.name;

        const data = await client.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [name]);

        res.json(data.rows);
    }
    catch (err) {
        console.log(err.stack);
    }
});

// modification d'un utilisateur défini et les messages d'erreur
app.put('/users/:id', async (req, res) => {
    console.log(req.params);
    const name = req.body.name;
    const id = req.params.id;

    if (!(id && name)) {
        res.status(400).json({
            status: "FAIL",
            message: "Structure incorrect, pas de n°id et pas de nom",
            data: undefined
        });
        console.log(`PUT | /users/:id | 400 | FAIL \n Structure incorrect, pas de n°id et pas de nom`);
    }

    try {
        const data = await client.query('UPDATE users SET name =$1  WHERE id =$2 RETURNING*', [name, id]);

        if (data.rowCount > 0) {
            res.status(200).json({
                status: "FAIL",
                message: `L'utilisateur ${id} a bien été modifié`,
                data: data.rows
            });
            console.log(`PUT | /users/:id | 200 | SUCCESS \nL'utilisateur ${id} a bien été modifié `);
        } else {
            res.status(400).json({
                status: "FAIL",
                message: `L'utilisateur ${id} n'existe pas`,
                data: undefined
            });
            console.log(`PUT | /users/:id | 400 | FAIL \nL'utilisateur ${id} n'existe pas `);
        }

    }
    catch (err) {
        res.status(500).json({
            status: "FAIL",
            message: "Serveur introuvable",
            data: undefined
        });
        console.log(`PUT | /users/:id | 400 | FAIL \n${err.stack}`);
    }
});

// suppression d'un utilisateur défini dans la table users
app.delete('/users/:id', async (req, res) => {
    console.log(req.params);
    const id = req.params.id;


    try {
        await client.query('DELETE FROM tickets WHERE user_id = $1 ', [id]);
        const data = await client.query('DELETE FROM users WHERE id = $1 RETURNING*', [id]);
        res.json(data.rows);

        // supprimer les tickets correspondant aux users supprimer

    }
    catch (err) {
        console.log(err.stack);
    }
});




// ecoute le port 8000
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`);
});