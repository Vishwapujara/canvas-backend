import { v4 as uuidv4 } from "uuid";

export default function UsersDao(db) {
  let { users } = db;

  const createUser = (user) => {
    const newUser = { ...user, _id: uuidv4() };
    db.users.push(newUser); // Make sure to update db.users
    return newUser;
  };

  const findAllUsers = () => db.users;

  const findUserById = (userId) =>
    db.users.find((user) => user._id === userId);

  // --- ADD THIS FUNCTION ---
  const findUserByUsername = (username) =>
    db.users.find((user) => user.username === username);
  // -------------------------

  const findUserByCredentials = (username, password) =>
    db.users.find(
      (user) => user.username === username && user.password === password
    );

  const updateUser = (userId, userUpdates) => {
    db.users = db.users.map((u) =>
      u._id === userId ? { ...u, ...userUpdates } : u
    );
    return 1;
  };

  const deleteUser = (userId) => {
    const initialLength = db.users.length;
    db.users = db.users.filter((u) => u._id !== userId);
    return db.users.length < initialLength ? 1 : 0;
  };

  return {
    createUser,
    findAllUsers,
    findUserById,
    findUserByUsername, // This will now work
    findUserByCredentials,
    updateUser,
    deleteUser,
  };
}