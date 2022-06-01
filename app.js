require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3003;

app.use(express.json())

const router = express.Router()

const mysql = require('mysql2');
// const connection = mysql.createConnection(process.env.DATABASE_URL);

const connection = mysql.createConnection({
    // host: `localhost/${port}`,
    host: `localhost`,
    user: 'root',
    password: '[事前準備で設定したrootユーザのパスワード]',
    database: 'tatoeba-db',
    // process.env.DATABASE_URL
});


// connection.connect();

connection.connect((err) => {
    if (err) {
        console.log('error connecting: ' + err.stack);
        return
    }
    console.log('success');
});

app.get('/', (req, res) => {
    connection.query('SELECT * FROM users', function (err, rows, fields) {
        if (err) throw err;

        res.send(rows);
    });
});


app.post('/', function (req, res) {
    console.log(req.body);
    res.send('Got a POST request')
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});