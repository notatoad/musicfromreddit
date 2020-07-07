import express from 'express'
import pg from 'pg'
import fs from 'fs'
import Mustache from 'mustache'

const {Pool, Client} = pg

const app = express()
const port = 3000


const pool = new Pool({
    database: 'redfresh',
    user: 'redfresh',
})

let template = fs.readFileSync('./index.mustache.html', 'utf-8')

app.get('/', async (req, res) => {
    let response = await pool.query(
        'SELECT id, title, score, permalink, created, link '+
        'FROM recommendations ORDER BY created DESC',
    )
    console.log(response.rows)
    res.send(Mustache.render(template, {recs: response.rows}))
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))