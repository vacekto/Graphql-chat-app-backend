const { gql } = require('apollo-server');

module.exports = gql`
  type DirectChannel {
    _id: ID!
    members: [String!]!
    channelType: String!
    channelName: String!
    messages: [Message!]!
  }

  type Room {
    _id: ID!
    channelName: String!
    members: [String!]!
    messages: [Message!]!
  }

  type Message {
    _id: ID!
    text: String!
    sender: String!
    date: String!
    members: [String]!
    channelId: ID!
    channelType: String!
  } 

  type User {
    _id: ID!
    userName: String!
    password: String
    token: ID
    isOnline: Boolean!
    friends: [String!]!
    rooms: [Room!]!
    directChannels: [DirectChannel!]!
  }


  input UserInput {
    userName: String!
    password: String!
  }

  input FriendInput {
    userName: String!
    friendUserName: String!
  }

  input MessageInput {
    senderName: String!
    channelType: String!
    channelId: ID!
    text: String!
    date: String!
  }

  type Query {
    login(input: UserInput): User
    directChannel(searchingUser: String, searchedUser: String): DirectChannel!
  }

  type Mutation {
    register(input: UserInput): User
    addFriend(input: FriendInput): User
    sendMessage(input: MessageInput): Message!
  }

  type Subscription {
    getMessages(userName: String!): Message
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`
