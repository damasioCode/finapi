const express = require('express')

//universally unique identifier
const { v4: uuidv4 } = require('uuid')

const app = express()

//middleware
app.use(express.json())

//fake bd
let customers = []

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers
  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return response.status(400).json({error: "Customer not found"})
  }
  request.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if( operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0);
  
  return balance
}

/**
 * CPF - String
 * Name - String
 * ID - uuid
 * Statement - []
 */
app.post('/account', (request, response) => {
  const { name, cpf } = request.body

  const customerAlreadyExists = customers.some( customer => customer.cpf === cpf)
  
  if(customerAlreadyExists) {
    return response.status(400).send('CPF already exists!')
  }

  customers.push({
    id: uuidv4(),
    name,
    cpf,
    statement: []
  })

  console.log(customers)
  return response.status(201).send("user created sucessfully!")
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request
  return response.status(201).json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body
  
  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation)  

  return response.status(201).send(customer.statement)
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request

  const balance = getBalance(customer.statement);
  if( balance < amount ){
    return response.status(400).json({error: "Insufficient funds!"});
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation);
  return response.status(201).send(customer.statement);
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) =>{
  const {customer} = request
  const {date} = request.query

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter( 
    statement =>
      statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  )

  return response.status(200).json(statement)

})
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name
  console.log(customer)
  return response.status(201).send()
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.status(201).json(customer)
});

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});


app.listen(3333)