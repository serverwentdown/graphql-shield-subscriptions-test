
# Setup

```bash
yarn install && yarn dev
```

# Queries

```graphql
# this works, req.request is set
query GetTodos {
  todos {
    text
  }
}
# this works too
mutation CreateTodo {
  createTodo(text: "hi")
}
# this doesn't, req.request is not set
subscription SubscribeTodos {
  todos {
    text
  }
}
```
