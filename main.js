import fetch from 'node-fetch'
import pg from 'pg'
import async from 'async'

const {Pool, Client} = pg

const pool = new Pool({
    database: 'redfresh',
    user: 'redfresh',
    password: '8X4C*i@tPbFE',
})

const SOURCES = [
    {
        parser: 'reddit',
        name: 'popheads',
        subreddit: 'popheads',
        flair: [
            /\[FRESH VIDEO\]/i,
            /\[FRESH\]/i,
            /\[FRESH ALBUM\]/i,
        ]
    }
]

class Parser{
    constructor(sourceConfig){

    }
}

class RedditParser extends Parser{
    constructor(sourceConfig){
        super()
        this.name = sourceConfig.name
        this.subreddit = sourceConfig.subreddit || sourceConfig.name
        this.valid_flairs = sourceConfig.flair
    }

    async poll(){
        let response = await fetch(`https://www.reddit.com/r/${this.subreddit}/hot.json`)
        response = await response.json()
        if(response.data && response.data.children){
            await Promise.all(
                response.data.children
                    .map(item=>item.data)
                    .filter(item=>{
                        return this.valid_flairs.some(
                            pattern=>(item.link_flair_text||'').match(pattern)
                        )
                    })
                    .map(item=>this.processSingleListing(item))
            )
        }    
    }

    async processSingleListing(item){
        let simplifiedProperties = {
            id: item.id,
            flair: item.link_flair_text, 
            title: item.title,
            score: item.score,
            permalink: item.permalink,
            created_utc: item.created_utc,
            url: item.url
        }
        await pool.query(
            'INSERT INTO recommendations '+
            '(external_id, title, score, permalink, created, link) '+
            'VALUES ($1, $2, $3, $4, $5, $6) '+
            'ON CONFLICT (external_id) DO UPDATE SET '+
            'title=$2, score=$3, permalink=$4, created=$5, link=$6',
            [item.id, item.title, item.score, item.permalink, new Date(item.created_utc*1000), item.url]
        )
        console.log(simplifiedProperties)
    }
}

async.forever(async ()=>{
    await Promise.all(SOURCES.map(sourceConfig=>{
        if(sourceConfig.parser=='reddit'){
            let parser = new RedditParser(sourceConfig)
            return parser.poll()
        }
    }))
    const POLL_WAIT = 30
    for(let ix=0; ix<POLL_WAIT; ix++){
        await new Promise(resolve=>setTimeout(resolve, 1000))
    }
    
})