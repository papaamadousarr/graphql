import { renderPage } from "./renderer.js";
import { formatXPSize } from "./util.js";

/* Helpers */
var friendlyHttpStatus = {
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'Non-Authoritative Information',
    '204': 'No Content',
    '205': 'Reset Content',
    '206': 'Partial Content',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '306': 'Unused',
    '307': 'Temporary Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Required',
    '413': 'Request Entry Too Large',
    '414': 'Request-URI Too Long',
    '415': 'Unsupported Media Type',
    '416': 'Requested Range Not Satisfiable',
    '417': 'Expectation Failed',
    '418': 'I\'m a teapot',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
    '505': 'HTTP Version Not Supported',
};

////////////////////>-- Login Functions --<////////////////////
const submitForm = (e) => {
    e.preventDefault();
    let form = new FormData(e.target);
    let creds = btoa(`${form.get("username")}:${form.get("password")}`);

    fetch("https://learn.zone01dakar.sn/api/auth/signin", {
        method: "POST",
        headers: {
            Authorization: `Basic ${creds}`,
        },
    },)
        .then(resp => {
            if (!resp.ok) throw new Error(resp.status)
            return resp.json()
        })
        .then((j) => {
            localStorage.setItem('currentUser', j)
            return renderPage()
        })
        .catch(handleConnexionError)
};

export const setUpUser = () => {
    setUsername()
    setTotalXP()
    setlevel()
    setAuditRatio()
    setPositionGraph()
    setNewAudit()
};

async function query(q) {
    const jwt = localStorage.getItem('currentUser')

    return fetch("https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql", {
        method: "POST",
        credentials: "same-origin",
        headers: { 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ query: q }),
    }).then(resp => resp.json())
}

async function setlevel() {
    const q = `{user {events (where:{ event: {path: { _ilike: "/dakar/div-01/graphql"}}}) {
        level 
    }}}`
    const level = await query(q).then(j => j.data.user[0].events[0].level)

    document.querySelector('#level p:last-child').innerText = level
}

async function getTotalXP() {
    const x = `{transaction_aggregate 
        (where: { type: { _eq: "xp"}, event: {path: { _ilike: "/dakar/div-01/graphql"}}}) {
            aggregate {sum {
                amount
            }}}
        }`
    return await query(x).then(j => j.data.transaction_aggregate.aggregate.sum.amount)
}

async function setTotalXP() {
    document.querySelector('#xp > p:last-child').innerText = formatXPSize(await getTotalXP())
}

async function setNewAudit() {
    const q = `{  audit (where: { resultId: {_is_null: true}}) {
        group {
            path
            captainLogin
        }
        private {
            code
        }}
    }`

    const audit = await query(q).then(j => j.data.audit)

    if (audit.length >= 1) {
        const path = audit[0].group.path.split('/')
        
        document.querySelector('#newAudit div:first-child h6').innerText = path[path.length - 1]
        document.querySelector('#newAudit div:first-child p').innerText = `@${audit[0].group.captainLogin}`
        document.querySelector('#newAudit div:last-child h1').innerText = audit[0].private.code.toUpperCase()

        console.log("Setting display as block");
        document.getElementById('newAudit').style.display = 'flex'
    }
}

async function setUsername() {
    const q = `{ user {
        login
        firstName
        lastName
    }}`

    const data = await query(q).then(j => j.data)

    console.log(data.user[0]);

    document.querySelector('#userName p').innerText = `${data.user[0].firstName} ${data.user[0].lastName}`
    document.querySelector('#userName p:last-child').innerText = `@${data.user[0].login}`
}

