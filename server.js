import express from 'express'
import pg from 'pg'
import fs from 'fs'
import Mustache from 'mustache'
import moment from 'moment'
const {Pool, Client} = pg

const app = express()
const port = 3000


const pool = new Pool({
    database: 'redfresh',
    user: 'redfresh',
})

let template = fs.readFileSync('./index.mustache.html', 'utf-8')

app.get('/', async (req, res) => {
    let now = new Date()
    let dow = now.getDay()
    let monday = new Date()
    if(dow == 0){ 
        monday.setDate(now.getDate()-7) //sunday
    }else{
        monday.setDate(now.getDate()-dow) //anything other than sunday
    }
    let periodEnds = new Date(monday)
    periodEnds.setDate(periodEnds.getDate()+7)
    console.log(monday, periodEnds)
    
    let response = await pool.query(
        'SELECT id, title, score, permalink, created, link '+
        'FROM recommendations '+
        'WHERE created>$1 AND created<$2 '+
        'ORDER BY score DESC',
        [monday, periodEnds]
    )
    console.log(response.rows)
    res.send(Mustache.render(template, {
        recs: response.rows,
        monday: moment(monday).format('YYYY-MM-DD')
    }))
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))