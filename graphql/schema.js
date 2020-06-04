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
    channelType: String!
    creator: String
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
    selectedChannel: Room!
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
    test: [String]
    searchUser(userName: String!): [String!]!
    login(input: UserInput): User
    fetchDirectChannel(searchingUser: String, searchedUser: String): DirectChannel!
    fetchRoom(roomId: ID!) : Room
  }

  type Mutation {
    register(input: UserInput): User!
    addFriend(input: FriendInput): User!
    sendMessage(input: MessageInput): Message!
    createRoom(channelName: String!, creator: String!): Room!
    leaveRoom(roomId: ID!, userName: String!): ID!
    addPeopleToRoom(roomId: ID!, users:[String!]): [String!]!
  }

  type Subscription {
    getMessages(userName: String!): Message
    addedToRoom(userName: String!): Room
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`
