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

var currentYear = 0

function convertToInteger(value) {
    let parsedValue = parseInt(value, 10)
    if (isNaN(parsedValue)) 
        throw new commander.InvalidArgumentError('The inserted value is not a valid number.')
    else if (parsedValue < 1) 
        throw new commander.InvalidArgumentError('The inserted value is under the minimum limit of 1.')
    else if (parsedValue > 50) 
        throw new commander.InvalidArgumentError('The inserted value is above the maximum limit of 50.')
    return parsedValue
}

const program = new Command().configureOutput({ outputError: (str, write) => write(`\x1b[31m${str}\x1b[0m`) })
    
program.command("check <number>")
    .description("Check if the credit card number is valid using the luhn algorithm")
    .action(number => {
        let checkDigit = number[number.length - 1]
        let genDigit = getLuhnDigit(number.substring(0, number.length - 1))
        console.log(`\x1b[33mLast digit : ${checkDigit} | Generated digit : ${genDigit}\x1b[0m`)
        if (checkDigit == genDigit) console.log("\x1b[32mThe credit card number is valid.\x1b[0m")
        else console.log("\x1b[31mThe credit card number is not valid !\x1b[0m")
    })

program.command("gen", { isDefault: true })
    .argument('[amount]', 'the amount of credit card to generate', convertToInteger, 1)
    .description("Generate a specific amount of credit cards, hoping that one of them is valid")
    .option('-vs, --visa', 'Generate only Visa credit card numbers')
    .option('-mc, --mastercard', 'Generate only MasterCard credit card numbers')
    .action((amount, options) => {
        currentYear = new Date().getFullYear()
        if ((options.visa != undefined && options.mastercard != undefined)
            || (options.visa == undefined && options.mastercard == undefined)) generateCreditCard(amount, [CreditCard.Visa, CreditCard.MasterCard])
        else if (options.visa != undefined) generateCreditCard(amount, [CreditCard.Visa])
        else if (options.mastercard != undefined) generateCreditCard(amount, [CreditCard.MasterCard])
    })

function generateCreditCard(amount, type) {
    console.time("Credit cards generated in")
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
    console.log(`\x1b[32mCreated by zAlweNy26 - v${pjson.version}\x1b[0m\n\n`)
    if (type.includes(CreditCard.Visa)) {
        for (let i = 0; i < amount; i++) {
            let firstSixRange = CreditCard.Visa[getRandomNumber(0, 6)]
            let firstSixNumbers = getRandomNumber(firstSixRange[0], firstSixRange[1]).toString()
            let middleNineNumbers = getRandomNumber(0, 999999999).toString()
            let finalNumbers = firstSixNumbers + middleNineNumbers
            finalNumbers += getLuhnDigit(finalNumbers)
            creditCardsNumbers.Visa.push({ 
                Number: finalNumbers.match(/.{1,4}/g).join(' '),
                Expiration: getRandomNumber(1, 12) + "/" + getRandomNumber(currentYear, currentYear + 5),
                CVV: getRandomNumber(0, 999)
            })
        }
        console.log("\x1b[47m\x1b[34mVisa\x1b[0m")
        displayTable(creditCardsNumbers.Visa)
    }
    if (type.includes(CreditCard.MasterCard)) {
        for (let i = 0; i < amount; i++) {
            let firstSixRange = CreditCard.MasterCard[getRandomNumber(0, 1)]
            let firstSixNumbers = getRandomNumber(firstSixRange[0], firstSixRange[1]).toString()
            let middleNineNumbers = getRandomNumber(0, 999999999).toString()
            let finalNumbers = firstSixNumbers + middleNineNumbers
            finalNumbers += getLuhnDigit(finalNumbers)
            creditCardsNumbers.MasterCard.push({ 
                Number: finalNumbers.match(/.{1,4}/g).join(' '),
                Expiration: getRandomNumber(1, 12) + "/" + getRandomNumber(currentYear, currentYear + 5),
                CVV: getRandomNumber(0, 999)
            })
        }
        console.log("\x1b[31mMaster\x1b[33mCard\x1b[0m")
        displayTable(creditCardsNumbers.MasterCard)
    }
    console.timeEnd("Credit cards generated in")
    //console.log(JSON.stringify(creditCardsNumbers, null, 2))
}

function getLuhnDigit(num) {
    let sum = 0
    for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num[i])
        if (num.length % 2 && (i + 1) % 2) digit *= 2
        if (digit > 9) digit -= 9
        sum += digit
    }
    return ((10 - (sum % 10)) % 10).toString()
}

function getRandomNumber(min, max) {
    let num = Math.floor(Math.random() * (max - min + 1) + min).toString()
    while (num.length < max.toString().length) num = "0" + num
    return num
}

program.parse(process.argv)