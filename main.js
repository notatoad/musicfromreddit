import fetch from 'node-fetch'

const SR_NAME = 'popheads'
const VALID_FLAIRS = [
    /\[FRESH VIDEO\]/i,
    /\[FRESH\]/i,
    /\[FRESH ALBUM\]/i,
]

async function processSingleListing(item){
    let simplifiedProperties = {
        id: item.id,
        flair: item.link_flair_text, 
        title: item.title,
        score: item.score,
        permalink: item.permalink,
        created_utc: item.created_utc,
        url: item.url
    }
    console.log(simplifiedProperties)

}

async function processListingResponse(items){
    await Promise.all(items.filter(item=>{
        return VALID_FLAIRS.some(pattern=>(item.link_flair_text||'').match(pattern))
    }).map(item=>{
        return processSingleListing(item)
    }))
}

fetch(`https://www.reddit.com/r/${SR_NAME}/top.json?t=week`)
    .then(response=>response.json())
    .then(response=>{
        if(response.data && response.data.children){
            return processListingResponse(
                response.data.children.map(item=>item.data)
            )
        }
    }).then(()=>{
        console.log('DONE!')
    })