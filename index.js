import fs from "fs"
import commander, { Command } from "commander"
import { Console } from "console"
import { Transform } from "stream"
const pjson = JSON.parse(fs.readFileSync("package.json"))

const CreditCard = {
    Visa: [[40000, 499999], [402600, 402699], [417500, 417599], [450800, 450899], [4844, 484499], [4913, 491399], [4917, 491799]],
    MasterCard: [[222100, 272099], [510000, 559999]]
}

function displayTable(input) {
  const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
  const logger = new Console({ stdout: ts })
  logger.table(input)
  const table = (ts.read() || '').toString()
  let result = ''
  for (let row of table.split(/[\r\n]+/)) {
    let r = row.replace(/[^┬]*┬/, '┌')
    r = r.replace(/^├─*┼/, '├')
    r = r.replace(/│[^│]*/, '')
    r = r.replace(/^└─*┴/, '└')
    r = r.replace(/'/g, ' ')
    result += `${r}\n`
  }
  console.log(result)
}


function convertToInteger(value) {
    let parsedValue = parseInt(value, 10)
    if (isNaN(parsedValue)) 
        throw new commander.InvalidArgumentError('The inserted value is not a valid number.')
    else if (parsedValue < 2) 
        throw new commander.InvalidArgumentError('The inserted value is under the minimum limit of 2.')
    else if (parsedValue > 50) 
        throw new commander.InvalidArgumentError('The inserted value is above the maximum limit of 50.')
    return parsedValue
}

const program = new Command()
    .version(`v${pjson.version} by zAlweNy26`, '-v, --version', 'Output the current version of the program')
    .configureOutput({ outputError: (str, write) => write(`\x1b[31m${str}\x1b[0m`) })
    
program.command("gen", { isDefault: true })
    .description("Injects various things into the specified electron app\nIf --devkeys doesn't work, try pressing CTRL + SHIFT + I")
    .requiredOption('-a, --amount <number>', 'The amount of credit card numbers to generate at time (min 2 | max 50)', convertToInteger)
    .option('-v, --visa', 'Generate only Visa credit card numbers')
    .option('-mc, --mastercard', 'Generate only MasterCard credit card numbers')
    .action(options => {
        if ((options.visa != undefined && options.mastercard != undefined)
            || (options.visa == undefined && options.mastercard == undefined)) generateCreditCard(options.amount, [CreditCard.Visa, CreditCard.MasterCard])
        else if (options.visa != undefined) generateCreditCard(options.amount, [CreditCard.Visa])
        else if (options.mastercard != undefined) generateCreditCard(options.amount, [CreditCard.MasterCard])
    })

function generateCreditCard(amount, type) {
    let creditCardsNumbers = { 
        "Visa": [
            /*{ 
                Number: "4000 0000 0000 0000",
                Expiration: "",
                CVV: ""
            }*/
        ], 
        "MasterCard": [
            /*{ 
                Number: "5000 0000 0000 0000",
                Expiration: "",
                CVV: ""
            }*/
        ] 
    }
    if (type.includes(CreditCard.Visa)) {
        for (let i = 0; i < amount; i++) {
            let firstSixRange = CreditCard.MasterCard[generateRandomNumber(0, 1)]
            let firstSixNumbers = generateRandomNumber(firstSixRange[0], firstSixRange[1]).toString()
            let finalNumbers = firstSixNumbers + ""
            creditCardsNumbers.Visa.push({ 
                Number: finalNumbers.match(/.{1,4}/g).join(' '),
                Expiration: "",
                CVV: ""
            })
        }
    }
    if (type.includes(CreditCard.MasterCard)) {
        for (let i = 0; i < amount; i++) {
            let firstSixRange = CreditCard.MasterCard[generateRandomNumber(0, 1)]
            let firstSixNumbers = generateRandomNumber(firstSixRange[0], firstSixRange[1]).toString()
            let finalNumbers = firstSixNumbers + ""
            creditCardsNumbers.MasterCard.push({ 
                Number: finalNumbers.match(/.{1,4}/g).join(' '),
                Expiration: "",
                CVV: ""
            })
        }
    }
    //console.log(JSON.stringify(creditCardsNumbers, null, 2))
    console.log("\n\n\nVisa")
    displayTable(creditCardsNumbers.Visa)
    console.log("MasterCard")
    displayTable(creditCardsNumbers.MasterCard)
}

function luhnAlgorithm() {

}

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

program.parse(process.argv)