async function setAuditRatio() {
    const amount = (j) => j.data.transaction_aggregate.aggregate.sum.amount
    const xp = (type) =>
        query(`{transaction_aggregate (where: { type: {_eq: "${type}"}})  {
            aggregate {sum {
                amount
            }}}
        }`)
    const [up, down] = await Promise.allSettled([xp("up").then(amount), xp("down").then(amount)])
    const ratio = (up.value / down.value).toFixed(1)
    const counterRatio = (down.value / up.value).toFixed(1)
    const auditRatio = document.getElementById('auditRatio')

    //Modifiies ratio values
    document.getElementById('xpUP').innerText = formatXPSize(up.value)
    document.getElementById('xpDOWN').innerText = formatXPSize(down.value)
    auditRatio.innerText = ratio

    const docUP = document.querySelectorAll('#xpUpProgressBar line')[1]
    const docDOWN = document.querySelectorAll('#xpDownProgressBar line')[1]

    if (ratio >= 1) docDOWN.setAttribute('x2', `${100 * (counterRatio)}%`)
    else docUP.setAttribute('x2', `${100 * (ratio)}%`)

    //Modifies the svg for the ratio
    switch (true) {
        case ratio >= 2:
            docUP.style.stroke = "#0BB054"
            auditRatio.style.color = "#0BB054"
            break;
        case ratio >= 1.25:
            docUP.style.stroke = '#13c9d1'
            auditRatio.style.color = '#13c9d1'
            break;
        case ratio >= 1:
            docUP.style.stroke = '#ffef05'
            auditRatio.style.color = '#ffef05'
            break;
        case ratio >= 0.8:
            docUP.style.stroke = 'orange'
            auditRatio.style.color = 'orange'
            break;
        default:
            docUP.style.stroke = 'red'
            auditRatio.style.color = 'red'
            break;
    }
}

async function setPositionGraph() {
    //retrieve all events (transactions) and display
    const tx = `{ transaction (where: {
        type: {_eq: "xp"} 
        event: { 
            path: { _ilike: "/dakar/div-01/graphql"}} 
        } 
        order_by: { createdAt: asc}) {
            createdAt
            amount
            path
            objectId
        }
    }
    `
    const totalXP = await getTotalXP()
    const transactions = await query(tx).then(j => j.data.transaction)
    const graph = document.querySelector('#currentPositionGraph svg')
    const cs = getComputedStyle(graph)
    const r = graph.getBoundingClientRect()

    const graphWidth = r.right - r.left - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const graphHeight = r.bottom - r.top - parseFloat(cs.paddingBottom) - parseFloat(cs.paddingTop)

    const currentDate = new Date()
    let minimumDate = new Date()
    let startXP = 0
    minimumDate.setMonth(minimumDate.getMonth() - 6)

    //Filter out transactions older than 6 months
    const validTx = transactions.filter(tx => {
        const date = new Date(tx.createdAt)

        if (date < minimumDate) startXP += tx.amount
        return date >= minimumDate
    })

    //Setting steps each axis based on the data gathered
    const stepHor = (currentDate - minimumDate) / 100
    const stepVert = (totalXP - startXP) / 100

    let currentXP = startXP
    const points = validTx.reduce((accumulator, tx) => {
        const currentDate = new Date(tx.createdAt)
        //Getting the number of steps for that specific event
        let displacementX = (currentDate - minimumDate) / stepHor
        let displacementY = (currentXP - startXP + tx.amount) / stepVert
        //calculating pixel placement based on the previous step and size of the graph
        let x = Math.floor((graphWidth / 100) * displacementX)
        let y = Math.floor(graphHeight - (graphHeight / 100) * displacementY)
        currentXP += tx.amount

        return `${accumulator}${x},${y} `
    }, "")

    document.querySelector('#currentPositionGraph svg polyline').setAttribute('points', points)
    document.getElementById('axisX').setAttribute('x',graphWidth/2)
}

export function logout() {
    localStorage.removeItem('currentUser')
    renderPage()
}

function handleConnexionError(err) {
    let e = err.toString().slice(7)
    let errTitle = document.querySelector('#error h4')
    let errComment = document.querySelector('#error p')
    document.getElementById('error').style.display = 'flex'
    errTitle.innerText = `${err} \n${friendlyHttpStatus[e]}`
    errTitle.style.color = "red"

    console.log(e);

    if (e !== '401') {
        errComment.innerText = "Internal Server Error, please try again later or contact the support."
    } else {
        errComment.innerText = "Credentials not recognized, please type again."
    }
}


export { submitForm };