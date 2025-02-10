import { useState, useEffect } from 'react';
import client, { databases, DATABASE_ID, COLLECTION_ID_MESSAGES } from '../appwriteConfig';
import { ID, Query, Permission, Role } from 'appwrite';
import Header from '../components/Header';
import { useAuth } from '../utils/hooks/authHook';
import { Trash2 } from 'react-feather';

const Room = () => {
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    getMessages();

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID_MESSAGES}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setMessages((prevState) => [response.payload, ...prevState]);
          console.log('Message created');
        }

        if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          setMessages((prevState) =>
            prevState.filter((message) => message.$id !== response.payload.$id)
          );
          console.log('Message deleted');
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const getMessages = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_MESSAGES,
        [Query.orderDesc('$createdAt')]
      );
      setMessages(response.documents);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to send messages.");
      return;
    }

    const permissions = [Permission.read(Role.any()), Permission.write(Role.user(user.$id))];

    const payload = {
      userid: user.$id,
      username: user.name,
      body: messageBody,
    };

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_MESSAGES,
        ID.unique(),
        payload,
        permissions
      );
      setMessageBody('');
    } catch (error) {
      console.error("Error creating document:", error);
      alert(error.message);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_MESSAGES, id);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert(error.message);
    }
  };

  return (
    <main className="container">
      <Header />
      <div className="room--container">
        <form id="message--form" onSubmit={handleSubmit}>
          <div>
            <textarea
              required
              maxLength="10000"
              placeholder="Type something..."
              onChange={(e) => setMessageBody(e.target.value)}
              value={messageBody}
            ></textarea>
          </div>

          <div className="send-btn--wrapper">
            <input className="btn btn--main" type="submit" value="Send" />
          </div>
        </form>

        <div>
          {messages.map((message) => (
            <div key={message.$id} className={'message--wrapper'}>
              <div className="message--header">
                <p>
                  {message?.username ? <span> {message?.username}</span> : 'Anonymous user'}

                  <small className="message-timestamp">
                    {' '}
                    {new Date(message.$createdAt)
                      .toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })
                      .toUpperCase()}
                  </small>
                </p>

                {message.$permissions.includes(`delete("user:${user?.$id}")`) && (
                  <Trash2 className="delete--btn" onClick={() => deleteMessage(message.$id)} />
                )}
              </div>

              <div className={'message--body' + (message.userid === user?.$id ? ' message--body--owner' : '')}>
                <span>{message.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Room;
