import { v4 as uuidv4 } from "uuid";

export default function UsersDao(db) {
  let { users } = db;

  const createUser = (user) => {
    // FIX 2: Add default fields for consistency
    const newUser = { 
        ...user, 
        _id: uuidv4(),
        firstName: user.firstName || "New",     // Add default name
        lastName: user.lastName || "User",      // Add default name
        role: user.role || "STUDENT"            // Add default role
        // You can add other missing defaults here (like loginId, section, etc.)
    };
    db.users.push(newUser); 
    return newUser;
};

  const findAllUsers = () => db.users;

  const findUserById = (userId) =>
    db.users.find((user) => user._id === userId);

  // --- ADD THIS FUNCTION ---
  const findUserByUsername = (username) =>
    db.users.find((user) => user.username === username);
  // -------------------------

  // const findUserByCredentials = (username, password) =>
  //   db.users.find(
  //     (user) => user.username === username && user.password === password
  //   );

  const findUserByCredentials = (username, password) => {
  // CRITICAL FIX: Trim whitespace from input to ensure exact match
  const trimmedUsername = username ? username.trim() : username;
  const trimmedPassword = password ? password.trim() : password;
  
  return db.users.find(
    // Ensure the lookup logic uses the trimmed strings
    (user) => user.username === trimmedUsername && user.password === trimmedPassword
  );
};

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