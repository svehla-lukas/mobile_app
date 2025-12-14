import cors from 'cors'
import express from 'express'
import fs from 'fs'

const app = express()
const port = 1234

app.use(cors())

app.get('/', (req, res) => {
  console.log('někdo volá server')
  const dataString = fs.readFileSync(`${__dirname}/../data.json`, 'utf-8')
  const data = JSON.parse(dataString).users
  res.send(data)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.info('ahooooj')

let x: number = 3

const main = async () => {
  const dataString = fs.readFileSync(`${__dirname}/../data.json`, 'utf-8')
  const data = JSON.parse(dataString)

  const newData = {
    ...data,
    users: [
      {
        id: '1',
        name: 'kuba',
      },
    ],
  }

  fs.writeFileSync(`${__dirname}/../data.json`, JSON.stringify(newData, null, 2), 'utf-8')
}
main()

export {}
