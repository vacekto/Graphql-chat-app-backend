const { buildSchema } = require("graphql");

/*
todo{
  log out
}
*/

module.exports = buildSchema(`
  type Friend {
    _id: ID!
    userName: String!
    messages: [Message!]!
    isOnline: Boolean!
  }

  type Room {
    _id: ID!
    name: String!
    members: [User!]!
    messages: [Message!]!
  }

  type Message {
    _id: ID!
    text: String!
    sender: User!
  } 

  type User {
    _id: ID!
    userName: String!
    password: String
    isOnline: Boolean!
    friends: [Friend!]!
    rooms: [Room!]!
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
    channelName: String!
    text: String!
    date: String!
  }

  type RootQuery {
    login(input: UserInput): User
  }

  type RootMutation {
    register(input: UserInput): User
    addFriend(input: FriendInput): User
    sendMessage(input: MessageInput): Message!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`)