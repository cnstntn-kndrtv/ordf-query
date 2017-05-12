let ldf = require('ldf-client'),
    N3 = require('N3'),
    fs = require('fs');

ldf.Logger.setLevel('error');

// для того, чтобы убрать Warninig: Possible EventEmitter memory leak detected. 
require('events').EventEmitter.defaultMaxListeners = 0;

let fragmentsClient = new ldf.FragmentsClient('http://ldf.kloud.one/ontorugrammaform');

let letter = 'а';
let query = 
`PREFIX ontolex: <http://www.w3.org/ns/lemon/ontolex#>
PREFIX lexinfo: <http://www.lexinfo.net/ontology/2.0/lexinfo#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?formWr ?lemmaWr
WHERE {
    
    ?wordId ontolex:otherForm ?formId ;
            ontolex:canonicalForm ?lemmaId .
    
    ?formId ontolex:writtenRep ?formWr .
    
    ?lemmaId ontolex:writtenRep ?lemmaWr .
    
    # коммент
    FILTER (REGEX(STR(?formWr), "^${letter}")) .
    
} LIMIT 20`;

let res = new ldf.SparqlIterator(query, { fragmentsClient: fragmentsClient });

let results = {};

res.on('data', (data) => { 
    // console.log(data);
    let lemma = getLiteral( data['?lemmaWr']);
    let form = getLiteral( data['?formWr']);
    
    if (results[lemma]) {
        if (form != lemma) results[lemma].push(form);
    }
    else results[lemma] = [];
});

res.on('end', () => {
    console.log('---END---')
    console.log(results);
    saveToFile(results);
})

let fileName = 'results.txt'
function saveToFile (data) {
    let str = '';
    for (lemma in results) {
        if (results.hasOwnProperty(lemma)) {
            str += lemma + ' ';
            results[lemma].forEach((form) => {
                str += form + ' ';
            })
            str += '\n';
        }
    }
    fs.exists(fileName, (exist) => {
        if (exist) fs.unlinkSync(fileName);
        fs.appendFile(fileName, str);
    })
}

function getLiteral(l) {
    return (l) ? N3.Util.getLiteralValue(l) : null;
}