import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { account } from '../appwriteConfig';
import { useNavigate } from 'react-router';
import { ID } from 'appwrite';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUserOnLoad();
  }, []);

  const getUserOnLoad = async () => {
    try {
      const accountDetails = await account.get();
      setUser(accountDetails);
    } catch (error) {
      console.error("Error fetching user session:", error);
      setUser(null);
    }
    setLoading(false);
  };

  const fetchUser = async () => {
    try {
      const accountDetails = await account.get();
      setUser(accountDetails);
    } catch (error) {
      alert(error.message);
      setUser(null);
    }
  };

  const handleUserLogin = async (e, credentials) => {
    e.preventDefault();

    try {
      await account.createEmailPasswordSession(
        credentials.email,
        credentials.password
      );
      await fetchUser();
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleVerification = async () => {
    try {
      await account.createVerification(`${window.location.origin}/verify`);
      alert('Verification email sent!');
    } catch (error) {
      console.error("Verification error:", error);
      alert('You have reached the limit for verification emails. Please try again later.');
    }
  };

  const handleRegister = async (e, credentials) => {
    e.preventDefault();

    if (credentials.password1 !== credentials.password2) {
      alert('Passwords did not match!');
      return;
    }

    try {
      await account.create(
        ID.unique(),
        credentials.email,
        credentials.password1,
        credentials.name
      );

      await account.createEmailPasswordSession(credentials.email, credentials.password1);
      await fetchUser();
      await handleVerification();
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  const contextData = {
    user,
    fetchUser,
    handleUserLogin,
    handleLogout,
    handleVerification,
    handleRegister,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
