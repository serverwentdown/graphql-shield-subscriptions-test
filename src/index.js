import { GraphQLServer, PubSub } from 'graphql-yoga'
import { rule, shield, and, or, not } from 'graphql-shield'

const typeDefs = `
  type Query {
	todos: [Todo!]!
  }

  type Mutation {
    createTodo(text: String!): Boolean!
  }

  type Subscription {
    todos: Todo!
  }

  type Todo {
    text: String!
  }
`

const pubsub = new PubSub();

const TODOS_CHANNEL = "todos";
const todos = [];

const resolvers = {
  Query: {
    todos: () => todos,
  },
  Mutation: {
    createTodo: (parent, { text }, { pubsub }) => {
      todos.push({ text });
      pubsub.publish(TODOS_CHANNEL, { text });
      return true;
    },
  },
  Subscription: {
    todos: {
      subscribe: (parent, {}, { pubsub }) => {
        return pubsub.asyncIterator(TODOS_CHANNEL);
      },
    },
  },
};

// Auth

const users = {
  mathew: {
    id: 1,
    name: 'Mathew',
    role: 'editor',
  },
  george: {
    id: 2,
    name: 'George',
    role: 'editor',
  },
  johnny: {
    id: 3,
    name: 'Johnny',
    role: 'reader',
  },
}

function getUser(req) {
  console.log(req.request ? 'request exists' : 'request does not exist');
  const auth = req.request.get('Authorization')
  if (users[auth]) {
    return users[auth]
  } else {
    return null;
  }
}

// Rules

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
  return ctx.user !== null
});

const isEditor = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'editor'
});

// Permissions

const permissions = shield({
  Query: {
    todos: isAuthenticated,
  },
  Mutation: {
    createTodo: and(isAuthenticated, isEditor),
  },
  Subscription: {
    todos: isAuthenticated,
  },
})

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions],
  context: req => ({
    ...req,
    pubsub,
    user: getUser(req),
  }),
})

server.start(() => console.log('Server is running on http://localhost:4000'))
